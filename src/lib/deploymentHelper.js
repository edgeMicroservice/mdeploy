const { rpAuth, SERVICE_CONSTANTS } = require('./auth-helper');
const { extractFromServiceType } = require('../util/serviceNameHelper');
const { throwException } = require('../util/logHelper');

const JSONRPC_VERSION = '2.0';
const JSONRPC_METHOD = 'getEdgeHmacCode';

const HMAC_EXPIRES_IN = 60; // in seconds

const makeDeploymentHelper = (context) => {
  const { httpPort } = context.info;

  const JSONRPC_URL = `http://127.0.0.1:${httpPort}/jsonrpc/v1`;

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
        if (response.error) throwException('Error occured while generating hmac', response.error);
        return response.result.edgeHmacCode;
      });
  };

  const notifyApp = (messageBody) => {
    const data = {};
    data.type = 'deployImage';
    data.message = JSON.stringify(messageBody);
    context.dispatchWebSocketEvent(data);

    return messageBody;
  };

  const deployImage = (nodeId, targetNodeLocalHref, targetNodeHref, imageId, accessToken) => {
    const { env } = context;
    const MCM_URL = `${targetNodeLocalHref}/mcm/v1`;

    return generateHmac(nodeId, imageId, accessToken)
      .catch((error) => {
        throwException('cannot generate hmac', error);
      })
      .then((hmac) => {
        const { serviceName, serviceVersion } = extractFromServiceType(imageId);
        const options = {
          url: `${env.MDEPLOYMENYAGENT_URL}/images`,
          method: 'POST',
          body: {
            imageLink: {
              nodeId,
              url: `${targetNodeHref}/mcm/v1/images/${imageId}/tarball?hmac=${hmac}`,
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

        return env.MDEPLOYMENYAGENT_URL === 'ws://'
          ? notifyApp(options.body)
          : rpAuth('mdeploymentagent', options, context, false);
      });
  };

  return {
    deployImage,
  };
};


module.exports = makeDeploymentHelper;
