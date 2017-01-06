'use strict';

var _require = require('./util'),
    ensureDirectory = _require.ensureDirectory;

var isFunction = require('lodash/isFunction');
var EmailTemplate = require('./email-template').default;
var debug = require('debug')('email-templates:creator');

var _require2 = require('path'),
    basename = _require2.basename;

function exportable(templateDirectory, options, done) {
  if (isFunction(options)) {
    done = options;
    options = {};
  }
  if (!templateDirectory) {
    return done(new Error('templateDirectory is undefined'));
  }

  return ensureDirectory(templateDirectory, function (err) {
    if (err) return done(err);
    debug('Creating Email Templates in %s', basename(templateDirectory));
    return done(null, template(templateDirectory, options));
  });
}

function template(templateDirectory, options) {
  return function _template(directory, locals, callback) {
    if (isFunction(locals)) {
      callback = locals;
      locals = {};
    }
    if (directory == null) {
      return callback(new Error('templateName was not defined'));
    }

    var et = new EmailTemplate(templateDirectory + '/' + directory, options);
    if (locals === true) {
      return callback(null, function (locals, dir, next) {
        et.render(locals, function (err, result) {
          result = result || {};
          next(err, result.html, result.text, result.subject);
        });
      });
    }

    et.render(locals, function (err, result) {
      result = result || {};
      callback(err, result.html, result.text, result.subject);
    });
  };
}

exportable.EmailTemplate = EmailTemplate;
exportable.requires = require('consolidate').requires;
module.exports = exportable;