/* eslint-disable no-unused-vars */
/* eslint-disable arrow-body-style */
const makeRequestPromisifier = require('../lib/requestPromisifier');

const SERVER_ADDRESS = 'http://127.0.0.1:8083';
const JSONRPC_URL = `${SERVER_ADDRESS}/jsonrpc/v1`;
const MCM_URL = `${SERVER_ADDRESS}/mcm/v1`;

const HMAC_EXPIRES_IN = 60; // in seconds

const makeDeploymentHelper = (context) => {
  const generateHmac = (nodeId, imageId, accessToken) => {
    const options = {
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
    };
    return makeRequestPromisifier(context)
      .request(options)
      .then((result) => {
        const response = JSON.parse(result.data);
        if (response.error) throw new Error(response.error);
        return response.result.edgeHmacCode;
      });
  };

  const deployService = (nodeId, nodeUrl, imageId, accessToken) => {
    const { env } = context;

    return generateHmac(nodeId, imageId, accessToken)
      .fail((err) => { throw new Error(`Error occured while generating hmac: ${JSON.stringify(err)}`); })
      .then((hmac) => {
        const options = {
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
        };
        return makeRequestPromisifier(context)
          .request(options)
          .then((result) => {
            return JSON.parse(result.data);
          });
      });
  };

  return {
    deployService,
  };
};


module.exports = makeDeploymentHelper;
