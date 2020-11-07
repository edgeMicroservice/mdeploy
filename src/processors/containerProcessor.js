const makeMcmAPIs = require('../lib/mcmAPIs');
const makeTokenSelector = require('../lib/tokenSelector');
const makeImageProcessor = require('./imageProcessor');

const { debugLog } = require('../util/logHelper');
const { extractFromServiceType } = require('../util/serviceNameHelper');

const fetchToken = (context) => makeTokenSelector(context)
  .selectUserToken();

const makeContainerProcessor = (context) => {
  const getContainers = () => fetchToken(context)
    .then((accessToken) => makeMcmAPIs(context)
      .getDeployedContainers(accessToken));

  const postContainer = (containerRequest, triedDeployingImage = false) => fetchToken(context)
    .then((accessToken) => makeMcmAPIs(context)
      .deployContainer(
        containerRequest.imageName, containerRequest.name, containerRequest.env, accessToken,
      ))
    .catch((error) => {
      if (containerRequest.imageHostNodeId && !triedDeployingImage && error.message.indexOf('cannot find image with name') > 0) {
        const { projectClientId } = extractFromServiceType(context.info.serviceType);
        const imageId = `${projectClientId}-${containerRequest.imageName}`;

        debugLog('Cannot find image in mCM, requesting from provided imageHostNodeId, with calculated imageId', {
          imageHostNodeId: containerRequest.imageHostNodeId,
          imageName: containerRequest.imageName,
          imageId,
        });
        return makeImageProcessor(context)
          .postImage({
            imageId,
            nodeId: containerRequest.imageHostNodeId,
          })
          .then(() => postContainer(containerRequest, true));
      }
      throw error;
    });

  const deleteContainer = (containerId) => fetchToken(context)
    .then((accessToken) => makeMcmAPIs(context)
      .undeployContainer(containerId, accessToken));

  return {
    getContainers,
    postContainer,
    deleteContainer,
  };
};

module.exports = makeContainerProcessor;
