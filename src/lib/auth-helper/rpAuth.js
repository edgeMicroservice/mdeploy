const Promise = require('bluebird');
const querystring = require('query-string');
const merge = require('lodash/merge');
const keysIn = require('lodash/keysIn');

const makeRequestPromise = require('./requestPromise');
const makeSessionMap = require('./sessionMap');
const { encrypt } = require('./encryptionHelper');
const { SERVICE_CONSTANTS } = require('./common');
const { debugLog } = require('../../util/logHelper');

const fetchTokenFromMST = (serviceType, context) => {
  const {
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    MST_URL,
    CUSTOMER_CODE,
  } = context.env;

  return makeRequestPromise(context)
    .request({
      url: `${MST_URL}/oauth/token`,
      type: 'POST',
      data: {
        client_id: OAUTH_CLIENT_ID,
        client_secret: OAUTH_CLIENT_SECRET,
        audience: `${MST_URL}/clients/Generic-${serviceType}-${CUSTOMER_CODE}`,
        grant_type: 'client_credentials',
      },
    })
    .then((response) => ({ token: `${response.data.token_type} ${response.data.access_token}` }))
    .catch((error) => ({
      error,
    }));
};

const makeHeaders = (auth, maps) => {
  const DELI = '\r\n';
  let headers = auth;

  Object.keys(maps).forEach((key) => {
    const value = maps[key];
    if (headers) {
      headers = `${headers}${DELI}${key}: ${value}`;
    } else {
      headers = `${DELI}${key}: ${value}`;
    }
  });

  return headers;
};

const rpAuth = (serviceObj, options, context, encryptRequest = true) => {
  debugLog('rpAuth called with', {
    serviceObj,
    options,
  });

  let serviceType;
  let projectId;
  if (typeof serviceObj === 'string') {
    serviceType = serviceObj;
  } else {
    serviceType = serviceObj.serviceType;
    projectId = serviceObj.projectId;
  }

  const updatedOptions = options;

  return (() => {
    if (!updatedOptions.token && serviceType !== SERVICE_CONSTANTS.MCM && context.env.SERVER_SECURITY_SET === 'on') {
      return fetchTokenFromMST(serviceType, context);
    }
    return Promise.resolve({});
  })()
    .then((tokenResult) => {
      if (tokenResult.error && context.env.SESSION_SECURITY_AUTHORIZATION_SET !== 'on') {
        console.log('===> here 1');
        console.log(`cannot fetch mST token for serviceType: ${serviceType}, error: ${tokenResult.error.message}`);
        throw new Error(`cannot fetch mST token for serviceType: ${serviceType}, error: ${tokenResult.error.message}`);
      }
      if (tokenResult.token) updatedOptions.token = tokenResult.token;

      if (!encryptRequest || serviceType === SERVICE_CONSTANTS.MCM || (options.headers && options.headers['x-mimik-routing'])) {
        if (serviceType !== SERVICE_CONSTANTS.MCM && tokenResult.error) {
          console.log('===> here 2');
          console.log(`cannot fetch mST token for serviceType: ${serviceType}, error: ${tokenResult.error.message}`);
          throw new Error(`cannot fetch mST token for serviceType: ${serviceType}, error: ${tokenResult.error.message}`);
        }
        let url = updatedOptions.url || updatedOptions.uri;
        const qs = querystring.stringify(updatedOptions.qs);
        if (updatedOptions.qs) url = url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;

        const requestOptions = {
          url,
          type: updatedOptions.method,
        };
        if (updatedOptions.body) requestOptions.data = updatedOptions.body;

        if (updatedOptions.token
          || (updatedOptions.headers && updatedOptions.headers.Authorization)) {
          requestOptions.authorization = updatedOptions.token
            || updatedOptions.headers.Authorization;
        }
        const headerKeys = keysIn(updatedOptions.headers);
        const isAdditionalHeaders = headerKeys.indexOf('Authorization') > -1 ? headerKeys.length > 1 : headerKeys.length > 0;
        if (isAdditionalHeaders) {
          const additionalHeaders = updatedOptions.headers;
          delete additionalHeaders.Authorization;
          requestOptions.authorization = makeHeaders(
            requestOptions.authorization, additionalHeaders,
          );
        }
        return makeRequestPromise(context)
          .request(requestOptions);
      }

      const keyMap = makeSessionMap(context).findByProject(projectId);
      if (!keyMap) throw new Error(projectId ? `could not find session key for projectId: ${projectId}` : 'could not find session key for current project');

      let url = updatedOptions.url || updatedOptions.uri;
      if (url.includes('?')) {
        const [path, queries] = url.split('?');
        url = path;
        updatedOptions.qs = merge(updatedOptions.qs, querystring.parse(queries));
      }

      const edgeSessionParams = {
        edgeSessionId: keyMap.sessionId,
        edgeSessionInteraction: encrypt(
          JSON.stringify(updatedOptions), keyMap.sessionId, keyMap.sessionSecret,
        ),
      };

      const qs = querystring.stringify(edgeSessionParams);
      const urlWithParams = url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;

      return makeRequestPromise(context)
        .request({
          url: urlWithParams,
          type: updatedOptions.method,
        });
    });
};

module.exports = {
  rpAuth,
};
