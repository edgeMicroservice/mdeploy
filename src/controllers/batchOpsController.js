const response = require('@mimik/edge-ms-helper/response-helper');

const makeBatchOpsProcessor = require('../processors/batchOpsProcessor');

const createBatchOp = (req, res) => {
  const { context, swagger } = req;
  let jwt;

  if (context.security && context.security.token && context.security.token.jwt) {
    jwt = context.security.token.jwt;
  }

  makeBatchOpsProcessor(context)
    .createBatchOp(swagger.params.newBatchOp, jwt)
    .then((data) => response.sendResult({ data }, 201, res))
    .catch((err) => response.sendError(err, res, 400));
};

module.exports = {
  createBatchOp,
};
