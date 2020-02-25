const Q = require('q');

const makeClientModel = require('../models/clientModel');

const makeTokenSelector = (context) => {
  const selectUserToken = () => {
    if (context.security.type === 'UserSecurity') {
      return Q.fcall(() => context.security.token.jwt);
    }
    return makeClientModel(context)
      .getClientToken();
  };

  return {
    selectUserToken,
  };
};

module.exports = makeTokenSelector;
