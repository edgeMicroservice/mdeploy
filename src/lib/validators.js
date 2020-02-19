const reg = /^v((?!(0))(\d+)).((?!(0))(\d+)).((?!(0))(\d+))$/;

const versionValidator = (str) => reg.test(str);

module.exports = {
  versionValidator,
};
