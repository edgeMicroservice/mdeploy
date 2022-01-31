const { rpAuth, SERVICE_CONSTANTS } = require('./auth-helper');
const { throwException } = require('../util/logHelper');

const JSONRPC_VERSION = '2.0';
const JSONRPC_METHOD_HMAC = 'getEdgeHmacCode';
const JSONRPC_METHOD_REGISTRY = 'serviceMesh.addRegistryImage';

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
        method: JSONRPC_METHOD_HMAC,
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

  const addRegistryImage = (accessToken, hostNodeId, imageId, hmac) => {
    const options = {
      url: JSONRPC_URL,
      method: 'POST',
      body: {
        jsonrpc: JSONRPC_VERSION,
        method: JSONRPC_METHOD_REGISTRY,
        params: [
          accessToken,
          hostNodeId, imageId, hmac,
        ],
      },
    };

    return rpAuth(SERVICE_CONSTANTS.MCM, options, context, true)
      .then((response) => {
        if (response.error) throwException('Error occured while calling addRegistryImage', response.error);
        return response.result;
      });
  };

  const notifyApp = (type, messageBody) => {
    const { env } = context;
    if (env.MDEPLOYMENTAGENT_URL === 'ws://') {
      const data = {};
      data.type = type;
      data.message = JSON.stringify(messageBody);
      context.dispatchWebSocketEvent(data);
    }

    return messageBody;
  };

  const deployImage = (nodeId, imageId, imageUrl, targetNodeLocalHref, targetNodeHref, accessToken) => {
    const { env } = context;
    const MCM_URL = `${targetNodeLocalHref}/mcm/v1`;
    const { MDEPLOYMENTAGENT_KEY } = env;

    const callDeploymentAgent = (hmac) => {
      const options = {
        url: `${env.MDEPLOYMENTAGENT_URL}/files`,
        method: 'POST',
        headers: {
          apiKey: MDEPLOYMENTAGENT_KEY,
        },
        body: {
          originLink: {
            url: imageUrl || `${targetNodeHref}/mcm/v1/images/${imageId}/tarball?hmac=${hmac}`,
            method: 'GET',
          },
          destinationLink: {
            url: `${MCM_URL}/images`,
            method: 'POST',
            headers: {
              Authorization: `bearer ${accessToken}`,
            },
            formData: {
              image: '$file.stream',
            },
          },
        },
      };

      return env.MDEPLOYMENTAGENT_URL === 'ws://'
        ? addRegistryImage(accessToken, nodeId, imageId, hmac)
        : rpAuth('mdeploymentagent', options, context, false);
    };

    if (imageUrl) {
      return callDeploymentAgent('');
    }

    return generateHmac(nodeId, imageId, accessToken)
      .catch((error) => {
        throwException('cannot generate hmac', error);
      })
      .then((hmac) => callDeploymentAgent(hmac));
  };

  return {
    deployImage,
    notifyApp,
  };
};


module.exports = makeDeploymentHelper;
