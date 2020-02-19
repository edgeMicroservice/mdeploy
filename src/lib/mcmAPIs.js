const Q = require('q');

const makeConfigurationModel = require('../models/configurationModel');

const serverUrl = '127.0.0.1:8083/mcm/v1';

const makeMcmAPIs = (context) => {
  const { http } = context;

  const getCachedImages = () => {
    const deferred = Q.defer();
    const config = makeConfigurationModel(context).getConfiguration();
    if (!config || !config.edgeAccessToken) {
      throw new Error('could not fetch edgeAccessToken. service needs to configured by the system endpoints');
    }

    http.request(({
      url: `${serverUrl}/images`,
      type: 'GET',
      authorization: `bearer ${config.edgeAccessToken}`,
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
    const config = makeConfigurationModel(context).getConfiguration();
    if (!config || !config.edgeAccessToken) {
      throw new Error('could not fetch edgeAccessToken. service needs to configured by the system endpoints');
    }

    http.request(({
      url: `${serverUrl}/images/${id}`,
      type: 'DELETE',
      authorization: `bearer ${config.edgeAccessToken}`,
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
    const deferred = Q.defer();
    const config = makeConfigurationModel(context).getConfiguration();
    if (!config || !config.edgeAccessToken) throw new Error('could not fetch edgeAccessToken. service needs to configured by the system endpoints');

    const data = {
      name: containerName,
      image: imageName,
      env,
    };

    http.request(({
      url: `${serverUrl}/containers`,
      type: 'POST',
      authorization: `bearer ${config.edgeAccessToken}`,
      data: JSON.stringify(data),
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
    console.log('===> containerId', containerId);
    const deferred = Q.defer();
    const config = makeConfigurationModel(context).getConfiguration();
    if (!config || !config.edgeAccessToken) throw new Error('could not fetch edgeAccessToken. service needs to configured by the system endpoints');

    http.request(({
      url: `${serverUrl}/containers/${containerId}`,
      type: 'DELETE',
      authorization: `bearer ${config.edgeAccessToken}`,
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
    const deferred = Q.defer();
    const config = makeConfigurationModel(context).getConfiguration();
    if (!config || !config.edgeAccessToken) {
      throw new Error('could not fetch edgeAccessToken. service needs to configured by the system endpoints');
    }

    http.request(({
      url: `${serverUrl}/containers`,
      type: 'GET',
      authorization: `bearer ${config.edgeAccessToken}`,
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
