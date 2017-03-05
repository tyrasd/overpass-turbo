/* eslint-env node */
module.exports = function(config) {
  var tests = 'tests/test.*.js';

  config.set({
    frameworks: ['mocha'],

    files: [{
      pattern: tests,
    }],

    browsers: ['PhantomJS'],

    preprocessors: {
      [tests]: ['webpack'],
    },

  });
};
