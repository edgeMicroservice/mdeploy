const Promise = require('bluebird');

const makeRequestPromise = (context) => {
  const request = (options) => {
    const { http } = context;
    return new Promise((resolve, reject) => {
      http.request(({
        url: options.url,
        type: options.type,
        authorization: options.authorization,
        data: JSON.stringify(options.data),
        success: (result) => {
          const response = result.data && result.data !== '' ? JSON.parse(result.data) : {};
          resolve(response);
        },
        error: (err) => {
          const errorContent = (!err.content || err.content === '') ? {
            message: err.message,
            status: err.status,
          } : JSON.parse(err.content);
          const errorObject = errorContent.error ? errorContent.error : errorContent;
          if (errorObject.msg) errorObject.message = errorObject.msg;
          reject(errorObject);
        },
      }));
    });
  };

  return {
    request,
  };
};


module.exports = makeRequestPromise;
