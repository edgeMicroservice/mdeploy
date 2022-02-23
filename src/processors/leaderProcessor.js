const makeLeaderModel = require('../models/leaderModel');

const makeSyncHelper = require('../lib/syncHelper');

const makeLeaderProcessor = (context) => {
  const leaderModel = makeLeaderModel(context);
  const syncHelper = makeSyncHelper(context);

  const getLeaders = () => leaderModel.fetchLeaders()
    .finally(syncHelper.syncLeaders);

  const updateLeaders = (leaderUpdate) => leaderModel.addLeader(leaderUpdate)
    .then(syncHelper.syncLeaders)
    .then(syncHelper.syncContainers)
    .then(() => leaderUpdate);

  return {
    getLeaders,
    updateLeaders,
  };
};

module.exports = makeLeaderProcessor;
