const Q = require('q');

const TOKEN_TAG = 'token';

const makeClientModel = (context) => {
  const { storage } = context;

  const saveClientToken = (accessToken, expiresAt) => Q.fcall(() => {
    storage.setItem(TOKEN_TAG, JSON.stringify({
      accessToken,
      expiresAt,
    }));
  });

  const getClientToken = () => Q.fcall(() => {
    const clientTokenStr = storage.getItem(TOKEN_TAG);
    const clientToken = !clientTokenStr || clientTokenStr === '' ? null : JSON.parse(clientTokenStr);
    if (!clientToken) throw new Error('client is not activated for this service');
    if (clientToken.expiresAt < Date.now()) throw new Error('client\'s activation is expired for this service');
    return clientToken.accessToken;
  });

  const deleteClientToken = () => Q.fcall(() => {
    storage.setItem(TOKEN_TAG, '');
  });

  return {
    getClientToken,
    saveClientToken,
    deleteClientToken,
  };
};

module.exports = makeClientModel;
