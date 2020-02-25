const makeRequestPromisifier = require('../lib/requestPromisifier');

const MCM_URL = '127.0.0.1:8083/mcm/v1';

const makeMcmAPIs = (context) => {
  const getCachedImages = (accessToken) => makeRequestPromisifier(context)
    .request({
      url: `${MCM_URL}/images`,
      type: 'GET',
      authorization: `bearer ${accessToken}`,
    })
    .then((result) => JSON.parse(result.data).data)
    .fail((err) => new Error(err.message));

  const deleteCachedImage = (id, accessToken) => makeRequestPromisifier(context)
    .request({
      url: `${MCM_URL}/images/${id}`,
      type: 'DELETE',
      authorization: `bearer ${accessToken}`,
    })
    .then(() => id)
    .fail((err) => new Error(err.message));

  const deployContainer = (
    imageName, containerName, env, accessToken,
  ) => makeRequestPromisifier(context)
    .request({
      url: `${MCM_URL}/containers`,
      type: 'POST',
      authorization: `bearer ${accessToken}`,
      data: JSON.stringify({
        name: containerName,
        image: imageName,
        env,
      }),
    })
    .then((result) => JSON.parse(result.data))
    .fail((err) => new Error(err.message));

  const undeployContainer = (containerId, accessToken) => makeRequestPromisifier(context)
    .request({
      url: `${MCM_URL}/containers/${containerId}`,
      type: 'DELETE',
      authorization: `bearer ${accessToken}`,
    })
    .then((result) => JSON.parse(result.data))
    .fail((err) => new Error(err.message));

  const getDeployedContainers = (accessToken) => makeRequestPromisifier(context)
    .request({
      url: `${MCM_URL}/containers`,
      type: 'GET',
      authorization: `bearer ${accessToken}`,
    })
    .then((result) => JSON.parse(result.data).data)
    .fail((err) => new Error(err.message));

  return {
    getCachedImages,
    deployContainer,
    undeployContainer,
    deleteCachedImage,
    getDeployedContainers,
  };
};

module.exports = makeMcmAPIs;
