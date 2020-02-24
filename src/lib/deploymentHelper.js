/* eslint-disable no-unused-vars */
/* eslint-disable arrow-body-style */
const Q = require('q');

const makeClientModel = require('../models/clientModel');

const SERVER_ADDRESS = 'http://127.0.0.1:8083';
const JSONRPC_URL = `${SERVER_ADDRESS}/jsonrpc/v1`;
const MCM_URL = `${SERVER_ADDRESS}/mcm/v1`;

const HMAC_EXPIRES_IN = 60; // in seconds

const makeDeploymentHelper = (context) => {
  const clientModel = makeClientModel(context);

  const generateHmac = (nodeId, nodeUrl, imageId) => {
    const accessToken = clientModel.getClientToken();

    const { http } = context;
    const deferred = Q.defer();

    http.request(({
      url: JSONRPC_URL,
      type: 'POST',
      authorization: `bearer ${accessToken}`,
      data: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getEdgeHmacCode',
        params: [
          accessToken,
          `${(new Date()).getTime() + HMAC_EXPIRES_IN}`,
          nodeId,
          `/mcm/v1/images/${imageId}/tarball`,
        ],
      }),
      success: (result) => {
        const response = JSON.parse(result.data);
        console.log('===> response', response);
        if (response.error) deferred.reject(new Error(response.error));
        else deferred.resolve(response.result.edgeHmacCode);
      },
      error: (err) => {
        console.log('===> err', err);
        deferred.reject(new Error(err));
      },
    }));
    return deferred.promise;
  };

  const deployService = (nodeId, nodeUrl, imageId) => {
    const { http, env } = context;

    return generateHmac(nodeId, nodeUrl, imageId)
      .fail((err) => { throw new Error(`Error occured while generating hmac: ${JSON.stringify(err)}`); })
      .then((hmac) => {
        const accessToken = clientModel.getClientToken();
        const deferred = Q.defer();
        http.request(({
          url: env.MDEPLOYMENYAGENT_URL,
          type: 'POST',
          data: JSON.stringify({
            imageLink: {
              url: `${nodeUrl}/mcm/v1/images/${imageId}/tarball?hmac=${hmac}`,
              method: 'GET',
            },
            deploymentLink: {
              url: `${MCM_URL}/images`,
              method: 'POST',
              headers: {
                Authorization: `bearer ${accessToken}`,
              },
            },
          }),
          success: (result) => {
            deferred.resolve(result);
          },
          error: (err) => {
            deferred.reject(new Error(err.message));
          },
        }));
        return deferred.promise;
      });
  };

  return {
    deployService,
  };
};


module.exports = makeDeploymentHelper;
