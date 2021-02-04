const Promise = require('bluebird');

const { filter } = require('lodash');


/**
 * Leader Model Schema
 * leaders = [
 *  {
 *    nodeId: '--node-id--'
 *  }
 * ]
 */

const STORAGE_ID = 'leaders';

const makeLeaderModel = (context) => {
  const { storage } = context;

  const fetchLeaders = () => {
    const leadersStr = storage.getItem(STORAGE_ID);
    const leaders = !leadersStr || leadersStr === '' ? [] : JSON.parse(leadersStr);
    return Promise.resolve(leaders);
  };

  const persistLeaders = (leaders) => {
    const leadersStr = JSON.stringify(leaders);
    storage.setItem(STORAGE_ID, leadersStr);
    return Promise.resolve(leaders);
  };

  const addLeader = (newLeader) => fetchLeaders()
    .then((leaders) => {
      const updateLeaders = filter(leaders, (leader) => leader.nodeId !== newLeader.nodeId);
      updateLeaders.push(newLeader);
      return persistLeaders(updateLeaders);
    });

  const removeLeader = (leaderToRemove) => fetchLeaders()
    .then((leaders) => {
      const updateLeaders = filter(leaders, (leader) => leader.nodeId !== leaderToRemove.nodeId);
      return persistLeaders(updateLeaders);
    });

  return {
    addLeader,
    fetchLeaders,
    removeLeader,
  };
};

module.exports = makeLeaderModel;
