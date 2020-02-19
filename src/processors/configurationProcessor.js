const configurationTag = 'configuration';

const makeConfigurationModel = (context) => {
  const { storage } = context;

  const saveConfiguration = (config) => storage.setItem(configurationTag, JSON.stringify(config));

  const getConfiguration = () => {
    const config = storage.getItem(configurationTag);
    return !config || config === '' ? null : JSON.parse(config);
  };

  return {
    getConfiguration,
    saveConfiguration,
  };
};

module.exports = makeConfigurationModel;
