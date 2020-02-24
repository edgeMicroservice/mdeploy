/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
const util = require('util');
const find = require('lodash/find');

const response = require('@mimik/edge-ms-helper/response-helper');

const makeImageProcessor = require('../processors/imageProcessor');
const { createToken, verifyToken } = require('../lib/edgeAuthHelper');

const postImage = (req, res) => {
  const { context, swagger } = req;

  console.log('===> postImage');
  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNjQyNDM4ODI3Mzg5NjE2MTI4IiwianRpIjoiYWNESFByRHZBNHV1TnVseGpYQWJ1eWVfZkhLVXJJTDM2ZkM4eHpmTWZfTiIsImNsaWVudF9pZCI6IjBhOGQzNjhlLTc3MDgtNGMxYy1iNzA1LWQ2ZDk0MzdiYjIwYyIsImF6cCI6IkEyMjkwMzIzOTA5MDYzNzQ0MzczIiwiaXNzIjoiaHR0cHM6Ly9taWQtc3RnLm1pbWlrMzYwLmNvbS9tSUQvdjEvb2F1dGgvdG9rZW4iLCJub2RlX2lkIjoiNjViMWNlNzZhODBkMzBlYTMzMThmNWQ1YjkzOWMyOTg5MDFkNjgwMDBlODRlYWI5MmQ0ZTkxOTAiLCJhdWQiOlsiaHR0cHM6Ly9taW1payIsImh0dHBzOi8vbXN0LXN0Zy5taW1pazM2MC5jb20vbVNUL3YxL2NsaWVudHMvR2VuZXJpYy1lZGdlIl0sInNjb3BlIjoib3BlbmlkIGVkZ2U6bWNtIGVkZ2U6Y2x1c3RlcnMgZWRnZTphY2NvdW50OmFzc29jaWF0ZSBlZGdlOnJlYWQ6YWNjb3VudGtleSIsImlhdCI6MTU4MjMxNjU0NCwiZXhwIjoxNTk3ODY4NTQ0fQ.TJjca4DYOPaqLbK_OjVoipMUcbPm7Nxhhwh_K70vA10';

  makeImageProcessor(context)
    .postImage(swagger.params.newImage, accessToken)
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
