
# Node Email Templates

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![NPM downloads][npm-downloads]][npm-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Static Analysis][codeclimate-image]][codeclimate-url]
[![MIT License][license-image]][license-url]
[![Gitter][gitter-image]][gitter-url]

Node.js NPM package for rendering beautiful emails with your template engine and CSS pre-processor of choice coupled with email-friendly inline CSS using [juice][juice].

> Enjoy this package?  Check out [eskimo][eskimo] and [express-cdn][express-cdn], and follow [@niftylettuce](http://twitter.com/niftylettuce)!


## Index

* [Email Templates](#email-templates)
* [Installation](#installation)
* [Quick Start](#quick-start)
* [EJS Custom Tags](#ejs-custom-tags)
* [Examples](#examples)
    * [Basic](#basic)
    * [Nodemailer](#nodemailer)
    * [Postmark](#postmark)
* [Changelog](#changelog)
* [Contributors](#contributors)
* [License](#license)


## Email Templates

For customizable, pre-built email templates, see [Email Blueprints][email-blueprints] and [Transactional Email Templates][transactional-email-templates].

#### Supported Template Engines

* [ejs][ejs]
* [jade][jade]
* [swig][swig]
* [handlebars][handlebars]
* [emblem][emblem]
* [dust-linkedin][dust-linkedin]

#### Supported CSS Pre-processors

* [less][less]
* [sass][sass]
* [stylus][stylus]
* [styl][styl]


## Prerequisites

This module depends on [jsdom](https://github.com/tmpvar/jsdom) which requires the ability to compile C++ on your localhost. Before installing, please verify that you have the prerequisites installed for your OS.

* [OSX requirements](https://github.com/tmpvar/jsdom#mac)
* [Linux requirements](https://github.com/tmpvar/jsdom#linux)

#### Important Note for Windows Users

Developing on OS X or Ubuntu/Linux is recommended, but if you only have access to a Windows machine you can do one of the following:

* Use [vagrant](http://www.vagrantup.com/) to create a linux dev environment (recommended)
* Follow the [Windows installation guide](https://github.com/brianmcd/contextify/wiki/Windows-Installation-Guide) for contextify


## Installation

```bash
npm install -S email-templates
```

> Starting with version `1.1.1` you must install the engines you wish to use by adding them to your `package.json` dependencies.

```bash
npm install -S [ejs|jade|swig|handlebars|emblem|dust-linkedin]
```


## Quick Start

1. Install the module for your respective project:

    ```bash
    npm install -S email-templates
    ```

2. Install the template engine you intend to use:
    - `ejs@^1.0.0`
    - `jade@^1.3.1`
    - `swig@^1.3.2`
    - `handlebars@^1.3.0`
    - `emblem@~0.3.16`
    - `dust-linkedin@^2.4.0`

    - `less@^1.7.0`
    - `stylus@^^0.45.1`
    - `styl@^0.2.7`
    - `node-sass@^0.9.3`

    ```bash
    npm install -S <engine>
    ```

3. Create a folder called `templates` inside your root directory (or elsewhere).

    ```bash
    mkdir templates
    ```

4. For each of your email templates (e.g. a welcome email to send to users when they register on your site), respectively name and create a folder inside the `templates` folder.

    ```bash
    mkdir templates/welcome-email
    ```

5. Add the following files inside the template's folder:
    * `html.{{ext}}` (**required**)
    * `text.{{ext}}` (**optional**)
    * `style.{{ext}}`(**optional**)

    > **See [supported template engines](#supported-template-engines) for possible template engine extensions (e.g. `.ejs`, `.jade`, `.swig`) to use for the value of `{{ext}}` above.**

    > You may prefix any file name with anything you like to help you identify the files more easily in your IDE.  The only requirement is that the filename contains `html.`, `text.`, and `style.` respectively.

6. You may use the `include` directive from [ejs][ejs] (for example, to include a common header or footer).  See the `/examples` folder for details.

7. Utilize one of the examples below for your respective email module and start sending beautiful emails!


## Template Engine Options

If your want to configure your template engine, just pass options.

Want to use different opening and closing tags instead of the EJS's default `<%` and `%>`?.

```js
// ...
emailTemplates(templatesDir, { open: '{{', close: '}}' }, function(err, template) {
// ...
```

> You can also pass <a href="https://github.com/visionmedia/ejs#options" target="_blank">other options from EJS's documentation</a>.

Want to add a helper or partial to Handlebars?

```js
// ...
emailTemplates(templatesDir, {
  helpers: {
    uppercase: function(context) {
      return context.toUpperCase()
    }
  }, partials: {
    // ...
  }
})
// ...
```


## Examples

### Basic

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
      batch(this.locals, templatesDir, this.send);
    };
  };

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

  template('pasta-dinner', true, function(err, batch) {
    for(var user in users) {
      var render = new Render(users[user]);
      render.batch(batch);
    }
  });

});
```

### [Nodemailer][nodemailer]

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
```

### [Postmark][postmark]

This example utilizes [Postmark.js][postmarkjs].

> Did you know `nodemailer` can also be used to send SMTP email through Postmark? See [this section][nodemailer-smtp] of their Readme for more info.

For more message format options, see [this section][postmark-msg-format] of Postmark's developer documentation section.

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
        batch(this.locals, templatesDir, this.send);
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


## Conventions

See [nifty-conventions][nifty-conventions] for code guidelines, general project requirements, and git workflow.


## Contributors

* Nick Baugh <niftylettuce@gmail.com>
* Andrea Baccega <vekexasia@gmail.com>
* Nic Jansma <http://nicj.net>
* Jason Sims <sims.jrobert@gmail.com>
* Miguel Mota <hello@miguelmota.com>
* Jeduan Cornejo <jeduan@gmail.com>

> Full list of contributors can be found on the [GitHub Contributor Graph][gh-graph]


## License

[MIT][license-url]


[ejs]: https://github.com/visionmedia/ejs
[juice]: https://github.com/Automattic/juice
[nodemailer]: https://github.com/andris9/Nodemailer
[postmark]: http://postmarkapp.com/
[postmarkjs]: https://github.com/voodootikigod/postmark.js
[nodemailer-smtp]: https://github.com/andris9/Nodemailer#well-known-services-for-smtp
[postmark-msg-format]: http://developer.postmarkapp.com/developer-build.html#message-format
[jade]: https://github.com/visionmedia/jade
[swig]: https://github.com/paularmstrong/swig
[handlebars]: https://github.com/wycats/handlebars.js
[emblem]: https://github.com/machty/emblem.js
[dust-linkedin]: https://github.com/linkedin/dustjs
[less]: http://lesscss.org/
[sass]: http://sass-lang.com/
[stylus]: http://learnboost.github.io/stylus/
[styl]: https://github.com/visionmedia/styl
[express-cdn]: https://github.com/niftylettuce/express-cdn
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE
[gh-graph]: https://github.com/niftylettuce/node-email-templates/graphs/contributors
[npm-image]: http://img.shields.io/npm/v/email-templates.svg?style=flat
[npm-url]: https://npmjs.org/package/email-templates
[npm-downloads]: http://img.shields.io/npm/dm/email-templates.svg?style=flat
[travis-url]: http://travis-ci.org/niftylettuce/node-email-templates
[travis-image]: http://img.shields.io/travis/niftylettuce/node-email-templates.svg?style=flat
[codeclimate-image]: http://img.shields.io/codeclimate/github/niftylettuce/node-email-templates.svg?style=flat
[codeclimate-url]: https://codeclimate.com/github/niftylettuce/node-email-templates?branch=master
[coveralls-image]: https://img.shields.io/coveralls/niftylettuce/node-email-templates.svg?style=flat
[coveralls-url]: https://coveralls.io/r/niftylettuce/node-email-templates?branch=master
[gitter-url]: https://gitter.im/niftylettuce/node-email-templates
[gitter-image]: http://img.shields.io/badge/chat-online-brightgreen.svg?style=flat
[eskimo]: http://eskimo.io
[nifty-conventions]: https://github.com/niftylettuce/nifty-conventions
[email-blueprints]: https://github.com/mailchimp/Email-Blueprints
[transactional-email-templates]: https://github.com/mailgun/transactional-email-templates
