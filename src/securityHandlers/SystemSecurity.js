// const jwt = require('jsonwebtoken');
const find = require('lodash/find');

const { extractToken } = require('@mimik/edge-ms-helper/authorization-helper');

const { decodePayload } = require('../util/jwtHelper');
const { requestLog, debugLog } = require('../util/logHelper');

const handlerName = 'System Security';

const loggedNext = (next, error) => {
  if (error) {
    debugLog(`'${handlerName}' check failed`);
  } else {
    debugLog(`'${handlerName}' check successful`);
  }
  next();
};

const SecurityHandler = (req, definition, scopes, next) => {
  // const { OAUTH_GENERIC_KEY } = req.context.env;
  requestLog(handlerName, req);

  const validateScopes = (scps, payload) => {
    const tokenScopes = payload.scope.split(' ');
    scps.forEach((scope) => {
      const foundScope = find(tokenScopes, (tknScp) => tknScp === scope);
      if (!foundScope) {
        throw new Error('scopes not valid');
      }
    });
  };

  if (req.authorization && req.authorization !== '') {
    try {
      const token = extractToken(req.authorization);
      const payload = decodePayload(token);

      // jwt.verify(token, OAUTH_GENERIC_KEY);
      validateScopes(scopes, payload);

      req.context.security = {
        type: 'SystemSecurity',
        issuer: 'MST',
        token: {
          jwt: token,
          payload,
        },
      };
      loggedNext(next);
    } catch (e) {
      loggedNext(next, new Error(`invalid token: ${e.message}`));
    }
  } else if (req.securityMiddleware === 'esession' && req.context.env.SESSION_SECURITY_AUTHORIZATION_SET === 'on') {
    req.context.security = {
      type: 'SystemSecurity',
      issuer: 'MES',
    };
    loggedNext(next);
  } else {
    loggedNext(next, new Error('authorization header is needed'));
  }
};

module.exports = SecurityHandler;
