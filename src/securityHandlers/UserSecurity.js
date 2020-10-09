const { extractToken } = require('@mimik/edge-ms-helper/authorization-helper');
const { decodePayload } = require('../util/jwtHelper');
const { requestLog, debugLog } = require('../util/logHelper');

const handlerName = 'User Security';

const loggedNext = (next, error) => {
  if (error) {
    debugLog(`'${handlerName}' check failed`);
  } else {
    debugLog(`'${handlerName}' check successful`);
  }
  next();
};

const SecurityHandler = (req, definition, scopes, next) => {
  requestLog(handlerName, req);

  if (!req.authorization) {
    loggedNext(next, new Error('authorization header is needed'));
    return;
  }

  const token = extractToken(req.authorization);

  try {
    const payload = decodePayload(token);
    if (!payload.iss || !payload.iss.includes('mID/v1')) {
      loggedNext(next, new Error('issuer not valid'));
    } else {
      req.context.security = {
        type: 'UserSecurity',
        issuer: 'MID',
        token: {
          jwt: token,
          payload,
        },
      };
      loggedNext(next);
    }
  } catch (e) {
    loggedNext(next, new Error(`invalid token: ${e.message}`));
  }
};

module.exports = SecurityHandler;
