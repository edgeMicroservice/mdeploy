const Q = require('q');

const makeClientModel = require('../models/clientModel');

const makeTokenSelector = (context) => {
  console.log('===> context.security', context.security);
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
