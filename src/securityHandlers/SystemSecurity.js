// const jwt = require('jsonwebtoken');
const find = require('lodash/find');

const { extractToken } = require('@mimik/edge-ms-helper/authorization-helper');

const { decodePayload } = require('../util/jwtHelper');

const SecurityHandler = (req, definition, scopes, next) => {
  // const { OAUTH_GENERIC_KEY } = req.context.env;

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
      next();
    } catch (e) {
      next(new Error(`invalid token: ${e.message}`));
    }
  } else if (req.securityMiddleware === 'esession' && req.context.env.SESSION_SECURITY_AUTHORIZATION_SET === 'on') {
    req.context.security = {
      type: 'SystemSecurity',
      issuer: 'MES',
    };
    next();
  } else {
    next(new Error('authorization header is needed'));
  }
};

module.exports = SecurityHandler;
