const Promise = require('bluebird');

const makeImageProcessor = require('./imageProcessor');

const makeMcmAPIs = require('../external/mcmAPIs');

const makeSyncHelper = require('../lib/syncHelper');
const makeTokenSelector = require('../lib/tokenSelector');
const makeDeploymentHelper = require('../lib/deploymentHelper');
const makeContainerModel = require('../models/containerModel');

const { debugLog } = require('../util/logHelper');
const { fetchRequestOptions } = require('../util/requestUtil');

const makeContainerProcessor = (context) => {
  const fetchToken = () => makeTokenSelector(context).selectUserToken();

  const mcmAPIs = makeMcmAPIs(context);
  const syncHelper = makeSyncHelper(context);

  const getContainers = (node) => Promise.resolve()
    .then(() => {
      const containerModel = makeContainerModel(context);

      switch (node) {
        case undefined:
        case fetchRequestOptions.self:
        case context.info.node_id:
          return fetchToken().then((accessToken) => mcmAPIs.getDeployedContainers(accessToken));
        case fetchRequestOptions.all:
          return fetchToken().then((accessToken) => Promise.all([mcmAPIs.getDeployedContainers(accessToken), containerModel.fetchAllContainers()]))
            .then(([selfContainers, allOtherContainers]) => [...selfContainers, ...allOtherContainers]);
        default:
          return containerModel.fetchContainersByNode(node);
      }
    })
    .finally(() => Promise.all([syncHelper.syncContainers, syncHelper.syncLeaders]));

  const updateContainer = (containerRequest, triedDeployingImage = false) => fetchToken()
    .then((accessToken) => mcmAPIs
      .deployContainer(
        containerRequest.imageId, containerRequest.name, containerRequest.env, accessToken,
      ))
    .then((response) => {
      const { notifyApp } = makeDeploymentHelper(context);
      notifyApp('container.post', response);
      return response;
    })
    .catch((error) => {
      const { imageId, imageHostNodeId, imageUrl } = containerRequest;
      if ((imageHostNodeId || imageUrl) && !triedDeployingImage && error.message.indexOf('cannot find image with name') > 0) {
        debugLog('Cannot find image in mCM, requesting from provided imageUrl or imageHostNodeId and imageId', {
          imageHostNodeId,
          imageId,
        });
        return makeImageProcessor(context)
          .updateImage(containerRequest)
          .then(() => updateContainer(containerRequest, true));
      }
      throw error;
    })
    .then((newContainer) => Promise.all([() => syncHelper.syncContainers(newContainer), syncHelper.syncLeaders])
      .then(() => newContainer));

  const deleteContainer = (containerId) => fetchToken()
    .then((accessToken) => mcmAPIs
      .undeployContainer(containerId, accessToken))
    .then((response) => {
      const { notifyApp } = makeDeploymentHelper(context);
      notifyApp('container.delete', response);
      return containerId;
    })
    .finally(() => Promise.all([syncHelper.syncContainers(undefined, true), syncHelper.syncLeaders]));

  return {
    getContainers,
    updateContainer,
    deleteContainer,
  };
};

module.exports = makeContainerProcessor;
