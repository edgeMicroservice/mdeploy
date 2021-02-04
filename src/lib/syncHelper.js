const Promise = require('bluebird');

const {
  map,
  find,
  some,
  every,
} = require('lodash');

const makeNotifier = require('./notifier');
const makeNodesHelper = require('./nodesHelper');
const makeMcmAPIs = require('../external/mcmAPIs');
const makeTokenSelector = require('../lib/tokenSelector');
const makeClientModel = require('../models/clientModel');
const makeClusterModel = require('../models/clusterModel');
const makeContainerModel = require('../models/containerModel');


const { decodePayload } = require('../lib/jwtHelper');

const makeSyncHelper = (context) => {
  const nodesHelper = makeNodesHelper(context);
  const clientModel = makeClientModel(context);
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

  const syncLeaders = () => Promise.all([
    clientModel.selectUserToken()
      .then((accessToken) => nodesHelper.findByAccount(accessToken))
      .then(createClusterInfo),
    clusterModel.fetchCluster(),
  ])
    .then((newCluster, existingCluster) => {
      if (JSON.stringify(newCluster) === JSON.stringify(existingCluster)) return Promise.resolve();

      return clusterModel.persistCluster(newCluster)
        .then((makeNotifier(context).notifyNonLeadersAboutLeader(newCluster)));
    });

  const syncContainers = (newContainer, manualSync) => makeTokenSelector(context)
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
          if (isSame && newContainersData.length !== existingContainersData.length) isSame = false;
          if (isSame) {
            isSame = every(newContainersData, (newCont) => some(existingContainersData, (extCont) => newCont.id === extCont.id));
          }

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

  return {
    syncLeaders,
    syncContainers,
  };
};

module.exports = makeSyncHelper;
