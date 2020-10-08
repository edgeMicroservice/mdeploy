const response = require('@mimik/edge-ms-helper/response-helper');
const makeNodeProcessor = require('../processors/nodeProcessor');

const getNodes = (req, res) => {
  const { context } = req;

  makeNodeProcessor(context)
    .getNodes()
    .then((data) => response.sendResult({ data }, 200, res))
    .catch((err) => response.sendError(err, res, 400));
};

module.exports = {
  getNodes,
};
