const makeImageProcessor = require('./imageProcessor');

const makeMcmAPIs = require('../external/mcmAPIs');

const makeSyncHelper = require('../lib/syncHelper');
const makeTokenSelector = require('../lib/tokenSelector');
const makeDeploymentHelper = require('../lib/deploymentHelper');
const makeContainerModel = require('../models/containerModel');

const { debugLog } = require('../util/logHelper');
const { fetchRequestOptions } = require('../util/requestUtil');

const fetchToken = (context) => makeTokenSelector(context)
  .selectUserToken();

const makeContainerProcessor = (context) => {
  const mcmAPIs = makeMcmAPIs(context);
  const syncHelper = makeSyncHelper(context);

  const getContainers = (node) => Promise.resolve()
    .then(() => {
      const containerModel = makeContainerModel(context);

      if (!node) containerModel.fetchContainersByNode(context.info.node_id);

      switch (node) {
        case fetchRequestOptions.all:
          return containerModel.fetchAllContainers();
        case fetchRequestOptions.self:
          return containerModel.fetchContainersByNode(context.info.node_id);
        default:
          return containerModel.fetchContainersByNode(node);
      }
    })
    .finally(() => {
      syncHelper.syncContainers();
      syncHelper.syncLeaders();
    });

  const updateContainer = (containerRequest, triedDeployingImage = false) => fetchToken(context)
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
    .then((newContainer) => {
      syncHelper.syncContainers(newContainer);
      return newContainer;
    })
    .finally(() => {
      syncHelper.syncLeaders();
    });

  const deleteContainer = (containerId) => fetchToken(context)
    .then((accessToken) => mcmAPIs
      .undeployContainer(containerId, accessToken))
    .then((response) => {
      const { notifyApp } = makeDeploymentHelper(context);
      notifyApp('container.delete', response);
      return response;
    })
    .finally(() => {
      syncHelper.syncContainers();
      syncHelper.syncLeaders();
    });

  return {
    getContainers,
    updateContainer,
    deleteContainer,
  };
};

module.exports = makeContainerProcessor;
