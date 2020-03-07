const response = require('@mimik/edge-ms-helper/response-helper');

const makeClientProcessor = require('../processors/clientProcessor');

const ACTIVATION_TAG = 'active';
const DEACTIVATION_TAG = 'inactive';

const updateClientStatus = (req, res) => {
  const { context, swagger } = req;
  const { jwt, payload } = context.security.token;
  const { status } = swagger.params.newClientStatus;
  const expiresIn = payload.exp - payload.iat;

  makeClientProcessor(context)
    .updateClientStatus(status, jwt, expiresIn)
    .then(() => {
      const responseObj = status === ACTIVATION_TAG ? {
        status: ACTIVATION_TAG,
        inactiveAfter: payload.exp,
      } : {
        status: DEACTIVATION_TAG,
      };
      response.sendResult(responseObj, 200, res);
    })
    .catch((err) => {
      response.sendError(err, res, 400);
    });
};

module.exports = {
  updateClientStatus,
};
