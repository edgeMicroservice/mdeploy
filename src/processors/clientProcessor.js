const makeClientModel = require('../models/clientModel');

const { ACTIVATION_TAG } = require('../lib/common');

const makeClientProcessor = (context) => {
  const updateClientStatus = (status, accessToken, expiresIn) => {
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
