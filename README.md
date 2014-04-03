# node-email-templates [![Build Status](https://travis-ci.org/niftylettuce/node-email-templates.png?branch=master)](https://travis-ci.org/niftylettuce/node-email-templates) [![NPM version](https://badge.fury.io/js/email-templates.png)](http://badge.fury.io/js/email-templates-windows) [![Gittip](http://img.shields.io/gittip/niftylettuce.png)](https://www.gittip.com/niftylettuce/)

Node.js module for rendering beautiful emails with your template engine and CSS pre-processor of choice coupled with email-friendly inline CSS using [juice][2].

[jade]: https://github.com/visionmedia/jade
[swig]: https://github.com/paularmstrong/swig
[handlebars]: https://github.com/wycats/handlebars.js
[less]: http://lesscss.org/
[sass]: http://sass-lang.com/
[stylus]: http://learnboost.github.io/stylus/
[styl]: https://github.com/visionmedia/styl

View documentation here <http://documentup.com/niftylettuce/node-email-templates>.

Follow [@niftylettuce](http://twitter.com/niftylettuce) on Twitter for updates.

Like this module?  Check out [express-cdn](https://github.com/niftylettuce/express-cdn)!

<table>
<thead>
<tr>
<th>The Rebel's Guide to Email Marketing</th>
<th>Modern HTML Email</th>
<th>Email Marketing By the Numbers</th>
</tr>
</thead>
<tbody>
<tr>
<td><a href="http://goo.gl/JplO3b"><img src="http://ecx.images-amazon.com/images/I/51pDPeVKqqL._SL110_.jpg" /></a></td>
<td><a href="http://goo.gl/nKk41m"><img src="http://ecx.images-amazon.com/images/I/41uTBv9KbhL._SL110_.jpg" /></a></td>
<td><a href="http://goo.gl/d1b82E"><img src="http://ecx.images-amazon.com/images/I/51RX-csFsRL._SL110_.jpg" /></a></td>
</tr>
</tbody>
</table>

## Index

* [Email Templates](#email-templates)
* [Installation](#installation)
* [Quick Start](#quick-start)
* [EJS Custom Tags](#ejs-custom-tags)
* [Examples](#examples)
    * [Basic](#basic)
    * [Nodemailer](#nodemailer)
    * [Postmark](#postmark)
* [Lazyweb Requests](#lazyweb-requests)
* [Changelog](#changelog)
* [Contributors](#contributors)
* [License](#license)


## Email Templates

For professional and customizable email templates, please visit <https://github.com/mailchimp/Email-Blueprints>.

#### Supported Template Engines
 * [ejs][1]
 * [jade][jade]
 * [swig][swig]
 * [handlebars][handlebars]

#### Supported CSS Pre-processors
 * [less][less]
 * [sass][sass]
 * [stylus][stylus]
 * [styl][styl]

## Prerequisites
This module depends on [jsdom](https://github.com/tmpvar/jsdom) which requires the ability to compile C++ on your localhost. Before installing, please verify that you have the prerequisites installed for your OS.
 * [OSX requirements](https://github.com/tmpvar/jsdom#mac)
 * [Linux requirements](https://github.com/tmpvar/jsdom#linux)

#### Windows Users
Developing on osx/linux is recommended but if you only have access to a Windows machine you can either:
  1. Use [vagrant](http://www.vagrantup.com/) to create a linux dev environment (recommended)
  2. Follow the [Windows installation guide](https://github.com/brianmcd/contextify/wiki/Windows-Installation-Guide) for contextify

## Installation
```bash
npm install email-templates
```

## Quick Start

1. Install the module for your respective project `npm install email-templates`.
2. Create a folder called `templates` inside your root directory (or elsewhere).
3. For each of your templates, respectively name and create a folder inside the `templates` folder.
4. Add the following files inside the template's folder:
    * `html.{{template engine}}` - See [supported template engines](#supported-template-engines) (**required**)
    * `text.{{template engine}}` - See [supported template engines](#supported-template-engines) (**optional**)
    * `style.{{CSS pre-processor}}` - See [supported CSS pre-processors](#supported-css-pre-processors) (**optional**)
5. You may use the `include` directive from ejs (for example, to include a common header or footer).  See the `/examples` folder for details.
6. Utilize one of the examples below for your respective email module and start sending beautiful emails!


## Templating Language Options (e.g. EJS Custom Tags)

Want to use different opening and closing tags instead of the EJS's default `<%` and `%>`?.

```js
...
emailTemplates(templatesDir, { open: '{{', close: '}}' }, function(err, template) {
...
```

**NOTE**: You can also pass <a href="https://github.com/visionmedia/ejs#options" target="_blank">other options from EJS's documentation</a>.


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

### [Nodemailer][3]

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

### [Postmark][4]

This example utilizes [Postmark.js][5].

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

## Lazyweb Requests
These are feature requests that we would appreciate contributors for:

* Rewrite this module to have a more modular API (e.g. template caching and email queue support via kue)
* Merge with @superjoe30 swig email templates fork
* Add parsing of HTML with CSS inlining and HTML linting

## Contributors
* Nick Baugh <niftylettuce@gmail.com>
* Andrea Baccega <vekexasia@gmail.com>
* Nic Jansma (http://nicj.net)
* Jason Sims <sims.jrobert@gmail.com>
* Miguel Mota <hello@miguelmota.com>  

[Full Contributors List](https://github.com/niftylettuce/node-email-templates/graphs/contributors)

## License

The MIT License

Copyright (c) 2012- Nick Baugh <niftylettuce@gmail.com> (http://niftylettuce.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


[1]: https://github.com/visionmedia/ejs
[2]: https://github.com/LearnBoost/juice
[3]: https://github.com/andris9/Nodemailer
[4]: http://postmarkapp.com/
[5]: https://github.com/voodootikigod/postmark.js
[6]: https://github.com/andris9/Nodemailer#well-known-services-for-smtp
[7]: http://developer.postmarkapp.com/developer-build.html#message-format
[8]: http://nodejs.org/docs/latest/api/zlib.html
