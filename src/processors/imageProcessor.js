/* eslint-disable max-len */
/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
const Q = require('q');
const find = require('lodash/find');

const makeMcmAPIs = require('../lib/mcmAPIs');
const makeNodesHelper = require('../lib/nodesHelper');
const makeDeploymentHelper = require('../lib/deploymentHelper');
const makeTokenSelector = require('../lib/tokenSelector');

const makeImageProcessor = (context) => {
  const postImage = (newImage) => {
    return makeTokenSelector(context)
      .selectUserToken()
      .then((accessToken) => {
        return makeNodesHelper(context)
          .findByAccount(accessToken)
          .then((nodes) => {
            const node = find(nodes, (currentNode) => currentNode.id === newImage.nodeId);
            if (!node) throw new Error(`Node with id: ${newImage.nodeId} cannot be found`);

            return find(node.addresses, (currentAddress) => currentAddress.type === 'local').url.href; // TODO ammend this line
          })
          .then((nodeUrl) => {
            return makeDeploymentHelper(context)
              .deployService(newImage.nodeId, nodeUrl, newImage.imageId, accessToken);
          });
      });
  };

  const getImages = () => makeMcmAPIs(context).getCachedImages();

  const deleteImage = (id) => makeMcmAPIs(context).deleteCachedImage(id);

  return {
    postImage,
    getImages,
    deleteImage,
  };
};

module.exports = makeImageProcessor;
