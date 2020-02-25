const makeMcmAPIs = require('../lib/mcmAPIs');
const makeTokenSelector = require('../lib/tokenSelector');

const fetchToken = (context) => makeTokenSelector(context)
  .selectUserToken();

const makeContainerProcessor = (context) => {
  const getContainers = () => fetchToken()
    .then((accessToken) => makeMcmAPIs(context)
      .getDeployedContainers(accessToken));

  const postContainer = (containerRequest) => fetchToken()
    .then((accessToken) => makeMcmAPIs(context)
      .deployContainer(
        containerRequest.imageName, containerRequest.name, containerRequest.env, accessToken,
      ));

  const deleteContainer = (containerId) => fetchToken()
    .then((accessToken) => makeMcmAPIs(context)
      .undeployContainer(containerId, accessToken));

  return {
    getContainers,
    postContainer,
    deleteContainer,
  };
};

module.exports = makeContainerProcessor;
