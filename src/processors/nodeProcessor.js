const makeClientModel = require('../models/clientModel');
const makeNodeModel = require('../models/nodeModel');
const { decodePayload } = require('../lib/jwtHelper');

const makeNodeProcessor = (context) => {
  const clientModel = makeClientModel(context);

  const getNodes = (security, params) => {
    let edgeAccessToken;
    if (security.type === 'EdgeDeploymentSecurity') {
      try {
        edgeAccessToken = clientModel.getClientToken();
      } catch (err) {
        console.log('cannot find edgeAccessToken in the configuration');
      }
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
