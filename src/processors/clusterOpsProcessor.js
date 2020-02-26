const Q = require('q');
const find = require('lodash/find');

const { rpAuth } = require('../lib/edgeCrypt');
const makeNodesHelper = require('../lib/nodesHelper');

const makeClusterOpsProcessor = (context) => {
  const createOperationRequest = (nodeId, serviceType, url, request) => {
    const requestOptions = {
      url: `${url}${request.endpoint}`,
      method: request.method,
    };
    if (request.qs) requestOptions.qs = request.qs;
    if (request.body) requestOptions.data = request.body;
    if (request.token) requestOptions.token = request.token;
    if (request.headers) requestOptions.headers = request.headers;

    return rpAuth(serviceType, requestOptions, context, true)
      .then((result) => ({
        nodeId,
        serviceType,
        responseType: 'success',
        responseBody: result,
      }))
      .fail((err) => {
        delete requestOptions.token;
        if (requestOptions.headers && requestOptions.headers.Authorization) {
          delete requestOptions.headers.Authorization;
        }

        return {
          nodeId,
          serviceType,
          responseType: 'success',
          responseBody: err,
          requestOptions,
        };
      });
  };

  const createClusterOp = (clusterOp, accessToken) => makeNodesHelper(context)
    .findByAccount(accessToken)
    .then((nodes) => {
      const { serviceType, apiRoot } = context.info;
      const operationsPromises = clusterOp.nodes.map((id) => {
        const selectedNode = find(nodes, (node) => node.id === id);
        if (!selectedNode) throw new Error(`cannot create cluster operation. node with id: ${id} cannot be found`);
        const selectedService = find(
          selectedNode.services, (service) => service.serviceType === serviceType,
        );
        if (!selectedService) throw new Error(`cannot create cluster operation. serviceType: ${serviceType} cannot be found, on nodeId: ${id}`);
        const nodeAddress = find(selectedNode.addresses, (address) => address.type === 'local'); // TODO add support for non local
        const serviceAddress = `${nodeAddress.url.href}${selectedService.self ? selectedService.self : apiRoot}`;
        return createOperationRequest(id, serviceType, serviceAddress, clusterOp.request);
      });
      return Q.all(operationsPromises);
    });

  return {
    createClusterOp,
  };
};

module.exports = makeClusterOpsProcessor;
