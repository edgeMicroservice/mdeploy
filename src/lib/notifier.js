const Promise = require('bluebird');
const { merge, values, some } = require('lodash');

const makeNodesHelper = require('../lib/nodesHelper');

const makeClientModel = require('../models/clientModel');
const makeLeaderModel = require('../models/leaderModel');

const { decodePayload } = require('./jwtHelper');
const { extractFromServiceType } = require('../util/serviceNameHelper');
const { rpAuth, getEdgeServiceLinkByNodeId } = require('../lib/auth-helper');

const NON_LEADER_ERROR = 'Cannot update containers on a non-leader mdeploy';
const NO_SERVICE_ERROR = 'Service Unavailable';

const CLUSTER_CONTAINERS_ENDPOINT = '/cluster/containers';
const LEADERS_ENDPOINT = '/leaders';

const makeNotifier = (context) => {
  let savedAccessToken;

  const fetchToken = () => {
    if (savedAccessToken) return Promise.resolve(savedAccessToken);

    return makeClientModel(context).selectUserToken()
      .then((accessToken) => {
        savedAccessToken = accessToken;
        return accessToken;
      });
  };

  const fetchCurrentNodeId = () => fetchToken()
    .then((accessToken) => {
      const decodedToken = decodePayload(accessToken);
      return decodedToken.node_id;
    });

  const fetchNodes = () => fetchToken()
    .then((accessToken) => makeNodesHelper(context)
      .findByAccount(accessToken));

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

  const notifyLeadersAboutContainers = (containers) => Promise.all([
    fetchToken(),
    fetchCurrentNodeId(),
    fetchNodes(),
    makeLeaderModel(context).fetchLeaders(),
  ])
    .then(([accessToken, currentNodeId, nodes, leaders]) => {
      const { serviceType } = context.info;

      const request = {
        endpoint: CLUSTER_CONTAINERS_ENDPOINT,
        method: 'PUT',
        body: containers,
      };

      return Promise.map(leaders, (leader) => {
        const { nodeId } = leader;

        if (currentNodeId === nodeId) return Promise.resolve();
        const nodeFoundInCluster = some(nodes, (node) => node.id === nodeId);

        if (!nodeFoundInCluster) {
          return makeLeaderModel(context)
            .removeLeader({ nodeId });
        }

        return createOperationRequest(nodeId, serviceType, request, accessToken)
          .then((result) => {
            if (result.responseType !== 'failure') return Promise.resolve();

            const responseBodyValues = values(result.responseBody);

            const isNotLeader = some(responseBodyValues, (responseBodyValue) => {
              const str = JSON.stringify(responseBodyValue);
              if (str.includes(NON_LEADER_ERROR)) return true;
              if (str.includes(NO_SERVICE_ERROR)) return true;

              return false;
            });

            if (!isNotLeader) return Promise.resolve();

            return makeLeaderModel(context)
              .removeLeader({ nodeId });
          });
      });
    });

  const notifyNonLeadersAboutLeader = (newCluster) => Promise.all([
    fetchToken(),
    fetchCurrentNodeId(),
  ])
    .then(([accessToken, currentNodeId]) => {
      const { serviceType } = context.info;

      const request = {
        endpoint: LEADERS_ENDPOINT,
        method: 'PUT',
        body: {
          nodeId: currentNodeId,
        },
      };

      return Promise.map(newCluster, ({ nodeId, isMdeploy }) => {
        if (currentNodeId === nodeId) return Promise.resolve();
        if (!isMdeploy) return Promise.resolve();

        return createOperationRequest(nodeId, serviceType, request, accessToken);
      });
    });

  return {
    notifyNonLeadersAboutLeader,
    notifyLeadersAboutContainers,
  };
};

module.exports = makeNotifier;
