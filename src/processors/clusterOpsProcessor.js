const Q = require('q');
const find = require('lodash/find');
const merge = require('lodash/merge');

const { rpAuth, getEdgeServiceLinkByNodeId } = require('../lib/edgeAuth');
const makeNodesHelper = require('../lib/nodesHelper');

const makeClusterOpsProcessor = (context) => {
  const createOperationRequest = (nodeId, serviceType, request, accessToken) => {
    const requestOptions = {
      method: request.method,
    };
    if (request.qs) requestOptions.qs = request.qs;
    if (request.body) requestOptions.data = request.body;
    if (request.token) requestOptions.token = request.token;
    if (request.headers) requestOptions.headers = request.headers;

    return getEdgeServiceLinkByNodeId(nodeId, serviceType, accessToken, context)
      .then((serviceLink) => {
        const updatedRequestOptions = merge(requestOptions, serviceLink);
        updatedRequestOptions.url = `${updatedRequestOptions.url}${request.endpoint}`;

        const outputOptions = updatedRequestOptions;
        outputOptions.token = undefined;
        if (outputOptions.headers && outputOptions.headers.Authorization) {
          outputOptions.headers.Authorization = undefined;
        }
        return rpAuth(serviceType, updatedRequestOptions, context, true)
          .then((result) => ({
            nodeId,
            serviceType,
            responseType: 'success',
            responseBody: result,
            requestOptions: outputOptions,
          }))
          .fail((err) => ({
            nodeId,
            serviceType,
            responseType: 'failure',
            responseBody: err,
            requestOptions: outputOptions,
          }));
      });
  };

  const createClusterOp = (clusterOp, accessToken) => makeNodesHelper(context)
    .findByAccount(accessToken)
    .then((nodes) => {
      const { serviceType } = context.info;
      const operationsPromises = clusterOp.nodes.map((id) => {
        const selectedNode = find(nodes, (node) => node.id === id);
        if (!selectedNode) throw new Error(`cannot create cluster operation. node with id: ${id} cannot be found`);
        return createOperationRequest(id, serviceType, clusterOp.request, accessToken);
      });
      return Q.all(operationsPromises);
    });

  return {
    createClusterOp,
  };
};

module.exports = makeClusterOpsProcessor;
