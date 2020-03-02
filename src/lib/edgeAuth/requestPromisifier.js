const Q = require('q');

const makeRequestPromisifier = (context) => {
  const request = (options) => {
    const { http } = context;
    const deferred = Q.defer();

    http.request(({
      url: options.url,
      type: options.type,
      authorization: options.authorization,
      data: JSON.stringify(options.data),
      success: (result) => {
        const response = result.data && result.data !== '' ? JSON.parse(result.data) : {};
        deferred.resolve(response);
      },
      error: (err) => {
        const errorContent = (!err.content || err.content === '') ? {
          message: err.message,
          status: err.status,
        } : JSON.parse(err.content);
        console.log(errorContent.error ? errorContent.error : errorContent);
        const errorObject = errorContent.error ? errorContent.error : errorContent;
        if (errorObject.msg) errorObject.message = errorObject.msg;
        deferred.reject(errorObject);
      },
    }));
    return deferred.promise;
  };

  return {
    request,
  };
};


module.exports = makeRequestPromisifier;
