const Promise = require('bluebird');

const makeSyncHelper = require('../lib/syncHelper');

const makeBepProcessor = (context) => {
  const syncHelper = makeSyncHelper(context);

  const getBep = (hmac) => new Promise((resolve, reject) => {
    context.edge.requestBep({
      code: hmac,
      success: (result) => resolve({ href: result.data }),
      error: (err) => reject(new Error(err.message)),
    });
  })
    .finally(() => {
      syncHelper.syncLeaders();
    });

  return {
    getBep,
  };
};

module.exports = makeBepProcessor;
