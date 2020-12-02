const response = require('@mimik/edge-ms-helper/response-helper');

const checkNewImageParams = (res, newImage) => {
  const { imageHostNodeId, imageUrl, imageId } = newImage;
  if (imageUrl && imageHostNodeId) {
    response.sendError(Error('Provide either imageUrl or imageHostNodeId but not both.'), res, 400);
  } else if (imageHostNodeId && !imageId) {
    response.sendError(Error('Provide imageId is required with imageHostNodeId.'), res, 400);
  }
};

module.exports = {
  checkNewImageParams,
};
