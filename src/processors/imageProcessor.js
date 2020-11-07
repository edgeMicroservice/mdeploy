const find = require('lodash/find');

const makeMcmAPIs = require('../lib/mcmAPIs');
const makeNodesHelper = require('../lib/nodesHelper');
const makeDeploymentHelper = require('../lib/deploymentHelper');
const makeTokenSelector = require('../lib/tokenSelector');
const makeBepHelper = require('../lib/bepHelper');
const { debugLog, throwException } = require('../util/logHelper');

const BEP_ENDPOINT = '/bep';

const fetchToken = (context) => makeTokenSelector(context)
  .selectUserToken();

const makeImageProcessor = (context) => {
  const postImage = (newImage) => fetchToken(context)
    .then((accessToken) => makeNodesHelper(context)
      .findByAccount(accessToken)
      .then((nodes) => {
        const targetNode = find(nodes, (node) => node.id === newImage.nodeId);
        if (!targetNode) throwException('Target node cannot be found', { nodeId: newImage.nodeId });

        const currentNode = find(nodes, (node) => node.id === context.info.nodeId);
        if (!currentNode) throwException('Current node cannot be found', { nodeId: context.info.nodeId });

        debugLog('Found targetNode', targetNode);
        debugLog('Found currentNode', currentNode);

        const targetNodeLocalHref = find(currentNode.addresses, (address) => address.type === 'local').url.href;

        if (currentNode.localLinkNetworkId === targetNode.localLinkNetworkId) {
          return {
            targetNodeLocalHref,
            targetNodeHref: find(targetNode.addresses, (currentAddress) => currentAddress.type === 'local').url.href,
          };
        }
        return makeBepHelper(context)
          .getBep(accessToken, newImage.nodeId, context.info.serviceType, BEP_ENDPOINT)
          .then((targetNodeUrl) => ({
            targetNodeLocalHref,
            targetNodeHref: targetNodeUrl.href,
          }))
          .catch((err) => {
            throwException('Error occured while fetching BEP', err);
          });
      })
      .then(({ targetNodeLocalHref, targetNodeHref }) => makeDeploymentHelper(context)
        .deployImage(newImage.nodeId, targetNodeLocalHref, targetNodeHref, newImage.imageId, accessToken)));

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
