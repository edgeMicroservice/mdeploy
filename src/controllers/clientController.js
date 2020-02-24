const util = require('util');

const response = require('@mimik/edge-ms-helper/response-helper');

const makeClientProcessor = require('../processors/clientProcessor');

const updateClientStatus = (req, res) => {
  const { context, swagger } = req;

  console.log('===> ', Date.now(), 'req', util.inspect(req, false, null, true));

  const accessToken = swagger;

  makeClientProcessor(context)
    .updateClientStatus(swagger.params.newClientStatus.status, accessToken)
    .then((result) => {
      response.sendResult(result, 200, res);
    })
    .fail((err) => {
      response.sendError(err, res, 400);
    });
};

module.exports = {
  updateClientStatus,
};
