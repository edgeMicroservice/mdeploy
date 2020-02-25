const Q = require('q');

const makeRequestPromisifier = (context) => {
  const request = (options) => {
    const { http } = context;
    const deferred = Q.defer();

    http.request(({
      url: options.url,
      type: options.type,
      authorization: options.authorization,
      data: options.data,
      success: (result) => {
        deferred.resolve(result);
      },
      error: (err) => {
        deferred.reject(new Error(err));
      },
    }));
    return deferred.promise;
  };

  return {
    request,
  };
};


module.exports = makeRequestPromisifier;
