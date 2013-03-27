

# node-email-templates <sup>0.0.9</sup>

Node.js module for rendering beautiful emails with [ejs][1] templates and email-friendly inline CSS using [juice][2].

**UPDATE**: [Teelaunch](https://github.com/teelaunch) plans to rewrite this module, subscribe to their [email newsletter](http://goo.gl/j0ypI) for special updates.

**v0.0.9**:
* Fixed `juice` dependency issue

**v0.0.7**:
* Added support for ejs's `include` directive thanks to @nicjansma

**v0.0.6**:
* Fixed batch problem (`...has no method slice`) thanks to @vekexasia

**v0.0.5**:
* Added support for an optional [zlib][8] compression type (e.g. you can return compressed html/text buffer for db storage)

```bash
...
template('newsletter', locals, 'deflateRaw', function(err, html, text) {
  // The `html` and `text` are buffers compressed using zlib.deflateRaw
  // <http://nodejs.org/docs/latest/api/zlib.html#zlib_zlib_deflateraw_buf_callback>
  // **NOTE**: You could also pass 'deflate' or 'gzip' if necessary, and it works with batch rendering as well
})
...
```

**v0.0.4 (with bug fix for 0.0.3)**:
* Removed requirement for `style.css` and `text.ejs` files with compatibility in `node` v0.6.x to v0.8.x (utilizes `path.exists` vs. `fs.exists` respectively).

## Email Templates

For professional and customizable email templates, please visit <https://github.com/mailchimp/Email-Blueprints>.



## Installation

### Unix/OS X

```bash
npm install email-templates
```

### Windows

```bash
npm install email-templates-windows
```


## Quick start

1. Install the module for your respective project `npm install email-templates`.
2. Create a folder called `templates` inside your root directory (or elsewhere).
3. For each of your templates, respectively name and create a folder inside the `templates` folder.
4. Add the following files inside the template's folder:
    * `html.ejs` - html + [ejs][1] version of your email template (**required**)
    * `text.ejs` - text + [ejs][1] version of your email template (**optional**)
    * `style.css` - stylesheet for the template, which will render `html.ejs` with inline CSS (**optional**)
5. You may use the `include` directive from ejs (for example, to include a common header or footer).  See the `/examples` folder for details.
6. Utilize one of the examples below for your respective email module and start sending beautiful emails!


# EJS Custom Tags

Want to use different opening and closing tags instead of the EJS's default `<%` and `%>`?.

```js
...
emailTemplates(templatesDir, { open: '{{', close: '}}' }, function(err, template) {
...
```

**NOTE**: You can also pass <a href="https://github.com/visionmedia/ejs#options" target="_blank">other options from EJS's documentation</a>.

# Usage

Render a template for a single email or render multiple (having only loaded the template once).

```js
var path           = require('path')
  , templatesDir   = path.join(__dirname, 'templates')
  , emailTemplates = require('email-templates');

emailTemplates(templatesDir, function(err, template) {

  // Render a single email with one template
  var locals = { pasta: 'Spaghetti' };
  template('pasta-dinner', locals, function(err, html, text) {
    // ...
  });

  // Render multiple emails with one template
  var locals = [
    { pasta: 'Spaghetti' },
    { pasta: 'Rigatoni' }
  ];
  var Render = function(locals) {
    this.locals = locals;
    this.send = function(err, html, text) {
      // ...
    };
    this.batch = function(batch) {
      batch(this.locals, this.send);
    };
  };
  template('pasta-dinner', true, function(err, batch) {
    for(var user in users) {
      var render = new Render(users[user]);
      render.batch(batch);
    }
  });

});
```



## Example with [Nodemailer][3]

```js
var path           = require('path')
  , templatesDir   = path.resolve(__dirname, '..', 'templates')
  , emailTemplates = require('email-templates')
  , nodemailer     = require('nodemailer');

emailTemplates(templatesDir, function(err, template) {

  if (err) {
    console.log(err);
  } else {

    // ## Send a single email

    // Prepare nodemailer transport object
    var transport = nodemailer.createTransport("SMTP", {
      service: "Gmail",
      auth: {
        user: "some-user@gmail.com",
        pass: "some-password"
      }
    });

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
        transport.sendMail({
          from: 'Spicy Meatball <spicy.meatball@spaghetti.com>',
          to: locals.email,
          subject: 'Mangia gli spaghetti con polpette!',
          html: html,
          // generateTextFromHTML: true,
          text: text
        }, function(err, responseStatus) {
          if (err) {
            console.log(err);
          } else {
            console.log(responseStatus.message);
          }
        });
      }
    });


    // ## Send a batch of emails and only load the template once

    // Prepare nodemailer transport object
    var transportBatch = nodemailer.createTransport("SMTP", {
      service: "Gmail",
      auth: {
        user: "some-user@gmail.com",
        pass: "some-password"
      }
    });

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
          transportBatch.sendMail({
            from: 'Spicy Meatball <spicy.meatball@spaghetti.com>',
            to: locals.email,
            subject: 'Mangia gli spaghetti con polpette!',
            html: html,
            // generateTextFromHTML: true,
            text: text
          }, function(err, responseStatus) {
            if (err) {
              console.log(err);
            } else {
              console.log(responseStatus.message);
            }
          });
        }
      };
      this.batch = function(batch) {
        batch(this.locals, this.send);
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
```



## Example with [Postmark App][4] (utilizing [Postmark.js][5])

**NOTE**: Did you know `nodemailer` can also be used to send SMTP email through Postmark? See [this section][6] of their Readme for more info.

For more message format options, see [this section][7] of Postmark's developer documentation section.

```js
var path           = require('path')
  , templatesDir   = path.resolve(__dirname, '..', 'templates')
  , emailTemplates = require('email-templates')
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
        batch(this.locals, this.send);
      };
    };

    // Load the template and send the emails
    template('newsletter', true, function(err, batch) {
      for(user in users) {
        var render = new Render(users[user]);
        render.batch(batch);
      }
    });

  }
});
```



## Contributors

* Nick Baugh <niftylettuce@gmail.com>
* Andrea Baccega <vekexasia@gmail.com>
* Nic Jansma (http://nicj.net)


## License

MIT Licensed



[1]: https://github.com/visionmedia/ejs
[2]: https://github.com/LearnBoost/juice
[3]: https://github.com/andris9/Nodemailer
[4]: http://postmarkapp.com/
[5]: https://github.com/voodootikigod/postmark.js
[6]: https://github.com/andris9/Nodemailer#well-known-services-for-smtp
[7]: http://developer.postmarkapp.com/developer-build.html#message-format
[8]: http://nodejs.org/docs/latest/api/zlib.html
