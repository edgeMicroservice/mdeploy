const find = require('lodash/find');

const makeMcmAPIs = require('../lib/mcmAPIs');
const makeNodesHelper = require('../lib/nodesHelper');
const makeDeploymentHelper = require('../lib/deploymentHelper');
const makeTokenSelector = require('../lib/tokenSelector');
const makeBepHelper = require('../lib/bepHelper');

const BEP_ENDPOINT = '/bep';

const fetchToken = (context) => makeTokenSelector(context)
  .selectUserToken();

const makeImageProcessor = (context) => {
  const postImage = (newImage) => fetchToken(context)
    .then((accessToken) => makeNodesHelper(context)
      .findByAccount(accessToken)
      .then((nodes) => {
        const targetNode = find(nodes, (node) => node.id === newImage.nodeId);
        if (!targetNode) throw new Error(`Target node with id: ${newImage.nodeId} cannot be found`);

        const currentNode = find(nodes, (node) => node.id === context.info.nodeId);
        if (!currentNode) throw new Error(`Current node with id: ${context.info.nodeId} cannot be found`);

        console.log(`targetNode: ${JSON.stringify(targetNode, null, 2)}`);
        console.log(`currentNode: ${JSON.stringify(currentNode, null, 2)}`);
        if (currentNode.localLinkNetworkId === targetNode.localLinkNetworkId) {
          return find(targetNode.addresses, (currentAddress) => currentAddress.type === 'local').url.href;
        }
        return makeBepHelper(context)
          .getBep(accessToken, newImage.nodeId, context.info.serviceType, BEP_ENDPOINT)
          .then((result) => result.href)
          .catch((err) => {
            throw new Error(`Error occured while fetching BEP: ${JSON.stringify(err, null, 2)}`);
          });
      })
      .then((nodeUrl) => makeDeploymentHelper(context)
        .deployImage(newImage.nodeId, nodeUrl, newImage.imageId, accessToken)));

  const getImages = () => fetchToken(context)
    .then((accessToken) => makeMcmAPIs(context)
      .getCachedImages(accessToken));

  const deleteImage = (id) => fetchToken(context)
    .then((accessToken) => makeMcmAPIs(context)
      .deleteCachedImage(id, accessToken));

  return {
    postImage,
    getImages,
    deleteImage,
  };
};

module.exports = makeImageProcessor;
