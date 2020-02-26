const querystring = require('query-string');
const merge = require('lodash/merge');

const makeRequestPromisifier = require('./requestPromisifier');
const { encrypt, decrypt } = require('./encryptionHelper');
const { findBySessionId, findByServiceType } = require('./sessionMap');

const edgeAuthIncomingMiddleware = (req, res, next) => {
  const { url } = req;

  const queryString = url.split('?')[1];
  const queryParams = queryString ? querystring.parse(`?${queryString}`) : undefined;

  if (queryParams && (queryParams.edgeAuthSessionId || queryParams.edgeAuthInteraction)) {
    if (!(queryParams.edgeAuthSessionId && queryParams.edgeAuthInteraction)) {
      throw new Error('both edgeAuthSessionId and edgeAuthInteraction are required in the query string to decrypt request');
    }

    const keyMap = findBySessionId(queryParams.edgeAuthSessionId);
    if (!keyMap) throw new Error('cannot find edgeAuthSessionId. might have been removed or expired');
    let options;
    try {
      options = JSON.parse(
        decrypt(queryParams.edgeAuthInteraction, keyMap.sessionId, keyMap.sessionSecret),
      );
    } catch (error) {
      throw new Error('cannot decode edgeAuthInteraction param');
    }

    if (options.qs) {
      const qs = querystring.stringify(options.qs);
      req.url = `${req.url.split('?')[0]}?${qs}`;
    }
    if (options.token || (options.headers && options.headers.Authorization)) {
      req.authorization = options.token || options.headers.Authorization;
    }
    if (options.body) req.body = JSON.stringify(options.body);

    next();
  } else {
    next();
  }
};

const fetchToken = () => 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBvc3Q6Y29uZmlndXJhdGlvbiIsImlhdCI6MTU4MTUyOTY2OCwiZXhwIjoxODgxNTI5NjY4fQ.XD1-9HCIIBV8GhSL2bhZZ2yFz8Vts6gqIifWBFxyzHQCH507OHg0I1E-UFRqViVumE0ODlR_ikRjRjr-kyFd_--PHfGVkGdpQ5C2osMZAhnC1QgPgq7_0FAyvL1uiwh3G4ef8QZ3izVrzsgYhnl5_x42TbwgW-h7HOaILS_yoyY';

// eslint-disable-next-line no-unused-vars
const rpAuth = (serviceType, options, context, isTargetEdge) => {
  const updatedOptions = options;

  if (serviceType === 'MCM') {
    let url = updatedOptions.url || updatedOptions.uri;
    const qs = querystring.stringify(updatedOptions.qs);
    if (updatedOptions.qs) url = url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;

    const requestOptions = {
      url,
      type: updatedOptions.method,
    };
    if (updatedOptions.body) requestOptions.data = updatedOptions.body;
    if (updatedOptions.token || (updatedOptions.headers && updatedOptions.headers.Authorization)) {
      requestOptions.authorization = updatedOptions.token || updatedOptions.headers.Authorization;
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

  const edgeAuthParams = {
    edgeAuthSessionId: keyMap.sessionId,
    edgeAuthInteraction: encrypt(
      JSON.stringify(updatedOptions), keyMap.sessionId, keyMap.sessionSecret,
    ),
  };

  const qs = querystring.stringify(edgeAuthParams);
  const urlWithParams = url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;

  return makeRequestPromisifier(context)
    .request({
      url: urlWithParams,
      type: updatedOptions.method,
    });
};

module.exports = {
  rpAuth,
  edgeAuthIncomingMiddleware,
};
