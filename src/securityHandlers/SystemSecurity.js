const { extractToken } = require('@mimik/edge-ms-helper/authorization-helper');
const { validate } = require('../lib/oauthHelper');
const { decodePayload } = require('../lib/jwtHelper');

const SecurityHandler = (req, definition, scopes, next) => {
  console.log('===> in SystemSecurity');
  const { EAUTH_SYSTEM_PUBLIC_KEY, OAUTH_SYSTEM_PUBLIC_KEY } = req.context.env;
  if (!req.authorization) {
    next(new Error('authorization header is needed'));
    return;
  }

  const token = extractToken(req.authorization);
  let isMSTToken;
  let payload;

  try {
    payload = decodePayload(token);
    isMSTToken = payload.iss && payload.iss.includes('mST/v1');
  } catch (e) {
    next(new Error(`invalid token: ${e.message}`));
  }

  if (isMSTToken) {
    try {
      validate(token, OAUTH_SYSTEM_PUBLIC_KEY, scopes);
      req.context.security = {
        type: 'SystemSecurity',
        issuer: 'MST',
        token: {
          jwt: token,
          payload,
        },
      };
      next();
    } catch (e) {
      next(new Error(`invalid token: ${e.message}`));
    }
  } else {
    console.log('===> in MES SystemSecurity');
    try {
      validate(token, EAUTH_SYSTEM_PUBLIC_KEY);
      req.context.security = {
        type: 'SystemSecurity',
        issuer: 'MES',
        token: {
          jwt: token,
          payload,
        },
      };
      next();
    } catch (e) {
      next(new Error(`invalid token: ${e.message}`));
    }
  }
};

module.exports = SecurityHandler;
