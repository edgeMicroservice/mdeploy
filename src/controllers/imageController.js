/* eslint-disable no-unused-vars */
const util = require('util');

const response = require('@mimik/edge-ms-helper/response-helper');

const makeImageProcessor = require('../processors/imageProcessor');

const postImage = (req, res) => {
  const { context, swagger, http } = req;

  console.log('===> ', Date.now(), 'req', util.inspect(req, false, null, true));


  response.sendResult('Configuration Updated', 201, res);
};

const getImages = (req, res) => {
  const { context } = req;

  makeImageProcessor(context)
    .getImages()
    .then((data) => response.sendResult({ data }, 200, res))
    .fail((err) => response.sendError(err, res, 400));
};

const deleteImage = (req, res) => {
  const { context, swagger } = req;

  makeImageProcessor(context)
    .deleteImage(swagger.params.id)
    .then((data) => response.sendResult({ data }, 200, res))
    .fail((err) => response.sendError(err, res, 400));
};

module.exports = {
  getImages,
  postImage,
  deleteImage,
};
