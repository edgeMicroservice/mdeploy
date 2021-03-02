const Promise = require('bluebird');
const find = require('lodash/find');
const merge = require('lodash/merge');

const makeNodesHelper = require('../lib/nodesHelper');
const makeTokenSelector = require('../lib/tokenSelector');
const makeSyncHelper = require('../lib/syncHelper');
const { extractFromServiceType } = require('../util/serviceNameHelper');
const { rpAuth, getEdgeServiceLinkByNodeId } = require('../lib/auth-helper');

const makeBatchOpsProcessor = (context) => {
  const syncHelper = makeSyncHelper(context);

  const createOperationRequest = (nodeId, serviceType, request, accessToken) => {
    const requestOptions = {
      method: request.method,
    };
    if (request.qs) requestOptions.qs = request.qs;
    if (request.body) requestOptions.body = request.body;
    if (request.token) requestOptions.token = request.token;
    if (request.headers) requestOptions.headers = request.headers;

    return getEdgeServiceLinkByNodeId(nodeId, serviceType, accessToken, context)
      .then((serviceLink) => {
        const updatedRequestOptions = merge(requestOptions, serviceLink);
        updatedRequestOptions.url = `${updatedRequestOptions.url}${request.endpoint}`;

        const { serviceName } = extractFromServiceType(serviceType);

        return rpAuth(serviceName, updatedRequestOptions, context)
          .then((result) => ({
            nodeId,
            serviceType,
            responseType: 'success',
            responseBody: result,
          }));
      })
      .catch((err) => ({
        nodeId,
        serviceType,
        responseType: 'failure',
        responseBody: err,
      }));
  };

  const createBatchOp = (batchOp, reqAccessToken) => (() => {
    if (reqAccessToken) return Promise.resolve(reqAccessToken);
    return makeTokenSelector(context).selectUserToken();
  })()
    .then((accessToken) => makeNodesHelper(context)
      .findByAccount(accessToken)
      .then((nodes) => {
        const { serviceType } = context.info;
        const operationsPromises = batchOp.nodes.map((id) => {
          const selectedNode = find(nodes, (node) => node.id === id);
          if (!selectedNode) throw new Error(`cannot create batch operation. node with id: ${id} cannot be found`);
          return createOperationRequest(id, serviceType, batchOp.request, accessToken);
        });
        return Promise.all(operationsPromises);
      }))
    .finally(() => {
      syncHelper.syncLeaders();
    });

  return {
    createBatchOp,
  };
};

module.exports = makeBatchOpsProcessor;
