const Promise = require('bluebird');

const makeClientModel = require('../models/clientModel');
const { throwException } = require('../util/logHelper');
const { ACTIVATION_TAG, DEACTIVATION_TAG } = require('../lib/common');

const makeClientProcessor = (context) => {
  const updateClientStatus = (status) => {
    if (status === ACTIVATION_TAG && (!context.security || !context.security.token)) {
      return Promise.resolve()
        .then(() => {
          throwException('Cannot use endpoint for setting status="active" without edgeAccessToken in the headers');
        });
    }

    if (status === ACTIVATION_TAG) {
      const { jwt, payload } = context.security.token;
      const expiresIn = payload.exp * 1000; // Compare to Date.now() needs milliseconds.

      return makeClientModel(context)
        .saveClientToken(jwt, expiresIn)
        .then(() => ({
          status: ACTIVATION_TAG,
          inactiveAfter: expiresIn,
        }));
    }
    return makeClientModel(context)
      .deleteClientToken()
      .then(() => ({
        status: DEACTIVATION_TAG,
      }));
  };

  const getClientStatus = () => makeClientModel(context)
    .fetchClientTokenData()
    .then((tokenData) => {
      if (tokenData.accessToken) {
        return {
          status: ACTIVATION_TAG,
          inactiveAfter: tokenData.expiresAt,
        };
      }
      return {
        status: DEACTIVATION_TAG,
      };
    });

  return {
    getClientStatus,
    updateClientStatus,
  };
};

module.exports = makeClientProcessor;
