const makeConfigurationModel = require('../models/configurationModel');
const makeNodeModel = require('../models/nodeModel');
const { decodePayload } = require('../lib/jwtHelper');

const makeNodeProcessor = (context) => {
  const getNodes = (security, params) => {
    let edgeAccessToken;
    if (security.type === 'EdgeDeploymentSecurity') {
      const config = makeConfigurationModel(context).getConfiguration();
      if (!config || !config.edgeAccessToken) throw new Error('could not fetch edgeAccessToken. service needs to configured by the system endpoints');
      edgeAccessToken = config.edgeAccessToken;
    } else {
      edgeAccessToken = security.accessToken;
    }

    const nodeModel = makeNodeModel(context);

    return (() => {
      switch (params.type) {
        case 'account':
          return nodeModel.findByAccount(edgeAccessToken);
        case 'proximity':
          return nodeModel.findByProximity(edgeAccessToken);
        case 'linkLocal':
          return nodeModel.findByLinkLocal(edgeAccessToken);
        default:
          throw new Error(`cannot recognize the type of nodes requested: ${params.type}`);
      }
    })()
      .then((nodes) => {
        if (security.type === 'EdgeDeploymentSecurity') return nodes;
        const accountId = decodePayload(edgeAccessToken).sub;
        return nodes.map((node) => {
          if (node.account.id === accountId) return node;
          return {
            id: node.id,
            services: node.services,
          };
        });
      });
  };

  return {
    getNodes,
  };
};

module.exports = makeNodeProcessor;
