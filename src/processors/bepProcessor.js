const Q = require('q');

const makeBepProcessor = (context) => {
  const getBep = (hmac) => {
    const deferred = Q.defer();
    context.edge.requestBep({
      code: hmac,
      success: (result) => deferred.resolve({ href: result.data }),
      error: (err) => deferred.reject(new Error(err.message)),
    });
    return deferred.promise;
  };

  return {
    getBep,
  };
};

module.exports = makeBepProcessor;
