const { init } = require('@mimik/edge-ms-helper/init-helper');

const swaggerMiddleware = require('../build/mdeploy-swagger-mw');
const { edgeSessionMiddleware } = require('./lib/edgeAuth');

mimikModule.exports = init(swaggerMiddleware, edgeSessionMiddleware);
