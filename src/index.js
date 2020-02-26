const { init } = require('@mimik/edge-ms-helper/init-helper');

const swaggerMiddleware = require('../build/mdeploy-swagger-mw');
const { edgeAuthIncomingMiddleware } = require('./lib/edgeCrypt');

mimikModule.exports = init(swaggerMiddleware, edgeAuthIncomingMiddleware);
