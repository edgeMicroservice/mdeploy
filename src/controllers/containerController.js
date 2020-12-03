const response = require('@mimik/edge-ms-helper/response-helper');
const makeContainerProcessor = require('../processors/containerProcessor');
const { checkNewImageParams } = require('../util/requestValidator');

const getContainers = (req, res) => {
  const { context } = req;

  makeContainerProcessor(context)
    .getContainers()
    .then((data) => response.sendResult({ data }, 200, res))
    .catch((err) => response.sendError(err, res, 400));
};

const postContainer = (req, res) => {
  const { context, swagger } = req;

  checkNewImageParams(swagger.params.newContainer)
    .then(() => makeContainerProcessor(context)
      .postContainer(swagger.params.newContainer)
      .then((data) => response.sendResult({ data }, 201, res)))
    .catch((err) => response.sendError(err, res, 400));
};

const deleteContainer = (req, res) => {
  const { context, swagger } = req;

  makeContainerProcessor(context)
    .deleteContainer(swagger.params.id)
    .then(() => response.sendResult({ data: swagger.params.id }, 200, res))
    .catch((err) => response.sendError(err, res, 400));
};

module.exports = {
  getContainers,
  postContainer,
  deleteContainer,
};
