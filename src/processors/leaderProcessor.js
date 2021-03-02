const makeLeaderModel = require('../models/leaderModel');

const makeSyncHelper = require('../lib/syncHelper');

const makeLeaderProcessor = (context) => {
  const leaderModel = makeLeaderModel(context);
  const syncHelper = makeSyncHelper(context);

  const getLeaders = () => leaderModel.fetchLeaders()
    .finally(() => {
      syncHelper.syncLeaders();
    });

  const updateLeaders = (leaderUpdate) => leaderModel.addLeader(leaderUpdate)
    .then(() => leaderUpdate)
    .finally(() => {
      syncHelper.syncContainers(undefined, true);
      syncHelper.syncLeaders();
    });

  return {
    getLeaders,
    updateLeaders,
  };
};

module.exports = makeLeaderProcessor;
