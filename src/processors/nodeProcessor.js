const makeNodesHelper = require('../lib/nodesHelper');
const makeSyncHelper = require('../lib/syncHelper');
const makeTokenSelector = require('../lib/tokenSelector');

const { decodePayload } = require('../lib/jwtHelper');

const makeNodeProcessor = (context) => {
  const syncHelper = makeSyncHelper(context);

  const getNodes = () => makeTokenSelector(context).selectUserToken()
    .then((edgeAccessToken) => makeNodesHelper(context).findByAccount(edgeAccessToken)
      .then((nodes) => {
        const accountId = decodePayload(edgeAccessToken).sub;

        return nodes.map((node) => {
          if (node.account.id === accountId) return node;
          return {
            id: node.id,
            services: node.services,
          };
        });
      }))
    .finally(syncHelper.syncLeaders);

  return {
    getNodes,
  };
};

module.exports = makeNodeProcessor;
