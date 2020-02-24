/* eslint-disable no-unused-vars */
/* eslint-disable arrow-body-style */
const jwt = require('jsonwebtoken');
const Q = require('q');

const DEPLOYMENT_ACCESS_SECRET = 'secret';
const DEFAULT_TOKEN_EXPIRY = 5; // in seconds

const randomString = () => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const length = 16;
  let result = '';
  for (let i = length; i > 0; i -= 1) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

const createToken = (payload) => {
  const deferred = Q.defer();
  deferred.resolve(jwt.sign(
    payload,
    DEPLOYMENT_ACCESS_SECRET,
    {
      expiresIn: 5,
      jwtid: randomString(),
    },
  ));
  return deferred.promise;
};

const verifyToken = (token) => {
  const deferred = Q.defer();

  jwt.verify(token, DEPLOYMENT_ACCESS_SECRET, (err, decoded) => {
    if (err) deferred.reject(err);
    else deferred.resolve(decoded);
  });
  return deferred.promise;
};

const decodePayload = (token) => {
  const payloadStr = token.slice(token.indexOf('.') + 1, token.lastIndexOf('.'));
  const buff = Buffer.from(payloadStr, 'base64');
  return JSON.parse(buff.toString('utf-8'));
};

module.exports = {
  createToken,
  verifyToken,
  decodePayload,
};
