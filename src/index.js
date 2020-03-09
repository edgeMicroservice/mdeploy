const { init } = require('@mimik/edge-ms-helper/init-helper');

const swaggerMiddleware = require('../build/mdeploy-swagger-mw');
const { edgeSessionMiddleware } = require('./lib/auth-helper');

mimikModule.exports = init([edgeSessionMiddleware, swaggerMiddleware]);
