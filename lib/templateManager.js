/**
 * Small utility module for compling HTML templates or pre-processed CSS.
 *
 * @author: [@jasonsims]('https://github.com/jasonsims')
 */

var path       = require('path')
  , ejs        = require('ejs')
  , jade       = require('jade')
  , swig       = require('swig')
  , handlebars = require('handlebars')
  , less       = require('less')
  , sass       = require('node-sass')
  , stylus     = require('stylus')
  , styl       = require('styl')

module.exports = {
  engineMap: {
    // HTML Template engines
    '.jade'       : renderJade,
    '.ejs'        : renderEjs,
    '.swig'       : renderSwig,
    '.hbs'        : renderHandlebars,
    '.handlebars' : renderHandlebars,
    // CSS pre-processors
    '.less'       : renderLess,
    '.stylus'     : renderStylus,
    '.styl'       : renderStyl,
    '.sass'       : renderSass,
    '.scss'       : renderSass,
    // Handle plain CSS also
    '.css'        : renderDefault,
    ''            : renderDefault
  },
  render: function(options, cb) {
    var locals = options.locals
      , source = options.source;

    locals.filename = options.filename;
    locals.engine = path.extname(locals.filename);
    this.engineMap[locals.engine](source, locals, cb)
  }
}

// Wrap all compile functions so every processing engine supports
// execution as .render(source, locals, cb).

// HTML template engines
function renderJade(source, locals, cb) {
  jade.render(source, locals, cb)
}
function renderEjs(source, locals, cb) {
  cb(null, ejs.render(source, locals))
}
function renderSwig(source, locals, cb) {
  cb(null, swig.render(source, {'locals': locals}))
}
function renderHandlebars(source, locals, cb) {
  var template = handlebars.compile(source);
  cb(null, template(locals))
}

// CSS pre-processors
function renderLess(source, locals, cb) {
  var dir = path.dirname(locals.filename);
  var base = path.basename(locals.filename);
  var parser = new(less.Parser)({
    paths: [dir],
    filename: base
  });

  parser.parse(source, function(err, tree) {
    if (err) { return cb(err); }
    cb(null, tree.toCSS());
  });
}
function renderStylus(source, locals, cb) {
  // Render stylus synchronously as it does not appear to handle asynchronous
  // calls properly when an error is generated.
  var css = stylus.render(source, locals)
  cb(null, css)
}
function renderStyl(source, locals, cb) {
  cb(null, styl(source, locals).toString())
}
function renderSass(source, locals, cb) {
  // Result handlers required by sass.
  function errorHandler(err) { cb(err) }
  function successHandler(css) { cb(null, css)}

  locals.data = source
  locals.success = successHandler
  locals.error = errorHandler
  sass.render(locals)
}

// Default wrapper for handling standard CSS and empty source.
function renderDefault(source, locals, cb) {
  cb(null, source)
}
