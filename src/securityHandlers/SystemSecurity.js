/* eslint-disable global-require */
const jwt = require('jsonwebtoken');

const { extractToken } = require('@mimik/edge-ms-helper/authorization-helper');

const { decodePayload } = require('../lib/jwtHelper');

const SecurityHandler = (req, definition, scopes, next) => {
  const { OAUTH_GENERIC_KEY } = req.context.env;

  const util = require('util');
  console.log('===> ', Date.now(), 'req', util.inspect(req, false, null, true));

  if (req.authorization) {
    try {
      const token = extractToken(req.authorization);
      const payload = decodePayload(token);

      jwt.verify(token, OAUTH_GENERIC_KEY);
      console.log('===> scopes', scopes);

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
  } else if (req.securityMiddleware === 'eauth') {
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
