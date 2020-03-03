const querystring = require('query-string');
const merge = require('lodash/merge');
const keysIn = require('lodash/keysIn');

const makeRequestPromisifier = require('./requestPromisifier');
const { findByServiceType } = require('./sessionMap');
const { encrypt } = require('./encryptionHelper');

const fetchToken = () => 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBvc3Q6Y29uZmlndXJhdGlvbiIsImlhdCI6MTU4MTUyOTY2OCwiZXhwIjoxODgxNTI5NjY4fQ.XD1-9HCIIBV8GhSL2bhZZ2yFz8Vts6gqIifWBFxyzHQCH507OHg0I1E-UFRqViVumE0ODlR_ikRjRjr-kyFd_--PHfGVkGdpQ5C2osMZAhnC1QgPgq7_0FAyvL1uiwh3G4ef8QZ3izVrzsgYhnl5_x42TbwgW-h7HOaILS_yoyY';

const makeHeaders = (auth, maps) => {
  const DELI = '\r\n';
  let headers = auth;

  Object.keys(maps).forEach((key) => {
    const value = maps[key];
    if (headers) {
      headers = `${headers}${DELI}${key}: ${value}`;
    } else {
      headers = `no-token${DELI}${key}: ${value}`;
    }
  });

  return headers;
};

// eslint-disable-next-line no-unused-vars
const rpAuth = (serviceType, options, context) => {
  const updatedOptions = options;

  if (serviceType === 'MCM' || (options.headers && options.headers['x-mimik-routing'])) {
    let url = updatedOptions.url || updatedOptions.uri;
    const qs = querystring.stringify(updatedOptions.qs);
    if (updatedOptions.qs) url = url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;

    const requestOptions = {
      url,
      type: updatedOptions.method,
    };
    if (updatedOptions.body) requestOptions.data = updatedOptions.body;

    // If mcm, donot append token
    if (!updatedOptions.token) updatedOptions.token = fetchToken();
    if (updatedOptions.token || (updatedOptions.headers && updatedOptions.headers.Authorization)) {
      requestOptions.authorization = updatedOptions.token || updatedOptions.headers.Authorization;
    }
    const headerKeys = keysIn(updatedOptions.headers);
    const isAdditionalHeaders = headerKeys.indexOf('Authorization') > -1 ? headerKeys.length > 1 : headerKeys.length > 0;
    if (isAdditionalHeaders) {
      const additionalHeaders = updatedOptions.headers;
      delete additionalHeaders.Authorization;
      requestOptions.authorization = makeHeaders(requestOptions.authorization, additionalHeaders);
    }
    return makeRequestPromisifier(context)
      .request(requestOptions);
  }
  const keyMap = findByServiceType(serviceType);
  if (!keyMap) throw new Error(`could not find key for serviceType: ${serviceType}`);

  let url = updatedOptions.url || updatedOptions.uri;
  if (url.includes('?')) {
    const [path, queries] = url.split('?');
    url = path;
    updatedOptions.qs = merge(updatedOptions.qs, querystring.parse(queries));
  }

  updatedOptions.token = fetchToken();

  const edgeSessionParams = {
    edgeSessionId: keyMap.sessionId,
    edgeSessionInteraction: encrypt(
      JSON.stringify(updatedOptions), keyMap.sessionId, keyMap.sessionSecret,
    ),
  };

  const qs = querystring.stringify(edgeSessionParams);
  const urlWithParams = url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;

  return makeRequestPromisifier(context)
    .request({
      url: urlWithParams,
      type: updatedOptions.method,
    });
};

module.exports = {
  rpAuth,
};
