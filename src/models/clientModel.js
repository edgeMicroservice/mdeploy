const Promise = require('bluebird');

const TOKEN_TAG = 'token';

const makeClientModel = (context) => {
  const { storage } = context;

  const saveClientToken = (accessToken, expiresAt) => {
    storage.setItem(TOKEN_TAG, JSON.stringify({
      accessToken,
      expiresAt,
    }));
    return Promise.resolve();
  };

  const getClientToken = () => {
    const clientTokenStr = storage.getItem(TOKEN_TAG);
    const clientToken = !clientTokenStr || clientTokenStr === '' ? null : JSON.parse(clientTokenStr);
    if (!clientToken) throw new Error('client is not activated for this service');
    if (clientToken.expiresAt < Date.now()) return Promise.reject(new Error('client\'s activation is expired for this service'));
    return Promise.resolve(clientToken.accessToken);
  };

  const deleteClientToken = () => {
    storage.setItem(TOKEN_TAG, '');
    return Promise.resolve();
  };

  return {
    getClientToken,
    saveClientToken,
    deleteClientToken,
  };
};

module.exports = makeClientModel;
