//     node-email-templates
//     Copyright (c) 2012 Nick Baugh <niftylettuce@gmail.com>
//     MIT Licensed

// Node.js module for rendering beautiful emails with [ejs][1] templates
//  and email-friendly inline CSS using [juice][2].

// * Author: [@niftylettuce](https://twitter.com/#!/niftylettuce)
// * Source: <https://github.com/niftylettuce/node-email-templates>

// # node-email-templates

var path  = require('path')
  , fs    = require('fs')
  , async = require('async')
  , juice = require('juice2')
  , glob  = require('glob')
  , zlib  = require('zlib')
  , _     = require('underscore')
  , tm    = require('./templateManager')

var validBufferTypes = [ 'deflate', 'deflateRaw', 'gzip' ]

// # Email Template
var EmailTemplate = function(templateDirectory, defaults, done) {

  if (typeof defaults === 'function') done = defaults;

  var that = this;

  this.render = function(locals, templatePath, html, text, stylesheet, bufferType, callback) {
    // Check if `bufferType` is a function (callback), or string
    var isBuffer = false
    if (typeof bufferType === 'function') {
      callback = bufferType
    } else if (typeof bufferType === 'string') {
      // Ensure that `bufferType` is a valid `zlib` compression type
      if (_.indexOf(validBufferTypes, bufferType) === -1) {
        throw new Error('`zlib.' + bufferType + '` does not exist or is not a valid buffer type')
      } else {
        isBuffer = true
      }
    }

    // Check if `bufferType` is not an empty string, so we'll use the
    // global bufferType instead.
    if (this.bufferType !== '') {
      isBuffer = true
      bufferType = this.bufferType
    }

    if (typeof html === 'function') {
      callback = html;
      html     = this.html;
    }
    if (!html) html = this.html
    if (!text) text = this.text
    if (!stylesheet) stylesheet = this.stylesheet
    locals = _.defaults(locals, (typeof defaults === 'object') ? defaults : {});
    locals.templatePath = this.templatePath

    // Configure options for template and stylesheet files.
    var htmlOpts = { source: html, locals: locals }
      , textOpts = { source: text, locals: locals }
      , cssOpts  = { source: stylesheet, locals: locals };
    htmlOpts.filename = glob.sync(path.join(locals.templatePath, '*html.*'))[0];
    textOpts.filename = glob.sync(path.join(locals.templatePath, '*text.*'))[0];
    cssOpts.filename  = glob.sync(path.join(locals.templatePath, '*style.*'))[0];

    // Render all templates and stylesheets.
    async.map([htmlOpts, textOpts, cssOpts], tm.render.bind(tm), function(err, results) {
      if (err) return callback(err)
      html = results[0]
      text = results[1]
      stylesheet = results[2]

      // Inject available styles into HTML.
      html = (stylesheet) ? juice(html, stylesheet) : html

      // Return a compressed buffer if needed.
      if (isBuffer) {
        async.map([ new Buffer(html), new Buffer(text) ], zlib[bufferType], function(err, buffers) {
          if (err) return callback(err)
          html = buffers[0]
          text = buffers[1]
          callback(null, html, text)
        })
      }else {
        callback(null, html, text)
      }
    })
  };

  // Ensure the `templateDirectory` is not undefined
  if (typeof templateDirectory === 'undefined')
    return done(new Error('templateDirectory is undefined'));

  // Ensure the `templateDirectory` is a valid directory path
  fs.stat(templateDirectory, function(err, stats) {

    if (err) return done(new Error(err));

    if (!stats.isDirectory())
      return done(new Error('templateDirectory is not a valid directory path'));

    done(null, function(templateName, locals, bufferType, callback) {
      var scopeInfo = {
        'templatePath': '',
        'stylesheet': '',
        'text': '',
        'html': '',
        'bufferType':'' 
      };

      // Check if `bufferType` is a function (callback), or string
      var isBuffer = false
      if (typeof bufferType === 'function') {
        callback = bufferType
      } else if (typeof bufferType === 'string') {
        // Ensure that `bufferType` is a valid `zlib` compression type
        if (_.indexOf(validBufferTypes, bufferType) === -1) {
          throw new Error('`zlib.' + bufferType + '` does not exist or is not a valid buffer type')
        } else {
          isBuffer = true
        }
      }

      // Fallback if user doesn't pass all the args
      var batchEmail = false;
      if (typeof locals !== 'undefined' && typeof locals === 'function') {
        callback = locals;
        locals = {};
      } else if (typeof callback !== 'undefined' && typeof callback === 'function') {
        if (typeof locals === 'undefined' || !locals instanceof Object) {
          locals = {};
        } else if (locals === true) {
          // We are trying to load the template into memory, but not render it
          // This lets us send batches of emails using the same template
          //  and we only are loading the assets once
          batchEmail = true;
        }
      }

      // Ensure the `templateName` is valid
      if (templateName === undefined) return callback('templateName was not defined');

      // Set the full path to the template
      var templatePath = scopeInfo.templatePath = path.join(templateDirectory, templateName);

      // Ensure the `templateName` is a valid directory path
      fs.stat(templatePath, function(err, stats) {

        if (err) return callback(err);

        if (!stats.isDirectory())
          return callback(templatePath + ' is not a valid directory path');

        // Set asset paths
        scopeInfo.html = glob.sync(templatePath + '/*html.*')[0] || '';
        scopeInfo.text = glob.sync(templatePath + '/*text.*')[0] || '';
        scopeInfo.stylesheet = glob.sync(templatePath + '/*style.*')[0] || '';

        //async.map([scopeInfo.html, scopeInfo.text, scopeInfo.stylesheet], checkExists, function(err, results) {

        checkExists({
          "html": scopeInfo.html,
          "text": scopeInfo.text,
          "stylesheet": scopeInfo.stylesheet
        }, function (err, key, exists) {

          if (err) return callback(err);

          if (!exists) scopeInfo[key] = false

          if (!scopeInfo[key] || scopeInfo[key] === '')  return;
          fs.readFile(scopeInfo[key], 'utf8', function(err, result) {
            if (err) return callback(err);

            if (result === '' && key !== "stylesheet")
                return callback(scopeInfo[key] + ' was empty');

            if (result === '') scopeInfo[key] = false;

            scopeInfo[key] = result;

            if (batchEmail) {
              if (isBuffer) scopeInfo.bufferType = bufferType;
              return callback(null, that.render.bind(scopeInfo));
            }
            if (isBuffer) {
              that.render.call(scopeInfo, locals, templatePath, null, null, null, bufferType, callback);
            } else {
              that.render.call(scopeInfo, locals, templatePath, null, null, null, callback);
            }
          });

        });

      });
    });

    function checkExists(items, callback) {
      if (!(items.html || items.text))
        return callback("Please specify at least one (text or html) template");

      var checkExistFunc;
      if (fs.exists) {
        // node >= v0.8.x
        checkExistFunc = fs.exists;
      } else {
        // other versions of node fallback to path.exists
        checkExistFunc = path.exists;
      }

      var testExist = function(items, key) {
        checkExistFunc(items[key], function(exists) {
          callback(null, key, exists);
        });
      };

      for (var key in items) {
        if (items.hasOwnProperty(key)) {
          testExist(items, key);
        }
      }
    }


  });
};

module.exports = function(templateDirectory, defaults, done) {
  return new EmailTemplate(templateDirectory, defaults, done);
};
