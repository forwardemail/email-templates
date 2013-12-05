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
  , ejs   = require('ejs')
  , juice = require('juice')
  , zlib  = require('zlib')
  , _     = require('underscore')

var validBufferTypes = [ 'deflate', 'deflateRaw', 'gzip' ]

// # Email Template
var EmailTemplate = function(templateDirectory, defaults, done) {

  if (typeof defaults === 'function') done = defaults;

  var that = this;

  this.html = '';
  this.text = '';
  this.stylesheet = '';
  this.bufferType = ''
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

    // Check if `that.bufferType` is not an empty string, so we'll use the global bufferType instead
    if (that.bufferType !== '') {
      isBuffer = true
      bufferType = that.bufferType
    }

    if (typeof html === 'function') {
      callback = html;
      html     = that.html;
    }
    if (!html) html = that.html
    if (!text) text = that.text
    if (!stylesheet) stylesheet = that.stylesheet
    locals = _.defaults(locals, (typeof defaults === 'object') ? defaults : {});
    locals.filename = path.join(templatePath, 'html.ejs');
    html = ejs.render(html, locals);
    locals.filename = path.join(templatePath, 'text.ejs');
    text = (text) ? ejs.render(text, locals) : '';
    if (stylesheet) html = juice(html, stylesheet);

    // return a compressed buffer
    if (isBuffer) {
      async.map([ new Buffer(html), new Buffer(text) ], zlib[bufferType], function(err, buffers) {
        if (err) return callback(err)
        html = buffers[0]
        text = buffers[1]
        callback(null, html, text)
      })
    } else {
      callback(null, html, text)
    }
  };

  // Ensure the `templateDirectory` is undefined
  if (typeof templateDirectory === 'undefined')
    return done(new Error('templateDirectory is undefined'));

  // Ensure the `templateDirectory` is a valid directory path
  fs.stat(templateDirectory, function(err, stats) {

    if (err) return done(new Error(err));

    if (!stats.isDirectory())
      return done(new Error('templateDirectory is not a valid directory path'));

    done(null, function(templateName, locals, bufferType, callback) {

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
          if (isBuffer) that.bufferType = bufferType
          return callback(null, that.render);
        }
        if (isBuffer) {
          that.render(locals, templatePath, null, null, null, bufferType, callback)
        } else {
          that.render(locals, templatePath, null, null, null, callback)
        }
        //that.render(locals, callback);
      };

      // Ensure the `templateName` is valid
      if (templateName === 'undefined') return callback('templateName was not defined');

      // Set the full path to the template
      var templatePath = path.join(templateDirectory, templateName);

      // Ensure the `templateName` is a valid directory path
      fs.stat(templatePath, function(err, stats) {

        if (err) return callback(err);

        if (!stats.isDirectory())
          return callback(templatePath + ' is not a valid directory path');

        // Ensure that at least the html.ejs file exists inside
        that.html = path.join(templatePath, 'html.ejs');
        fs.stat(that.html, function(err, stats) {

          if (err) return callback(err);

          if (!stats.isFile()) return callback(that.html + ' is not a valid file path');

          // Read the html file
          fs.readFile(that.html, 'utf8', function(err, data) {

            if (err) return callback(err);

            if (data === '') return callback(that.html + ' was an empty file');
            else that.html = data;

            // Set asset paths
            that.text = path.join(templatePath, 'text.ejs');
            that.stylesheet = path.join(templatePath, 'style.css');

            async.map([that.text, that.stylesheet], checkExists, function(err, results) {

              if (err) return callback(err);

              if (!results[0]) that.text = false
              if (!results[1]) that.stylesheet = false

              if (that.text && that.stylesheet) {
                async.map([that.text, that.stylesheet], fs.readFile, function(err, results) {
                  if (err) return callback(err);
                  results[0] = results[0].toString('utf8');
                  results[1] = results[1].toString('utf8');
                  if (results[0] === '') that.text = false;
                  if (results[1] === '') that.stylesheet = false;
                  that.text = results[0];
                  that.stylesheet = results[1];
                  batchCheck();
                });
              } else if (that.text && !that.stylesheet) {
                fs.readFile(that.text, 'utf8', function(err, data) {
                  if (err) return callback(err);
                  if (data === '') return callback(that.text + ' was empty');
                  that.text = data;
                  batchCheck();
                });
              } else if (!that.text && that.stylesheet) {
                fs.readFile(that.stylesheet, 'utf8', function(err, data) {
                  if (err) return callback(err);
                  if (data === '') return callback(that.stylesheet + ' was empty');
                  that.stylesheet = data;
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
