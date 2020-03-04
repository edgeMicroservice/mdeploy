const Promise = require('bluebird');

const makeBepProcessor = (context) => {
  const getBep = (hmac) => new Promise((resolve, reject) => {
    context.edge.requestBep({
      code: hmac,
      success: (result) => resolve({ href: result.data }),
      error: (err) => reject(new Error(err.message)),
    });
  });

  return {
    getBep,
  };
};

module.exports = makeBepProcessor;
