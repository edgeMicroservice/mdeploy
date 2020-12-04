const Promise = require('bluebird');

const checkNewImageParams = (newImage) => new Promise((resolve, reject) => {
  const { imageHostNodeId, imageUrl, imageId } = newImage;
  let errorMessage;

  if (!imageUrl && !imageHostNodeId) {
    errorMessage = new Error('Must provide either imageUrl or imageHostNodeId.');
  } if (imageUrl && imageHostNodeId) {
    errorMessage = new Error('Provide either imageUrl or imageHostNodeId but not both.');
  } if (imageHostNodeId && !imageId) {
    errorMessage = new Error('Provide imageId is required with imageHostNodeId.');
  }

  if (!errorMessage) return resolve();

  return reject(errorMessage);
});

module.exports = {
  checkNewImageParams,
};
