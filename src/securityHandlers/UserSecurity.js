const { extractToken } = require('@mimik/edge-ms-helper/authorization-helper');
const { decodePayload } = require('../lib/jwtHelper');

const SecurityHandler = (req, definition, scopes, next) => {
  if (!req.authorization) {
    next(new Error('authorization header is needed'));
    return;
  }

  const token = extractToken(req.authorization);

  try {
    const payload = decodePayload(token);
    if (!payload.iss || !payload.iss.includes('mID/v1')) {
      next(new Error('issuer not valid'));
    } else {
      req.context.security = {
        type: 'UserSecurity',
        issuer: 'MID',
        token: {
          jwt: token,
          payload,
        },
      };
      next();
    }
  } catch (e) {
    next(new Error(`invalid token: ${e.message}`));
  }
};

module.exports = SecurityHandler;
