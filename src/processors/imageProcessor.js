const find = require('lodash/find');

const makeMcmAPIs = require('../external/mcmAPIs');
const makeNodesHelper = require('../lib/nodesHelper');
const makeSyncHelper = require('../lib/syncHelper');
const makeDeploymentHelper = require('../lib/deploymentHelper');
const makeTokenSelector = require('../lib/tokenSelector');
const makeBepHelper = require('../lib/bepHelper');
const { debugLog, throwException } = require('../util/logHelper');

const BEP_ENDPOINT = '/bep';

const fetchToken = (context) => makeTokenSelector(context)
  .selectUserToken();

const makeImageProcessor = (context) => {
  const syncHelper = makeSyncHelper(context);

  const updateImage = (newImage) => fetchToken(context)
    .then((accessToken) => makeNodesHelper(context)
      .findByAccount(accessToken)
      .then((nodes) => {
        const { imageUrl } = newImage;

        const currentNode = find(nodes, (node) => node.id === context.info.nodeId);
        if (!currentNode) throwException('Current node cannot be found', { nodeId: context.info.nodeId });

        debugLog('Found currentNode', currentNode);

        const targetNodeLocalHref = find(currentNode.addresses, (address) => address.type === 'local').url.href;

        if (imageUrl) return { targetNodeLocalHref };

        const targetNode = find(nodes, (node) => node.id === newImage.imageHostNodeId);

        debugLog('Found targetNode', targetNode);

        if (!targetNode) throwException('Target node cannot be found', { nodeId: newImage.imageHostNodeId });

        if (currentNode.localLinkNetworkId === targetNode.localLinkNetworkId) {
          return {
            targetNodeLocalHref,
            targetNodeHref: find(targetNode.addresses, (currentAddress) => currentAddress.type === 'local').url.href,
          };
        }
        return makeBepHelper(context)
          .getBep(accessToken, newImage.imageHostNodeId, context.info.serviceType, BEP_ENDPOINT)
          .then((targetNodeUrl) => ({
            targetNodeLocalHref,
            targetNodeHref: targetNodeUrl.href,
          }))
          .catch((err) => {
            throwException('Error occured while fetching BEP', err);
          });
      })
      .then(({ targetNodeLocalHref, targetNodeHref }) => makeDeploymentHelper(context)
        .deployImage(newImage.imageHostNodeId, newImage.imageId, newImage.imageUrl, targetNodeLocalHref, targetNodeHref, accessToken)))
    .finally(() => {
      syncHelper.syncLeaders();
    });

  const getImages = () => fetchToken(context)
    .then((accessToken) => makeMcmAPIs(context)
      .getCachedImages(accessToken))
    .finally(() => {
      syncHelper.syncLeaders();
    });

  const deleteImage = (id) => fetchToken(context)
    .then((accessToken) => makeMcmAPIs(context)
      .deleteCachedImage(id, accessToken))
    .finally(() => {
      syncHelper.syncLeaders();
    });

  return {
    updateImage,
    getImages,
    deleteImage,
  };
};

module.exports = makeImageProcessor;
