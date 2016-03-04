/**
 * Small utility module for compling HTML templates or pre-processed CSS.
 *
 * @author: [@jasonsims]('https://github.com/jasonsims')
 */

import {extname, dirname, basename} from 'path'
import cons from 'consolidate'
import P from 'bluebird'

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

export function render (file, locals = {}, callback) {
  let {filename, content} = file

  return new P(function (resolve, reject) {
    if (!content) return reject('No content in template')
    if (!filename) return reject('Filename is null')
    let engine = extname(filename).slice(1)

    locals.filename = filename
    locals.engine = '.' + engine
    locals.templatePath = dirname(filename)

    if (engine.length && cons[engine] !== undefined) {
      // use consolidate.js if it supports this engine
      return cons[engine].render(content, locals, function (err, rendered) {
        if (err) return reject(err)
        resolve(rendered)
      })
    } else {
      // or use the function defined in the engineMap
      var fn = engineMap[engine]
      return resolve(fn(content, locals))
    }
    return reject(`Can't render file with extension ${engine}`)
  })
  .nodeify(callback)
}

// Deprecated. This engine is deprecated since v2.0
function renderEmblem (source, locals) {
  const emblem = require('emblem')
  const handlebars = require('handlebars')
  console.warn('Please migrate your templates to other engine. Email Templates will stop supporting emblem on the next version')

  var template = emblem.compile(handlebars, source)
  return P.resolve(template(locals))
}

// CSS pre-processors
function renderLess (source, locals) {
  const less = require('less')
  var dir = dirname(locals.filename)
  var base = basename(locals.filename)

  return new P(function (done, reject) {
    less.render(source, {
      paths: [dir],
      filename: base
    }, function (err, output) {
      if (err) return reject(err)
      done(output.css || output)
    })
  })
}

function renderStylus (source, locals) {
  const stylus = require('stylus')

  // Render stylus synchronously as it does not appear to handle asynchronous
  // calls properly when an error is generated.
  const css = stylus.render(source, locals)
  return P.resolve(css)
}

function renderStyl (source, locals) {
  const styl = require('styl')

  const css = styl(source, locals).toString()
  return P.resolve(css)
}

function renderSass (source, locals) {
  const sass = require('node-sass')

  locals.data = source

  if (locals.includePaths) {
    locals.includePaths = locals.includePaths.concat([locals.templatePath])
  } else {
    locals.includePaths = [locals.templatePath]
  }

  return new P(function (done, reject) {
    sass.render(locals, function (err, data) {
      if (err) return reject(err)
      done(data.css.toString())
    })
  })
}
// Default wrapper for handling standard CSS and empty source.
function renderDefault (source) {
  return P.resolve(source)
}
