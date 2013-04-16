
// # node-email-templates

// Example with [Postmark App][1] (utilizing [Postmark.js][2]
// [1]: http://postmarkapp.com/
// [2]: https://github.com/voodootikigod/postmark.js

// **NOTE**: Did you know `nodemailer` can also be used to send SMTP email through Postmark?
// <https://github.com/andris9/Nodemailer#well-known-services-for-smtp>

// For more message format options, see Postmark's developer documentation section:
// <http://developer.postmarkapp.com/developer-build.html#message-format>

var path           = require('path')
  , templatesDir   = path.resolve(__dirname, '..', 'templates')
  , emailTemplates = require('../../')
  , postmark       = require('postmark')('your-api-key');

emailTemplates(templatesDir, function(err, template) {

  if (err) {
    console.log(err);
  } else {

    // ## Send a single email

    // An example users object with formatted email function
    var locals = {
      email: 'mamma.mia@spaghetti.com',
      name: {
        first: 'Mamma',
        last: 'Mia'
      }
    };

    // Send a single email
    template('newsletter', locals, function(err, html, text) {
      if (err) {
        console.log(err);
      } else {
        postmark.send({
          From: 'Spicy Meatball <spicy.meatball@spaghetti.com>',
          To: locals.email,
          Subject: 'Mangia gli spaghetti con polpette!',
          HtmlBody: html,
          TextBody: text
        }, function(err, response) {
          if (err) {
            console.log(err.status);
            console.log(err.message);
          } else {
            console.log(response);
          }
        });
      }
    });


    // ## Send a batch of emails and only load the template once

    // An example users object
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
    ];

    // Custom function for sending emails outside the loop
    //
    // NOTE:
    //  We need to patch postmark.js module to support the API call
    //  that will let us send a batch of up to 500 messages at once.
    //  (e.g. <https://github.com/diy/trebuchet/blob/master/lib/index.js#L160>)
    var Render = function(locals) {
      this.locals = locals;
      this.send = function(err, html, text) {
        if (err) {
          console.log(err);
        } else {
          postmark.send({
            From: 'Spicy Meatball <spicy.meatball@spaghetti.com>',
            To: locals.email,
            Subject: 'Mangia gli spaghetti con polpette!',
            HtmlBody: html,
            TextBody: text
          }, function(err, response) {
            if (err) {
              console.log(err.status);
              console.log(err.message);
            } else {
              console.log(response);
            }
          });
        }
      };
      this.batch = function(batch) {
        batch(this.locals, templatesDir, this.send);
      };
    };

    // Load the template and send the emails
    template('newsletter', true, function(err, batch) {
      for(var user in users) {
        var render = new Render(users[user]);
        render.batch(batch);
      }
    });

  }
});
