const Promise = require('bluebird');

const checkNewImageParams = (newImage) => new Promise((resolve, reject) => {
  const { imageHostNodeId, imageUrl, imageId } = newImage;
  if (!imageUrl && !imageHostNodeId) {
    reject(new Error('Must provide either imageUrl or imageHostNodeId.'));
  } else if (imageUrl && imageHostNodeId) {
    reject(new Error('Provide either imageUrl or imageHostNodeId but not both.'));
  } else if (imageHostNodeId && !imageId) {
    reject(new Error('Provide imageId is required with imageHostNodeId.'));
  }
  return resolve();
});

module.exports = {
  checkNewImageParams,
};
