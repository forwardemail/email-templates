
// # node-email-templates

// Example with [Postmark App][1] (utilizing [Postmark.js][2]
// [1]: http://postmarkapp.com/
// [2]: https://github.com/voodootikigod/postmark.js

// **NOTE**: Did you know `nodemailer` can also be used to send SMTP email through Postmark?
// <https://github.com/andris9/nodemailer-wellknown#supported-services>

// For more message format options, see Postmark's developer documentation section:
// <http://developer.postmarkapp.com/developer-build.html#message-format>

var path = require('path')
var EmailTemplate = require('../../').EmailTemplate
var postmark = require('postmark')
var _ = require('lodash')

var templatesDir = path.resolve(__dirname, '..', 'templates')
var client = new postmark.Client('your-server-key')

var locals = {
  email: 'mamma.mia@spaghetti.com',
  name: {
    first: 'Mamma',
    last: 'Mia'
  }
}

var template = new EmailTemplate(path.join(templatesDir, 'newsletter'))

// Send a single email
template.render(locals, function (err, results) {
  if (err) {
    return console.error(err)
  }
  client.sendEmail({
    From: 'Spicy Meatball <spicy.meatball@spaghetti.com>',
    To: locals.email,
    Subject: 'Mangia gli spaghetti con polpette!',
    HtmlBody: results.html,
    TextBody: results.text
  }, function (err, response) {
    if (err) {
      console.error(err.status)
      console.error(err.message)
      return
    }
    console.log(response)
  })
})

// Send a batch of emails and only load the template once
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

// use promises this time. Use your favorite library such as bluebird
// or use the native Promise included in node > 0.12 and io.js
Promise.all(_.map(users, function (user) {
  return template.render(user)
    .then(function (results) {
      return {
        From: 'Spicy Meatball <spicy.meatball@spaghetti.com>',
        To: user.email,
        Subject: 'Mangia gli spaghetti con polpette!',
        HtmlBody: results.html,
        TextBody: results.text
      }
    })
}))
.then(function (messages) {
  client.sendEmailBatch(messages, function (err, batchResults) {
    // Throwing inside a promise will just reject the promise
    // not stop your server
    if (err) throw err

    console.info('Messages sent to postmark')
  })
})
