const find = require('lodash/find');

const makeMcmAPIs = require('../lib/mcmAPIs');
const makeNodesHelper = require('../lib/nodesHelper');
const makeDeploymentHelper = require('../lib/deploymentHelper');
const makeTokenSelector = require('../lib/tokenSelector');

const fetchToken = (context) => makeTokenSelector(context)
  .selectUserToken();

const makeImageProcessor = (context) => {
  const postImage = (newImage) => fetchToken()
    .then((accessToken) => makeNodesHelper(context)
      .findByAccount(accessToken)
      .then((nodes) => {
        const node = find(nodes, (currentNode) => currentNode.id === newImage.nodeId);
        if (!node) throw new Error(`Node with id: ${newImage.nodeId} cannot be found`);

        return find(node.addresses, (currentAddress) => currentAddress.type === 'local').url.href; // TODO ammend this line
      })
      .then((nodeUrl) => makeDeploymentHelper(context)
        .deployService(newImage.nodeId, nodeUrl, newImage.imageId, accessToken)));

  const getImages = () => fetchToken()
    .then((accessToken) => makeMcmAPIs(context)
      .getCachedImages(accessToken));

  const deleteImage = (id) => fetchToken()
    .then((accessToken) => makeMcmAPIs(context)
      .deleteCachedImage(id, accessToken));

  return {
    postImage,
    getImages,
    deleteImage,
  };
};

module.exports = makeImageProcessor;
