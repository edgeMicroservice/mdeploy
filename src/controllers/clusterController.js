const response = require('@mimik/edge-ms-helper/response-helper');

const makeClusterProcessor = require('../processors/clusterProcessor');

const updateContainersInCluster = (req, res) => {
  const { context, swagger } = req;

  const { env } = context;
  const { containersUpdate } = swagger.params;

  if (env.IS_LEADER !== 'yes') {
    response.sendError(new Error('Cannot update containers on a non-leader mdeploy'), res, 400);
    return;
  }

  makeClusterProcessor(context)
    .updateContainersInCluster(containersUpdate)
    .then((data) => {
      response.sendResult({ data }, 200, res);
    })
    .catch((err) => {
      response.sendError(err, res, 400);
    });
};


module.exports = {
  updateContainersInCluster,
};
