const response = require('@mimik/edge-ms-helper/response-helper');
const makeNodeProcessor = require('../processors/nodeProcessor');

const getNodes = (req, res) => {
  const { context, security, swagger } = req;

  makeNodeProcessor(context)
    .getNodes(security, swagger.params)
    .then((data) => response.sendResult({ data }, 200, res))
    .fail((err) => response.sendError(err, res, 400));
};

module.exports = {
  getNodes,
};
