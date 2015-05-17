/**
 * Small utility module for compling HTML templates or pre-processed CSS.
 *
 * @author: [@jasonsims]('https://github.com/jasonsims')
 */

var path = require('path')
var cons = require('consolidate')
var P = require('bluebird')

var engineMap = {
  // HTML Template engines
  'jade': cons.jade.render,
  'ejs': cons.ejs.render,
  'swig': cons.swig.render,
  'hbs': cons.handlebars.render,
  'handlebars': cons.handlebars.render,
  'emblem': renderEmblem,
  'dust': cons.dust.render,
  // CSS pre-processors
  'less': renderLess,
  'stylus': renderStylus,
  'styl': renderStyl,
  'sass': renderSass,
  'scss': renderSass,
  // Handle plain CSS also
  'css': renderDefault,
  '': renderDefault
}

exports.render = function templateManager (filename, source, locals, callback) {
  if (!source) return null

  var engine = path.extname(filename).slice(1)
  locals.filename = filename
  locals.engine = '.' + engine

  return new P(function (resolve, reject) {
    engineMap[engine](source, locals, function (err, rendered) {
      if (err) return reject(err)
      resolve(rendered)
    })
  })
  .nodeify(callback)
}

function renderEmblem (source, locals, cb) {
  var emblem = require('emblem')
  var handlebars = require('handlebars')

  var template = emblem.compile(handlebars, source)
  cb(null, template(locals))
}

// CSS pre-processors
function renderLess (source, locals, cb) {
  var less = require('less')
  var dir = path.dirname(locals.filename)
  var base = path.basename(locals.filename)

  less.render(source, {
    paths: [dir],
    filename: base
  }, function (err, output) {
    if (err) { return cb(err) }
    cb(null, output.css || output)
  })
}

function renderStylus (source, locals, cb) {
  var stylus = require('stylus')

  // Render stylus synchronously as it does not appear to handle asynchronous
  // calls properly when an error is generated.
  var css = stylus.render(source, locals)
  cb(null, css)
}

function renderStyl (source, locals, cb) {
  var styl = require('styl')

  cb(null, styl(source, locals).toString())
}

function renderSass (source, locals, cb) {
  var sass = require('node-sass')

  // Result handlers required by sass.
  function errorHandler (err) { cb(err) }
  function successHandler (data) { cb(null, data.css)}

  locals.data = source
  locals.includePaths = [locals.templatePath]
  locals.success = successHandler
  locals.error = errorHandler
  sass.render(locals)
}

// Default wrapper for handling standard CSS and empty source.
function renderDefault (source, locals, cb) {
  cb(null, source)
}