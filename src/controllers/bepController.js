const response = require('@mimik/edge-ms-helper/response-helper');

const makeBepProcessor = require('../processors/bepProcessor');

const getBep = (req, res) => {
  const { context, swagger } = req;

  makeBepProcessor(context)
    .getBep(swagger.params.hmac)
    .then((data) => response.sendResult(data, 200, res))
    .catch((err) => response.sendError(err, res, 400));
};

module.exports = {
  getBep,
};
