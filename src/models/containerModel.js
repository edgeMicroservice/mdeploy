const Promise = require('bluebird');

const {
  map,
  concat,
  filter,
} = require('lodash');

/**
 * Container Model Schema
 * /nodes/{nodeId}/containers = [
 *  {
 *    id: '',
 *    ...other container related properties,
 *  }
 * ]
 */

const SELF_NODE = 'self';
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

  const fetchSelfContainers = () => fetchContainersByNode(SELF_NODE);

  const updateSelfContainer = (containerId, updatedContainer) => fetchContainersByNode(SELF_NODE)
    .then((containers) => {
      let isUpdated;

      const updatedContainers = map(containers, (container) => {
        if (container.id === containerId) {
          isUpdated = true;
          return updatedContainer;
        }
        return container;
      });

      if (!isUpdated) updatedContainers.push(updatedContainer);

      return persistContainers(SELF_NODE, updatedContainers);
    });

  const deleteSelfContainer = (containerId) => fetchContainersByNode(SELF_NODE)
    .then((containers) => {
      const updatedContainers = filter(containers, (container) => container.id !== containerId);

      return persistContainers(SELF_NODE, updatedContainers);
    });


  return {
    fetchAllContainers,
    fetchSelfContainers,
    updateSelfContainer,
    deleteSelfContainer,
    fetchContainersByNode,
    updateContainersByNode,
    deleteContainersByNode,
  };
};

module.exports = makeLeaderModel;
