const Promise = require('bluebird');

const { concat } = require('lodash');

/**
 * Container Model Schema
 * /nodes/{nodeId}/containers = [
 *  {
 *    id: '',
 *    ...other container related properties,
 *  }
 * ]
 */

const STORAGE_TAG = 'nodes/containers';
const getStorageId = (nodeId) => `/nodes/${nodeId}/containers`;

const makeLeaderModel = (context) => {
  const { storage } = context;

  const fetchAllContainers = () => {
    let allContainers = [];
    storage.eachItemByTag(STORAGE_TAG, (key, containersStr) => {
      const containers = JSON.parse(containersStr);
      allContainers = concat(allContainers, containers);
    });
    return Promise.resolve(allContainers);
  };

  const fetchContainersByNode = (nodeId) => {
    const storageId = getStorageId(nodeId);
    const containersStr = storage.getItem(storageId);
    const containers = !containersStr || containersStr === '' ? [] : JSON.parse(containersStr);
    return Promise.resolve(containers);
  };

  const persistContainers = (nodeId, containers) => {
    const storageId = getStorageId(nodeId);
    const containersStr = JSON.stringify(containers);
    storage.setItemWithTag(storageId, containersStr, STORAGE_TAG);
    return Promise.resolve(containers);
  };

  const updateContainersByNode = (nodeId, containers) => persistContainers(nodeId, containers);

  const deleteContainersByNode = (nodeId) => persistContainers(nodeId, []);


  return {
    fetchAllContainers,
    fetchContainersByNode,
    updateContainersByNode,
    deleteContainersByNode,
  };
};

module.exports = makeLeaderModel;
