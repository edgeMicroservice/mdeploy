const response = require('@mimik/edge-ms-helper/response-helper');

const makeLeaderProcessor = require('../processors/leaderProcessor');

const getLeaders = (req, res) => {
  const { context } = req;

  return makeLeaderProcessor(context)
    .getLeaders()
    .then((data) => {
      response.sendResult({ data }, 200, res);
    })
    .catch((err) => {
      response.sendError(err, res, 400);
    });
};


const updateLeaders = (req, res) => {
  const { context, swagger } = req;
  const { leaderUpdate } = swagger.params;

  return makeLeaderProcessor(context)
    .updateClientStatus(leaderUpdate)
    .then((data) => {
      response.sendResult({ data }, 200, res);
    })
    .catch((err) => {
      response.sendError(err, res, 400);
    });
};

module.exports = {
  getLeaders,
  updateLeaders,
};
