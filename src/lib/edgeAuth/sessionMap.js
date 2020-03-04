const find = require('lodash/find');

const SESSION_KEYS_MAP = [
  {
    sessionId: 'asdfzxcvasdfzcxv', // must be 16 chars
    sessionSecret: 'asdfasdfasdfasdfasdfasdfasdfasdf', // must be 32 chars
    projectId: '0a8d368e-7708-4c1c-b705-d6d9437bb20c',
  },
];

const findBySessionId = (sessionId) => find(SESSION_KEYS_MAP, (map) => map.sessionId === sessionId);

const findByServiceType = (serviceType) => find(
  SESSION_KEYS_MAP, (map) => map.projectId === serviceType.substr(0, 36),
);

module.exports = {
  findBySessionId,
  findByServiceType,
};
