const Promise = require('bluebird');
const find = require('lodash/find');

const makeNodesHelper = (context) => {
  const { edge } = context;

  const populateUrl = (node) => {
    const pub = find(node.addresses, (addr) => addr.type === 'public');
    const proxy = find(node.addresses, (addr) => addr.type === 'proxy');
    const local = find(node.addresses, (addr) => addr.type === 'local');
    let url;

    if (pub && pub.url && pub.url.href && pub.url.href.startsWith('https://')) {
      url = pub.url.href;
    } else if (proxy) {
      url = undefined;
    } else {
      url = local.url.href;
    }

    return { ...node, url };
  };

  const clusterDiscovery = (type, accessToken) => new Promise((resolve, reject) => {
    edge.clusterDiscovery(
      type, accessToken, (nodes) => resolve(nodes), (err) => reject(err),
    );
  });

  const findByAccount = (accessToken) => clusterDiscovery('account', accessToken)
    .then((data) => data.nodes.map((node) => populateUrl(node)));

  return {
    findByAccount,
  };
};

module.exports = makeNodesHelper;
