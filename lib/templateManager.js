/**
 * Small utility module for compling HTML templates or pre-processed CSS.
 *
 * @author: [@jasonsims]('https://github.com/jasonsims')
 */

var path       = require('path')

module.exports = {
  engineMap: {
    // HTML Template engines
    '.jade'       : renderJade,
    '.ejs'        : renderEjs,
    '.swig'       : renderSwig,
    '.hbs'        : renderHandlebars,
    '.handlebars' : renderHandlebars,
    '.emblem'     : renderEmblem,
    '.dust'       : renderDust,
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
  var jade = require('jade')
  jade.render(source, locals, cb)
}
function renderEjs(source, locals, cb) {
  var ejs = require('ejs')
  cb(null, ejs.render(source, locals))
}
function renderSwig(source, locals, cb) {
  var swig = require('swig')
  cb(null, swig.render(source, {'locals': locals}))
}
function renderHandlebars(source, locals, cb) {
  var handlebars = require('handlebars')
  var template = handlebars.compile(source);
  cb(null, template(locals))
}
function renderEmblem(source, locals, cb) {
  var emblem = require('emblem')
    , handlebars = require('handlebars')

  var template = emblem.compile(handlebars, source)
  cb(null, template(locals))
}
function renderDust(source, locals, cb) {
  var dust = require('dustjs-linkedin')
  dust.loadSource(dust.compile(source, 'tmp'));
  dust.render('tmp', locals, cb);
}

// CSS pre-processors
function renderLess(source, locals, cb) {
  var less = require('less')
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
  var stylus = require('stylus')

  // Render stylus synchronously as it does not appear to handle asynchronous
  // calls properly when an error is generated.
  var css = stylus.render(source, locals)
  cb(null, css)
}
function renderStyl(source, locals, cb) {
  var styl = require('styl')

  cb(null, styl(source, locals).toString())
}
function renderSass(source, locals, cb) {
  var sass = require('node-sass')

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
