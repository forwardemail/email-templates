
// # node-email-templates

// ## Example with [Nodemailer](https://github.com/andris9/Nodemailer)

// // **NOTE**: Did you know `nodemailer` can also be used to send SMTP email through Mandrill, Mailgun, Sendgrid and Postmark?
// <https://github.com/andris9/nodemailer-wellknown#supported-services>

var path = require('path')
var EmailTemplate = require('../../').EmailTemplate
var nodemailer = require('nodemailer')
var wellknown = require('nodemailer-wellknown')
var async = require('async')

var templatesDir = path.resolve(__dirname, '..', 'templates')
var template = new EmailTemplate(path.join(templatesDir, 'newsletter'))
// Prepare nodemailer transport object
var transport = nodemailer.createTransport({
  service: 'sendgrid',
  auth: {
    user: 'some-user@gmail.com',
    pass: 'some-password'
  }
})

// An example users object with formatted email function
var locals = {
  email: 'mamma.mia@spaghetti.com',
  name: {
    first: 'Mamma',
    last: 'Mia'
  }
}

// Send a single email
template.render(locals, function (err, results) {
  if (err) {
    return console.error(err)
  }

  transport.sendMail({
    from: 'Spicy Meatball <spicy.meatball@spaghetti.com>',
    to: locals.email,
    subject: 'Mangia gli spaghetti con polpette!',
    html: results.html,
    text: results.text
  }, function (err, responseStatus) {
    if (err) {
      return console.error(err)
    }
    console.log(responseStatus.message)
  })
})

// ## Send a batch of emails and only load the template once

var users = [
  {
    email: 'pappa.pizza@spaghetti.com',
    name: {
      first: 'Pappa',
      last: 'Pizza'
    }
  },
  {
    email: 'mister.geppetto@spaghetti.com',
    name: {
      first: 'Mister',
      last: 'Geppetto'
    }
  }
]

// Send 10 mails at once
async.mapLimit(users, 10, function (item, next) {
  template.render(item, function (err, results) {
    if (err) return next(err)
    transport.sendMail({
      from: 'Spicy Meatball <spicy.meatball@spaghetti.com>',
      to: item.email,
      subject: 'Mangia gli spaghetti con polpette!',
      html: results.html,
      text: results.text
    }, function (err, responseStatus) {
      if (err) {
        return next(err)
      }
      next(null, responseStatus.message)
    })
  })
}, function (err) {
  if (err) {
    console.error(err)
  }
  console.log('Succesfully sent %d messages', users.length)
})
