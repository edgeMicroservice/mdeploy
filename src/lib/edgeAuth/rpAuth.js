/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
const Promise = require('bluebird');
const querystring = require('query-string');
const merge = require('lodash/merge');
const keysIn = require('lodash/keysIn');

const makeRequestPromisifier = require('./requestPromisifier');
const { findByServiceType } = require('./sessionMap');
const { encrypt } = require('./encryptionHelper');

const fetchTokenFromMST = () => Promise.resolve('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6ImNyZWF0ZTppbWFnZSByZWFkOmltYWdlcyBkZWxldGU6aW1hZ2UgY3JlYXRlOmNvbnRhaW5lciByZWFkOmNvbnRhaW5lcnMgZGVsZXRlOmNvbnRhaW5lciIsInN1YlR5cGUiOiJtZGVwbG95IiwiY3VzdCI6IjZmM2QyMGE1LTdhZWQtNGFjOS05ZGVjLTg5YTQwMTMzZTI3MiIsImlhdCI6MTU4MzI3OTUzMywiZXhwIjoxNTgzMzY1OTMzLCJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjgwMjUvbVNUL3YxL2NsaWVudHMvR2VuZXJpYy1tZGVwbG95LTZmM2QyMGE1LTdhZWQtNGFjOS05ZGVjLTg5YTQwMTMzZTI3MiIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAyNS9tU1QvdjEvb2F1dGgvdG9rZW4iLCJzdWIiOiJHZW5lcmljLW1kZXBsb3ktNmYzZDIwYTUtN2FlZC00YWM5LTlkZWMtODlhNDAxMzNlMjcyQGNsaWVudHMifQ.r4ez7os6SKHqqwZLrrcGarZv8WOltQxuZ41HUzTfOjI');

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

const rpAuth = (serviceType, options, context) => {
  const updatedOptions = options;

  return (() => {
    if (!updatedOptions.token && serviceType !== 'MCM') {
      return fetchTokenFromMST();
    }
    return Promise.resolve();
  })()
    .then((token) => {
      if (token) updatedOptions.token = token;

      if (serviceType === 'MCM' || (options.headers && options.headers['x-mimik-routing'])) {
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
    });
};

module.exports = {
  rpAuth,
};
