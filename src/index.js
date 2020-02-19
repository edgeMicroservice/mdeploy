const { init } = require('@mimik/edge-ms-helper/init-helper');
const swaggerMiddleware = require('../build/mdeploy-swagger-mw');

mimikModule.exports = init(swaggerMiddleware);
