/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
const util = require('util');
const find = require('lodash/find');

const response = require('@mimik/edge-ms-helper/response-helper');

const makeImageProcessor = require('../processors/imageProcessor');

const postImage = (req, res) => {
  const { context, swagger } = req;

  console.log('===> here');

  makeImageProcessor(context)
    .postImage(swagger.params.newImage)
    .then((result) => {
      response.sendResult(result, 201, res);
    })
    .fail((err) => {
      response.sendError(err, res, 400);
    });
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
