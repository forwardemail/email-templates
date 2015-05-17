/**
 * Small utility module for compling HTML templates or pre-processed CSS.
 *
 * @author: [@jasonsims]('https://github.com/jasonsims')
 */

import {extname, dirname, basename} from 'path'
import cons from 'consolidate'
import P from 'bluebird'
import {isFunction} from 'lodash'

var engineMap = {
  // HTML Template engines
  'hbs': cons.handlebars.render,
  'emblem': renderEmblem,
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

  var engine = extname(filename).slice(1)
  locals.filename = filename
  locals.engine = '.' + engine

  return new P(function (resolve, reject) {
    var fn
    if (engine.length && cons[engine] !== undefined) {
      fn = cons[engine].render
    } else {
      fn = engineMap[engine]
    }
    if (!isFunction(fn)) return reject(`Can't render file with extension ${engine}`)
    fn(source, locals, function (err, rendered) {
      if (err) return reject(err)
      resolve(rendered)
    })
  })
  .nodeify(callback)
}

// Deprecated. This engine is deprecated since v2.0
function renderEmblem (source, locals, cb) {
  const emblem = require('emblem')
  const handlebars = require('handlebars')

  var template = emblem.compile(handlebars, source)
  cb(null, template(locals))
}

// CSS pre-processors
function renderLess (source, locals, cb) {
  const less = require('less')
  var dir = dirname(locals.filename)
  var base = basename(locals.filename)

  less.render(source, {
    paths: [dir],
    filename: base
  }, function (err, output) {
    if (err) { return cb(err) }
    cb(null, output.css || output)
  })
}

function renderStylus (source, locals, cb) {
  const stylus = require('stylus')

  // Render stylus synchronously as it does not appear to handle asynchronous
  // calls properly when an error is generated.
  var css = stylus.render(source, locals)
  cb(null, css)
}

function renderStyl (source, locals, cb) {
  const styl = require('styl')

  cb(null, styl(source, locals).toString())
}

function renderSass (source, locals, cb) {
  const sass = require('node-sass')

  locals.data = source
  locals.includePaths = [locals.templatePath]

  sass.render(locals, function (err, data) {
    cb(err, data.css.toString())
  })
}

// Default wrapper for handling standard CSS and empty source.
function renderDefault (source, locals, cb) {
  cb(null, source)
}
