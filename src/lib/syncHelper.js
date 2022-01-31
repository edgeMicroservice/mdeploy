const Promise = require('bluebird');

const {
  map,
  find,
  some,
} = require('lodash');

const makeNotifier = require('./notifier');
const makeNodesHelper = require('./nodesHelper');
const makeMcmAPIs = require('../external/mcmAPIs');
const makeTokenSelector = require('../lib/tokenSelector');
const makeClusterModel = require('../models/clusterModel');
const makeContainerModel = require('../models/containerModel');

const { decodePayload } = require('../lib/jwtHelper');

const makeSyncHelper = (context) => {
  const isLeader = context.env.IS_LEADER === 'yes';

  const nodesHelper = makeNodesHelper(context);
  const tokenSelector = makeTokenSelector(context);
  const clusterModel = makeClusterModel(context);
  const containerModel = makeContainerModel(context);

  const createClusterInfo = (nodes) => {
    const { serviceType } = context.info;

    return map(nodes, (node) => {
      const isMdeploy = some(node.services, (service) => serviceType === service.serviceType);

      return {
        nodeId: node.id,
        isMdeploy,
      };
    });
  };

  const syncLeaders = () => {
    if (!isLeader) return Promise.resolve();

    return Promise.all([
      tokenSelector.selectUserToken()
        .then((accessToken) => nodesHelper.findByAccount(accessToken))
        .then(createClusterInfo),
      clusterModel.fetchCluster(),
    ])
      .then(([newCluster, existingCluster]) => {
        if (JSON.stringify(newCluster) === JSON.stringify(existingCluster)) return Promise.resolve();

        return clusterModel.persistCluster(newCluster)
          .then(() => (makeNotifier(context).notifyNonLeadersAboutLeader(newCluster)));
      });
  };

  const syncContainers = (newContainer, manualSync) => {
    if (isLeader) return Promise.resolve();

    return tokenSelector
      .selectUserToken()
      .then((accessToken) => {
        const currentNodeId = decodePayload(accessToken).node_id;

        return Promise.all([
          makeMcmAPIs(context).getDeployedContainers(accessToken),
          containerModel.fetchContainersByNode(currentNodeId),
        ])
          .then(([newContainersData, existingContainersData]) => {
            let isSame = true;

            if (manualSync) isSame = false;
            if (newContainer) isSame = false;

            if (isSame && JSON.stringify(newContainersData) !== JSON.stringify(existingContainersData)) isSame = false;

            if (isSame) return Promise.resolve(existingContainersData);

            const updatedContainersData = map(newContainersData, (newCont) => {
              if (newContainer && newCont.id === newContainer.id) {
                return { ...newCont, ...newContainer };
              }

              const foundCont = find(existingContainersData, (extCont) => extCont.id === newCont.id) || {};

              return { ...newCont, ...foundCont };
            });

            return containerModel.updateContainersByNode(currentNodeId, updatedContainersData)
              .then(() => makeNotifier(context).notifyLeadersAboutContainers(updatedContainersData));
          });
      });
  };

  return {
    syncLeaders,
    syncContainers,
  };
};

module.exports = makeSyncHelper;
