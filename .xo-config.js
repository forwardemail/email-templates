module.exports = {
  prettier: true,
  space: true,
  extends: ['xo-lass'],
  ignore: ['config.js'],
  rules: {
    'unicorn/prefer-top-level-await': 'warn',
    'unicorn/prefer-node-protocol': 'warn'
  }
};
