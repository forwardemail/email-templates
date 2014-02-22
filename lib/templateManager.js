/** 
 * Small utility module for compling HTML templates or pre-processed CSS.
 * 
 * @author: [@jasonsims]('https://github.com/jasonsims') 
 */

var ejs        = require('ejs')
  , jade       = require('jade')
  , swig       = require('swig')
  , handlebars = require('handlebars')

module.exports = function(engine) {
  this.engine = engine
  this.engineMap = {
    // HTML Template engines.
    '.jade'       : { render: jade.render },
    '.ejs'        : { render: ejs.render },
    '.swig'       : { render: renderSwig },
    '.hbs'        : { render: renderHandlebars },
    '.handlebars' : { render: renderHandlebars }
  }
  
  // Wrap all compile functions so every processing engine supports
  //  execution as .render(source, locals).
  function renderSwig(source, locals) {
    return swig.render(source, {'locals': locals})
  }

  function renderHandlebars(source, locals) {
    var template = handlebars.compile(source);
    return template(locals);
  }
  
  return this.engineMap[this.engine];
};
