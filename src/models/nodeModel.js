const find = require('lodash/find');
const Q = require('q');

const makeNodeModel = (context) => {
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

  const clusterDiscovery = (type, accessToken) => {
    const deferred = Q.defer();
    edge.clusterDiscovery(
      type, accessToken, (nodes) => deferred.resolve(nodes), (err) => deferred.reject(err),
    );
    return deferred.promise;
  };

  const findByAccount = (accessToken) => clusterDiscovery('account', accessToken)
    .then((data) => data.nodes.map((node) => populateUrl(node)));

  const findByProximity = (accessToken) => clusterDiscovery('proximity', accessToken)
    .then((nodes) => ((
      nodes
      && Array.isArray(nodes.proximity.nodes)
      && nodes.proximity)
      || new Error('failed to search for devices')
    ))
    .then((proximity) => proximity.nodes.map((node) => populateUrl(node)));

  const findByLinkLocal = (accessToken) => clusterDiscovery('linkLocal', accessToken)
    .then((nodes) => (
      nodes
      && Array.isArray(nodes.localLinkNetwork.nodes)
      && nodes.localLinkNetwork)
      || new Error('failed to search for devices'))
    .then((linkLocal) => linkLocal.nodes.map((node) => populateUrl(node)));

  return {
    findByAccount,
    findByProximity,
    findByLinkLocal,
  };
};

module.exports = makeNodeModel;
