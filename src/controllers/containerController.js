const response = require('@mimik/edge-ms-helper/response-helper');
const makeContainerProcessor = require('../processors/containerProcessor');

const { checkNewContainerParams } = require('../util/requestValidator');
const { fetchRequestOptions } = require('../util/requestUtil');

const getContainers = (req, res) => {
  const { context, swagger } = req;

  const { node } = swagger.params;
  const { env } = context;

  if (node && node !== fetchRequestOptions.self && env.IS_LEADER !== 'yes') {
    response.sendError(new Error('Can only use node=self on non-leader mdeploys'), res, 400);
    return;
  }

  makeContainerProcessor(context)
    .getContainers(node)
    .then((data) => response.sendResult({ data }, 200, res))
    .catch((err) => response.sendError(err, res, 400));
};

const updateContainer = (req, res) => {
  const { context, swagger } = req;

  checkNewContainerParams(swagger.params.newContainer)
    .then(() => makeContainerProcessor(context)
      .updateContainer(swagger.params.newContainer)
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
  updateContainer,
  deleteContainer,
};
