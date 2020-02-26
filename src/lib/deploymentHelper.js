const { rpAuth } = require('../lib/edgeCrypt');

const JSONRPC_URL = 'http://127.0.0.1:8083/jsonrpc/v1';
const MCM_URL = 'http://127.0.0.1:8083/mcm/v1';

const HMAC_EXPIRES_IN = 60; // in seconds

const makeDeploymentHelper = (context) => {
  const generateHmac = (nodeId, imageId, accessToken) => {
    const options = {
      url: JSONRPC_URL,
      method: 'POST',
      body: {
        jsonrpc: '2.0',
        method: 'getEdgeHmacCode',
        params: [
          accessToken,
          `${(new Date()).getTime() + HMAC_EXPIRES_IN}`,
          nodeId,
          `/mcm/v1/images/${imageId}/tarball`,
        ],
      },
    };
    return rpAuth('MCM', options, context, true)
      .then((response) => {
        if (response.error) throw new Error(response.error);
        return response.result.edgeHmacCode;
      });
  };

  const deployImage = (nodeId, nodeUrl, imageId, accessToken) => {
    const { env } = context;

    return generateHmac(nodeId, imageId, accessToken)
      .fail((err) => {
        const error = err;
        error.message = `cannot generate hmac: ${err.message}`;
        throw new Error(error);
      })
      .then((hmac) => {
        const options = {
          url: env.MDEPLOYMENYAGENT_URL,
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
          },
        };
        return rpAuth('MCM', options, context, true);
      });
  };

  return {
    deployImage,
  };
};


module.exports = makeDeploymentHelper;
