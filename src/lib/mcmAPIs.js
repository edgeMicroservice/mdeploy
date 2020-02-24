const Q = require('q');

const makeClientModel = require('../models/clientModel');

const MCM_URL = '127.0.0.1:8083/mcm/v1';

const makeMcmAPIs = (context) => {
  const { http } = context;
  const clientModel = makeClientModel(context);

  const getCachedImages = () => {
    const accessToken = clientModel.getClientToken();
    const deferred = Q.defer();

    http.request(({
      url: `${MCM_URL}/images`,
      type: 'GET',
      authorization: `bearer ${accessToken}`,
      success: (result) => {
        deferred.resolve(JSON.parse(result.data).data);
      },
      error: (err) => {
        deferred.reject(new Error(err.message));
      },
    }));
    return deferred.promise;
  };

  const deleteCachedImage = (id) => {
    const deferred = Q.defer();
    const accessToken = clientModel.getClientToken();

    http.request(({
      url: `${MCM_URL}/images/${id}`,
      type: 'DELETE',
      authorization: `bearer ${accessToken}`,
      success: () => {
        deferred.resolve(id);
      },
      error: (err) => {
        deferred.reject(new Error(err.message));
      },
    }));
    return deferred.promise;
  };

  const deployContainer = (imageName, containerName, env) => {
    const accessToken = clientModel.getClientToken();
    const deferred = Q.defer();

    http.request(({
      url: `${MCM_URL}/containers`,
      type: 'POST',
      authorization: `bearer ${accessToken}`,
      data: JSON.stringify({
        name: containerName,
        image: imageName,
        env,
      }),
      success: (result) => {
        deferred.resolve(JSON.parse(result.data));
      },
      error: (err) => {
        deferred.reject(new Error(err.message));
      },
    }));
    return deferred.promise;
  };

  const undeployContainer = (containerId) => {
    const accessToken = clientModel.getClientToken();
    const deferred = Q.defer();

    http.request(({
      url: `${MCM_URL}/containers/${containerId}`,
      type: 'DELETE',
      authorization: `bearer ${accessToken}`,
      success: (result) => {
        deferred.resolve(JSON.parse(result.data));
        console.log('===> result', result);
      },
      error: (err) => {
        deferred.reject(new Error(err.message));
        console.log('===> err', err);
      },
    }));
    return deferred.promise;
  };

  const getDeployedContainers = () => {
    const accessToken = clientModel.getClientToken();
    const deferred = Q.defer();

    http.request(({
      url: `${MCM_URL}/containers`,
      type: 'GET',
      authorization: `bearer ${accessToken}`,
      success: (result) => {
        deferred.resolve(JSON.parse(result.data).data);
      },
      error: (err) => {
        deferred.reject(new Error(err.message));
      },
    }));
    return deferred.promise;
  };

  return {
    getCachedImages,
    deployContainer,
    undeployContainer,
    deleteCachedImage,
    getDeployedContainers,
  };
};

module.exports = makeMcmAPIs;
