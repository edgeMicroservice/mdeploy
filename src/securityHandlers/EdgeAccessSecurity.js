const { extractToken } = require('@mimik/edge-ms-helper/authorization-helper');

const SecurityHandler = (req, definition, apikey, next) => {
  const accessToken = extractToken(req.authorization);
  if (!accessToken) {
    next(new Error('Forbidden: accessToken not present'));
    return;
  }

  req.security = {
    type: 'EdgeAccessSecurity',
    accessToken,
  };
  next();
};

module.exports = SecurityHandler;
