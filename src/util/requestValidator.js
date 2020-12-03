const Promise = require('bluebird');

const checkNewImageParams = (newImage) => {
  const { imageHostNodeId, imageUrl, imageId } = newImage;
  if (!imageUrl && !imageHostNodeId) {
    throw Error('Must provide either imageUrl or imageHostNodeId.');
  } else if (imageUrl && imageHostNodeId) {
    throw Error('Provide either imageUrl or imageHostNodeId but not both.');
  } else if (imageHostNodeId && !imageId) {
    throw Error('Provide imageId is required with imageHostNodeId.');
  }
  return Promise.resolve();
};

module.exports = {
  checkNewImageParams,
};
