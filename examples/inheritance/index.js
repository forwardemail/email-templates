var path = require('path')
var EmailTemplate = require('../..').EmailTemplate
var _ = require('lodash')

var templateDir = path.resolve(__dirname, '..', 'templates', 'newsletter')
var template = new EmailTemplate(templateDir)
var locals = {
  email: 'mamma.mia@spaghetti.com',
  name: {
    first: 'Mamma',
    last: 'Mia'
  }
}

// Send a single email
template.render(locals)
.then(function (results) {
  console.log('One user', results)
})
