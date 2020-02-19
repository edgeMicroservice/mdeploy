/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
const Q = require('q');
const find = require('lodash/find');

const makeMcmAPIs = require('../lib/mcmAPIs');

const makeContainerProcessor = (context) => {
  const getContainers = () => {
    const { getDeployedContainers } = makeMcmAPIs(context);

    return getDeployedContainers();
  };

  const postContainer = (containerRequest) => {
    const { deployContainer } = makeMcmAPIs(context);

    return deployContainer(containerRequest.imageName, containerRequest.name, containerRequest.env);
  };

  const deleteContainer = (containerId) => {
    const { undeployContainer } = makeMcmAPIs(context);

    return undeployContainer(containerId);
  };

  return {
    getContainers,
    postContainer,
    deleteContainer,
  };
};

module.exports = makeContainerProcessor;
