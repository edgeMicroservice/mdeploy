/* eslint-disable no-unused-vars */
const { extractToken } = require('@mimik/edge-ms-helper/authorization-helper');

const SecurityHandler = (req, definition, apikey, next) => {
  const accessToken = extractToken(req.authorization);
  const { context } = req;

  if (!accessToken) {
    next(new Error('Forbidden: accessToken not present'));
    return;
  }

  if (accessToken !== 'hello') {
    next(new Error('Forbidden: accessToken did not match'));
    return;
  }

  req.security = {
    type: 'EdgeDeploymentSecurity',
  };
  next();
};

module.exports = SecurityHandler;
