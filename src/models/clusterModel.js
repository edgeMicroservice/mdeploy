const Promise = require('bluebird');

/**
 * Cluster Model Schema
 * cluster = [
 *  {
 *    nodeId: --node-id--,
 *    isMdeploy: --services--,
 *  }
 * ]
 */

const STORAGE_ID = 'cluster';

const makeClusterModel = (context) => {
  const { storage } = context;

  const fetchCluster = () => {
    const clusterStr = storage.getItem(STORAGE_ID);
    const cluster = !clusterStr || clusterStr === '' ? [] : JSON.parse(clusterStr);
    return Promise.resolve(cluster);
  };

  const persistCluster = (cluster) => {
    const clusterStr = JSON.stringify(cluster);
    storage.setItem(STORAGE_ID, clusterStr);
    return Promise.resolve(cluster);
  };

  return {
    fetchCluster,
    persistCluster,
  };
};

module.exports = makeClusterModel;
