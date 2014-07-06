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

      // Batch load function

      var batchCheck = function() {
        if (batchEmail) {
          if (isBuffer) scopeInfo.bufferType = bufferType
          return callback(null, that.render.bind(scopeInfo));
        }
        if (isBuffer) {
          that.render.call(scopeInfo, locals, templatePath, null, null, null, bufferType, callback);
        } else {
          that.render.call(scopeInfo, locals, templatePath, null, null, null, callback);
        }
      };

      // Ensure the `templateName` is valid
      if (templateName === undefined) return callback('templateName was not defined');

      // Set the full path to the template
      var templatePath = scopeInfo.templatePath = path.join(templateDirectory, templateName);

      // Ensure the `templateName` is a valid directory path
      fs.stat(templatePath, function(err, stats) {

        if (err) return callback(err);

        if (!stats.isDirectory())
          return callback(templatePath + ' is not a valid directory path');

        // Ensure that at least an html file exists inside
        scopeInfo.html = glob.sync(templatePath + '/*html.*')[0] || '';
        fs.stat(scopeInfo.html, function(err, stats) {

          if (err) return callback(err);

          if (!stats.isFile()) return callback(scopeInfo.html + ' is not a valid file path');

          // Read the html file
          fs.readFile(scopeInfo.html, 'utf8', function(err, data) {

            if (err) return callback(err);

            if (data === '') return callback(scopeInfo.html + ' was an empty file');
            else scopeInfo.html = data;

            // Set asset paths
            scopeInfo.text = glob.sync(templatePath + '/*text.*')[0] || '';
            scopeInfo.stylesheet = glob.sync(templatePath + '/*style.*')[0] || '';

            async.map([scopeInfo.text, scopeInfo.stylesheet], checkExists, function(err, results) {

              if (err) return callback(err);

              if (!results[0]) scopeInfo.text = false
              if (!results[1]) scopeInfo.stylesheet = false

              if (scopeInfo.text && scopeInfo.stylesheet) {
                async.map([scopeInfo.text, scopeInfo.stylesheet], fs.readFile, function(err, results) {
                  if (err) return callback(err);
                  results[0] = results[0].toString('utf8');
                  results[1] = results[1].toString('utf8');
                  if (results[0] === '') scopeInfo.text = false;
                  if (results[1] === '') scopeInfo.stylesheet = false;
                  scopeInfo.text = results[0];
                  scopeInfo.stylesheet = results[1];
                  batchCheck();
                });
              } else if (scopeInfo.text && !scopeInfo.stylesheet) {
                fs.readFile(scopeInfo.text, 'utf8', function(err, data) {
                  if (err) return callback(err);
                  if (data === '') return callback(scopeInfo.text + ' was empty');
                  scopeInfo.text = data;
                  batchCheck();
                });
              } else if (!scopeInfo.text && scopeInfo.stylesheet) {
                fs.readFile(scopeInfo.stylesheet, 'utf8', function(err, data) {
                  if (err) return callback(err);
                  if (data === '') return callback(scopeInfo.stylesheet + ' was empty');
                  scopeInfo.stylesheet = data;
                  batchCheck();
                });
              } else {
                batchCheck();
              }

            });


          });
        });
      });
    });

    function checkExists(item, callback) {
      function cb(exists) {
        return callback(null, exists)
      }
      // node >= v0.8.x
      if (fs.exists) return fs.exists(item, cb)
      // other versions of node fallback to path.exists
      return path.exists(item, cb)
    }


  });
};

module.exports = function(templateDirectory, defaults, done) {
  return new EmailTemplate(templateDirectory, defaults, done);
};
