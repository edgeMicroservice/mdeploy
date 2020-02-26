const response = require('@mimik/edge-ms-helper/response-helper');

const makeClusterOpsProcessor = require('../processors/clusterOpsProcessor');

const createClusterOp = (req, res) => {
  const { context, swagger } = req;

  makeClusterOpsProcessor(context)
    .createClusterOp(swagger.params.newClusterOp, context.security.token.jwt)
    .then((data) => response.sendResult({ data }, 201, res))
    .fail((err) => response.sendError(err, res, 400));
};

module.exports = {
  createClusterOp,
};
