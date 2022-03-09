const Promise = require('bluebird');

const makeClientModel = require('../models/clientModel');
const makeSyncHelper = require('../lib/syncHelper');

const { throwException } = require('../util/logHelper');
const { ACTIVATION_TAG, DEACTIVATION_TAG } = require('../lib/common');


const makeClientProcessor = (context) => {
  const syncHelper = makeSyncHelper(context);

  const updateClientStatus = (status) => Promise.resolve()
    .then(() => {
      if (status === ACTIVATION_TAG && (!context.security || !context.security.token)) {
        return throwException('Cannot use endpoint for setting status="active" without edgeAccessToken in the headers');
      }

      if (status === ACTIVATION_TAG) {
        const { jwt, payload } = context.security.token;
        const expiresAt = payload.exp * 1000; // Compare to Date.now() needs milliseconds.

        if (context.info.nodeId !== payload.node_id) {
          return throwException('Incorrect token: wrong nodeId');
        }

        return makeClientModel(context)
          .saveClientToken(jwt, expiresAt)
          .then(() => ({
            status: ACTIVATION_TAG,
            inactiveAfter: expiresAt,
          }));
      }
      return makeClientModel(context)
        .deleteClientToken()
        .then(() => ({
          status: DEACTIVATION_TAG,
        }));
    })
    .finally(syncHelper.syncLeaders);

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
    })
    .finally(syncHelper.syncLeaders);

  return {
    getClientStatus,
    updateClientStatus,
  };
};

module.exports = makeClientProcessor;
