var path = require('path')
var EmailTemplate = require('../..').EmailTemplate
var _ = require('lodash')
var Handlebars = require('handlebars')

var templateDir = path.resolve(__dirname, '..', 'templates', 'newsletter-hbs')

Handlebars.registerHelper('capitalize', function capitalize (context) {
  return context.toUpperCase()
})

Handlebars.registerPartial('name',
  '{{ capitalize name.first }} {{ capitalize name.last }}'
)

var template = new EmailTemplate(templateDir)
var locals = {
  email: 'mamma.mia@spaghetti.com',
  name: {first: 'Mamma', last: 'Mia'}
}

template.render(locals)
.then(function (results) {
  console.log('One user', results)
})
