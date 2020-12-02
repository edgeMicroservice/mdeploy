const makeMcmAPIs = require('../lib/mcmAPIs');
const makeTokenSelector = require('../lib/tokenSelector');
const makeImageProcessor = require('./imageProcessor');

const { debugLog } = require('../util/logHelper');

const fetchToken = (context) => makeTokenSelector(context)
  .selectUserToken();

const makeContainerProcessor = (context) => {
  const getContainers = () => fetchToken(context)
    .then((accessToken) => makeMcmAPIs(context)
      .getDeployedContainers(accessToken));

  const postContainer = (containerRequest, triedDeployingImage = false) => fetchToken(context)
    .then((accessToken) => makeMcmAPIs(context)
      .deployContainer(
        containerRequest.imageId, containerRequest.name, containerRequest.env, accessToken,
      ))
    .catch((error) => {
      const { imageId, imageHostNodeId, imageUrl } = containerRequest;
      if ((imageHostNodeId || imageUrl) && !triedDeployingImage && error.message.indexOf('cannot find image with name') > 0) {
        debugLog('Cannot find image in mCM, requesting from provided imageUrl or imageHostNodeId and imageId', {
          imageHostNodeId,
          imageId,
        });
        return makeImageProcessor(context)
          .postImage(containerRequest)
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
