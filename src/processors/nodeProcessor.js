const makeTokenSelector = require('../lib/tokenSelector');
const makeNodesHelper = require('../lib/nodesHelper');

const { decodePayload } = require('../lib/jwtHelper');

const makeNodeProcessor = (context) => {
  const { security } = context;

  const getNodes = () => makeTokenSelector(context).selectUserToken()
    .then((edgeAccessToken) => makeNodesHelper(context).findByAccount(edgeAccessToken)
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
      }));

  return {
    getNodes,
  };
};

module.exports = makeNodeProcessor;
