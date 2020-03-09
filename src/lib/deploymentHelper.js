const { rpAuth, SERVICE_CONSTANTS } = require('./auth-helper');
const { extractFromServiceType } = require('../util/serviceNameHelper');

const JSONRPC_URL = 'http://127.0.0.1:8083/jsonrpc/v1';
const JSONRPC_VERSION = '2.0';
const JSONRPC_METHOD = 'getEdgeHmacCode';

const MCM_URL = 'http://127.0.0.1:8083/mcm/v1';

const HMAC_EXPIRES_IN = 60; // in seconds

const makeDeploymentHelper = (context) => {
  const generateHmac = (nodeId, imageId, accessToken) => {
    const options = {
      url: JSONRPC_URL,
      method: 'POST',
      body: {
        jsonrpc: JSONRPC_VERSION,
        method: JSONRPC_METHOD,
        params: [
          accessToken,
          `${(new Date()).getTime() + HMAC_EXPIRES_IN}`,
          nodeId,
          `/mcm/v1/images/${imageId}/tarball`,
        ],
      },
    };
    return rpAuth(SERVICE_CONSTANTS.MCM, options, context, true)
      .then((response) => {
        if (response.error) throw new Error(response.error);
        return response.result.edgeHmacCode;
      });
  };

  const deployImage = (nodeId, nodeUrl, imageId, accessToken) => {
    const { env } = context;

    return generateHmac(nodeId, imageId, accessToken)
      .catch((err) => {
        const error = err;
        error.message = `cannot generate hmac: ${err.message}`;
        throw new Error(error);
      })
      .then((hmac) => {
        const { serviceName, serviceVersion } = extractFromServiceType(imageId);
        const options = {
          url: `${env.MDEPLOYMENYAGENT_URL}/images`,
          method: 'POST',
          body: {
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
            service: {
              name: serviceName,
              version: serviceVersion,
            },
          },
        };
        return rpAuth('mdeploymentagent', options, context, false);
      });
  };

  return {
    deployImage,
  };
};


module.exports = makeDeploymentHelper;
