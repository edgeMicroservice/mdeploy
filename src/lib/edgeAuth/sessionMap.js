const find = require('lodash/find');

const SECRET_KEYS_MAP = [
  {
    sessionId: 'asdfzxcvasdfzcxv', // must be 16 chars
    sessionSecret: 'asdfasdfasdfasdfasdfasdfasdfasdf', // must be 32 chars
    serviceType: '0a8d368e-7708-4c1c-b705-d6d9437bb20c-mdeploy-v1',
  },
];

const findBySessionId = (sessionId) => find(SECRET_KEYS_MAP, (map) => map.sessionId === sessionId);

const findByServiceType = (serviceType) => find(
  SECRET_KEYS_MAP, (map) => map.serviceType === serviceType,
);

module.exports = {
  findBySessionId,
  findByServiceType,
};
