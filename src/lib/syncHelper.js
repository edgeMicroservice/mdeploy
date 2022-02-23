const Promise = require('bluebird');

const {
  map,
  some,
} = require('lodash');

const makeNotifier = require('./notifier');
const makeNodesHelper = require('./nodesHelper');
const makeTokenSelector = require('../lib/tokenSelector');
const makeClusterModel = require('../models/clusterModel');
const makeContainerModel = require('../models/containerModel');

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

  const syncContainers = () => {
    if (isLeader) return Promise.resolve();

    return containerModel.fetchSelfContainers()
      .then((containers) => makeNotifier(context).notifyLeadersAboutContainers(containers));
  };

  return {
    syncLeaders,
    syncContainers,
  };
};

module.exports = makeSyncHelper;
