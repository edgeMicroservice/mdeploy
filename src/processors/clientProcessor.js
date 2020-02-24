/* eslint-disable padded-blocks */
/* eslint-disable no-unused-vars */
const makeClientModel = require('../models/clientModel');
const { decodePayload } = require('../lib/jwtHelper');

const ACTIVATION_TAG = 'active';
const DEACTIVATION_TAG = 'inactive';

const makeClientProcessor = (context) => {

  const updateClientStatus = (status, accessToken) => {
    if (status === ACTIVATION_TAG) {
      return decodePayload(accessToken);
      // return makeClientModel(context)
      //   .saveClientToken(accessToken)
    }
    return makeClientModel(context)
      .deleteClientToken();

  };

  return {
    updateClientStatus,
  };
};

module.exports = makeClientProcessor;
