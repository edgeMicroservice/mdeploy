const { extractToken } = require('@mimik/edge-ms-helper/authorization-helper');
const { validate } = require('../lib/oauthHelper');

const SecurityHandler = (req, definition, scopes, next) => {
  const { OAUTH_SYSTEM_PUBLIC_KEY } = req.context.env;
  if (!req.authorization) {
    next(new Error('authorization header is needed'));
    return;
  }

  const token = extractToken(req.authorization);

  try {
    validate(token, OAUTH_SYSTEM_PUBLIC_KEY, scopes);
    next(null);
  } catch (e) {
    next(new Error(`invalid token: ${e.message}`));
  }
};

module.exports = SecurityHandler;
