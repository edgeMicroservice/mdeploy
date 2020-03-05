const { rpAuth } = require('../lib/auth-helper');

const MCM_URL = '127.0.0.1:8083/mcm/v1';

const makeMcmAPIs = (context) => {
  const getCachedImages = (accessToken) => rpAuth('MCM', {
    url: `${MCM_URL}/images`,
    method: 'GET',
    token: `bearer ${accessToken}`,
  }, context, true)
    .then((result) => result.data);

  const deleteCachedImage = (id, accessToken) => rpAuth('MCM', {
    url: `${MCM_URL}/images/${id}`,
    method: 'DELETE',
    token: `bearer ${accessToken}`,
  }, context, true)
    .then(() => id);

  const deployContainer = (
    imageName, containerName, env, accessToken,
  ) => rpAuth('MCM', {
    url: `${MCM_URL}/containers`,
    method: 'POST',
    token: `bearer ${accessToken}`,
    body: {
      name: containerName,
      image: imageName,
      env,
    },
  }, context, true);

  const undeployContainer = (containerId, accessToken) => rpAuth('MCM', {
    url: `${MCM_URL}/containers/${containerId}`,
    method: 'DELETE',
    token: `bearer ${accessToken}`,
  }, context, true);

  const getDeployedContainers = (accessToken) => rpAuth('MCM', {
    url: `${MCM_URL}/containers`,
    method: 'GET',
    token: `bearer ${accessToken}`,
  }, context, true)
    .then((result) => result.data);

  return {
    getCachedImages,
    deployContainer,
    undeployContainer,
    deleteCachedImage,
    getDeployedContainers,
  };
};

module.exports = makeMcmAPIs;
