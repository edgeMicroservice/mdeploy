/* eslint-disable no-unused-vars */
const util = require('util');

const response = require('@mimik/edge-ms-helper/response-helper');

const makeClientProcessor = require('../processors/clientProcessor');

const updateClientStatus = (req, res) => {
  const { context, swagger } = req;
  const { jwt, payload } = context.security.token;
  const { status } = swagger.params.newClientStatus;
  const expiresIn = payload.exp - payload.iat;

  makeClientProcessor(context)
    .updateClientStatus(status, jwt, expiresIn)
    .then((result) => {
      const responseObj = status === 'active' ? {
        status: 'active',
        inactiveAfter: payload.exp,
      } : {
        status: 'inactive',
      };
      response.sendResult(responseObj, 200, res);
    })
    .fail((err) => {
      response.sendError(err, res, 400);
    });
};

module.exports = {
  updateClientStatus,
};
