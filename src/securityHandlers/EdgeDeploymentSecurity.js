const { extractToken } = require('@mimik/edge-ms-helper/authorization-helper');
const makeConfigurationModel = require('../models/configurationModel');

const SecurityHandler = (req, definition, apikey, next) => {
  const accessToken = extractToken(req.authorization);
  const { context } = req;

  if (!accessToken) {
    next(new Error('Forbidden: accessToken not present'));
    return;
  }

  const config = makeConfigurationModel(context).getConfiguration();
  if (!config || config.edgeDeploymentAccessKey !== accessToken) {
    next(new Error('Forbidden: accessToken did not match'));
    return;
  }

  req.security = {
    type: 'EdgeDeploymentSecurity',
  };
  next();
};

module.exports = SecurityHandler;
