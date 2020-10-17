const response = require('@mimik/edge-ms-helper/response-helper');

const makeClientProcessor = require('../processors/clientProcessor');

const updateClientStatus = (req, res) => {
  const { context, swagger } = req;
  const { status } = swagger.params.newClientStatus;

  return makeClientProcessor(context)
    .updateClientStatus(status)
    .then((result) => {
      response.sendResult(result, 200, res);
    })
    .catch((err) => {
      response.sendError(err, res, 400);
    });
};

const getClientStatus = (req, res) => {
  const { context } = req;

  return makeClientProcessor(context)
    .getClientStatus()
    .then((result) => {
      response.sendResult(result, 200, res);
    })
    .catch((err) => {
      response.sendError(err, res, 400);
    });
};

module.exports = {
  getClientStatus,
  updateClientStatus,
};
