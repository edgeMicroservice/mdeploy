/* eslint-disable padded-blocks */
/* eslint-disable no-unused-vars */
const Q = require('q');

const makeClientModel = require('../models/clientModel');
const { decodePayload } = require('../lib/jwtHelper');

const ACTIVATION_TAG = 'active';
const DEACTIVATION_TAG = 'inactive';

const makeClientProcessor = (context) => {

  const updateClientStatus = (status, accessToken, expiresIn) => {
    console.log('===> updateClientStatus: accessToken', accessToken);
    if (status === ACTIVATION_TAG) {
      return makeClientModel(context)
        .saveClientToken(accessToken, Date.now() + expiresIn);
    }
    return makeClientModel(context)
      .deleteClientToken();

  };

  return {
    updateClientStatus,
  };
};

module.exports = makeClientProcessor;
