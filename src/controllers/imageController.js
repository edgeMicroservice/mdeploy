const response = require('@mimik/edge-ms-helper/response-helper');

const makeImageProcessor = require('../processors/imageProcessor');

const postImage = (req, res) => {
  const { context, swagger } = req;

  makeImageProcessor(context)
    .postImage(swagger.params.newImage)
    .then((result) => response.sendResult(result, 201, res))
    .catch((err) => response.sendError(err, res, 400));
};

const getImages = (req, res) => {
  const { context } = req;

  makeImageProcessor(context)
    .getImages()
    .then((data) => response.sendResult({ data }, 200, res))
    .catch((err) => response.sendError(err, res, 400));
};

const deleteImage = (req, res) => {
  const { context, swagger } = req;

  makeImageProcessor(context)
    .deleteImage(swagger.params.id)
    .then(() => response.sendResult({ data: swagger.params.id }, 200, res))
    .catch((err) => response.sendError(err, res, 400));
};

module.exports = {
  getImages,
  postImage,
  deleteImage,
};