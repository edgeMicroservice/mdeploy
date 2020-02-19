const response = require('@mimik/edge-ms-helper/response-helper');
const makeConfigurationProcessor = require('../processors/configurationProcessor');

const postConfiguration = (req, res) => {
  const { context, swagger } = req;

  makeConfigurationProcessor(context)
    .saveConfiguration(swagger.params.newConfiguration);

  response.sendResult('Configuration Updated', 200, res);
};

module.exports = {
  postConfiguration,
};
