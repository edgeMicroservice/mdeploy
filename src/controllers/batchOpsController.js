const response = require('@mimik/edge-ms-helper/response-helper');

const makeBatchOpsProcessor = require('../processors/batchOpsProcessor');

const createBatchOp = (req, res) => {
  const { context, swagger } = req;

  makeBatchOpsProcessor(context)
    .createBatchOp(swagger.params.newBatchOp, context.security.token.jwt)
    .then((data) => response.sendResult({ data }, 201, res))
    .catch((err) => response.sendError(err, res, 400));
};

module.exports = {
  createBatchOp,
};
