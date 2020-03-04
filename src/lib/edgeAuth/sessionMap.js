const find = require('lodash/find');

const makeSessionMap = (context) => {
  let SESSION_KEYS_MAP;
  try {
    SESSION_KEYS_MAP = JSON.parse(context.env.SESSION_KEYS_MAP);
  } catch (error) {
    throw new Error('Cannot parse SESSION_KEYS_MAP env string to JSON');
  }
  if (!SESSION_KEYS_MAP) throw new Error('SESSION_KEYS_MAP env not assigned');
  if (!Array.isArray(SESSION_KEYS_MAP)) throw new Error('SESSION_KEYS_MAP env is not an array');

  const currentProjectId = context.info.serviceType.substr(0, 36);

  const findBySessionId = (sessionId) => find(
    SESSION_KEYS_MAP, (map) => map.sessionId === sessionId,
  );

  const findByProject = (projectId) => find(
    SESSION_KEYS_MAP, (map) => map.projectId === (projectId || currentProjectId),
  );

  return {
    findBySessionId,
    findByProject,
  };
};

module.exports = makeSessionMap;
