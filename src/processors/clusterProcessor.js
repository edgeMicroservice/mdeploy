const Promise = require('bluebird');

const { keys } = require('lodash');

const makeSyncHelper = require('../lib/syncHelper');
const makeContainerModel = require('../models/containerModel');

const makeClusterProcessor = (context) => {
  const syncHelper = makeSyncHelper(context);
  const leaderModel = makeContainerModel(context);

  const updateContainersInCluster = (containersUpdate) => {
    const nodeContainersMap = {};

    containersUpdate.forEach((container) => {
      const { nodeId } = container;

      if (!nodeContainersMap[nodeId]) nodeContainersMap[nodeId] = [];

      nodeContainersMap[nodeId].push(container);
    });

    const nodeIds = keys(nodeContainersMap);

    return Promise.map(nodeIds, (nodeId) => leaderModel.updateContainersByNode(nodeId, nodeContainersMap[nodeId]))
      .then(() => containersUpdate)
      .finally(() => {
        syncHelper.syncLeaders();
      });
  };

  return {
    updateContainersInCluster,
  };
};

module.exports = makeClusterProcessor;
