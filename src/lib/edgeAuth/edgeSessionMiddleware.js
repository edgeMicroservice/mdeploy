/* eslint-disable max-len */
/* eslint-disable global-require */
const querystring = require('query-string');

const { decrypt } = require('./encryptionHelper');
const { findBySessionId } = require('./sessionMap');

const edgeSessionMiddleware = (req, res, next) => {
  const { url } = req;

  const queryString = url.split('?')[1];
  const queryParams = queryString ? querystring.parse(`?${queryString}`) : undefined;

  if (queryParams && (queryParams.edgeSessionId || queryParams.edgeSessionInteraction)) {
    if (!(queryParams.edgeSessionId && queryParams.edgeSessionInteraction)) {
      throw new Error('both edgeSessionId and edgeSessionInteraction are required in the query string to decrypt request');
    }

    const keyMap = findBySessionId(queryParams.edgeSessionId);
    if (!keyMap) throw new Error('cannot find edgeSessionId. might have been removed or expired');
    let options;
    try {
      options = JSON.parse(
        decrypt(queryParams.edgeSessionInteraction, keyMap.sessionId, keyMap.sessionSecret),
      );
    } catch (error) {
      throw new Error('cannot decode edgeSessionInteraction param');
    }

    if (options.qs) {
      const qs = querystring.stringify(options.qs);
      req.url = `${req.url.split('?')[0]}?${qs}`;
    }
    if (options.token || (options.headers && options.headers.Authorization)) {
      req.authorization = options.token || options.headers.Authorization;
    }
    if (options.body) req.body = JSON.stringify(options.body);

    const util = require('util');
    console.log('===> options', Date.now(), '', util.inspect(options, false, null, true));
    console.log('===> request after middleware processing', Date.now(), '', util.inspect(req, false, null, true));

    next();
  } else {
    next();
  }
};

module.exports = {
  edgeSessionMiddleware,
};
