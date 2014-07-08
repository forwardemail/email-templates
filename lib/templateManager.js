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
  , emblem     = require('emblem')
  , dust       = require('dustjs-linkedin')
  , less       = require('less')
  , sass       = require('node-sass')
  , stylus     = require('stylus')
  , styl       = require('styl')
  , async      = require('async')
  , fs         = require('fs')
  , _          = require('underscore')

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
function renderEmblem(source, locals, cb) {
  var template = emblem.compile(handlebars, source)
  cb(null, template(locals))
}
function renderDust(source, locals, cb) {
  var baseName = path.join(path.basename(path.dirname(locals.filename)), 
                           path.basename(locals.filename, '.dust'));
  if (!dust.cache[baseName]) {
    // Recursive compile
    dustReadPartial({source: source, file: locals.filename, name: baseName}, function() {
      dust.render(baseName, locals, cb);
    });
  } else {
    // Already compiled
    dust.render(baseName, locals, cb);
  }

  // Compile and find partials
  function dustReadPartial(file, cb) {
    if (!file.source) {
      fs.readFile(file.file, { encoding: 'utf-8' }, function(err, source) {
        file.source = source;
        dustPartial(file, cb);
      });
    } else {
      dustPartial(file, cb);
    }
  }

  function dustPartial(file, cb) {
    var sources = [];
    var dir = path.dirname(file.file);
    // Match partial include (e.g. {>"../layout"/} or {>layout/})
    var partial_re = new RegExp(/\{\>['"]?(.*?)['"]?\/\}/g);
    var match;
    while (match = partial_re.exec(file.source)) {
      sources.push({
        file: path.join(dir, match[1] + '.dust'),
        name: match[1]
      });
    }
    async.map(sources, dustReadPartial, function() {
      if (!dust.cache[file.name]) {
        var c = dust.compile(file.source, file.name);
        dust.loadSource(c);
      }
      cb();
    });
  }
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
