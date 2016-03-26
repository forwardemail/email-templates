
# Node Email Templates

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![NPM downloads][npm-downloads]][npm-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Static Analysis][codeclimate-image]][codeclimate-url]
[![MIT License][license-image]][license-url]
[![Gitter][gitter-image]][gitter-url]
[![js-standard-style][standard-image]][standard-url]

Node.js NPM package for rendering beautiful emails with your template engine and CSS pre-processor of choice coupled with email-friendly inline CSS using [juice][juice].

> Enjoy this package?  Check out [eskimo][eskimo] and [express-cdn][express-cdn], and follow [@niftylettuce](http://twitter.com/niftylettuce)!


## Index

* [Email Templates](#email-templates)
* [Installation](#installation)
* [Quick Start](#quick-start)
* [EJS Custom Tags](#ejs-custom-tags)
* [Examples](#examples)
    * [Basic](#basic)
* [Changelog](#changelog)
* [Contributors](#contributors)
* [License](#license)


## Email Templates

For customizable, pre-built email templates, see [Email Blueprints][email-blueprints] and [Transactional Email Templates][transactional-email-templates].

#### Supported Template Engines

node-email-templates uses [consolidate.js][consolidate], and therefore supports a vast array of template modules. Please see [consolidate.js][consolidate] for the impressive full list.

#### Supported CSS Pre-processors

* [less][less]
* [sass][sass]
* [stylus][stylus]
* [styl][styl]


## Prerequisites

#### Important Note for Windows Users

Developing on OS X or Ubuntu/Linux is recommended, but if you only have access to a Windows machine you can do one of the following:

* Use [vagrant](http://www.vagrantup.com/) to create a linux dev environment (recommended)
* Follow the [Windows installation guide](https://github.com/brianmcd/contextify/wiki/Windows-Installation-Guide) for contextify


## Installation

Install `email-templates` and the engines you wish to use by adding them to your `package.json` dependencies.

```bash
npm install --save email-templates
# See https://www.npmjs.com/package/consolidate for a full list of available template engines
npm install -S [ejs|jade|nunjucks|handlebars|emblem|dust-linkedin] 
```


## Quick Start

1. Install the module for your respective project:

    ```bash
    npm install --save email-templates@2
    ```

2. Install the template engine you intend to use:

    - `ejs@^2.0.0`
    - `jade@^1.0.0`
    - `nunjucks@^1.0.0`
    - `handlebars@^3.0.0`
    - `dust-linkedin@^2.0.0`
    - `less@^2.0.0`
    - `stylus@^0.51.0`
    - `styl@^0.2.0`
    - `node-sass@^3.0.0`
    
    - See https://www.npmjs.com/package/consolidate for a full list

    ```bash
    npm install --save <engine>
    ```

3. For each of your email templates (e.g. a welcome email to send to users when they register on your site), respectively name and create a folder.

    ```bash
    mkdir templates/welcome-email
    ```

4. Add the following files inside the template's folder:
    * `html.{{ext}}` (**required**) - for html format of email
    * `text.{{ext}}` (**optional**) - for text format of email
    * `style.{{ext}}`(**optional**) - styles for html format
    * `subject.{{ext}}`(**optional**) - for subject of email

    > **See [supported template engines](#supported-template-engines) for possible template engine extensions (e.g. `.ejs`, `.jade`, `.nunjucks`) to use for the value of `{{ext}}` above.**

    > You may prefix any file name with anything you like to help you identify the files more easily in your IDE.  The only requirement is that the filename contains `html.`, `text.`, `style.`, and `subject.` respectively.

5. You may use the `include` directive from [ejs][ejs] (for example, to include a common header or footer).  See the `/examples` folder for details.


## Template Engine Options

If you want to configure your template engine, just pass options.

Want to use different opening and closing tags instead of the EJS's default `<%` and `%>`?.

```javascript
new EmailTemplate(templateDir, { delimiter: '?' })
```

> You can also directly modify the template engine

```javascript
// ...
Handlebars.registerPartial('name', '{{name.first}} {{name.last}}')
Handlebars.registerHelper('capitalize', function (context) {
  return context.toUpperCase()
})
new EmailTemplate(templateDir)
// ...
```

You can also pass a `juiceOptions` object to configure the output from [juice][juice]

```javascript
new EmailTemplate(templateDir, {juiceOptions: {
  preserveMediaQueries: false,
  removeStyleTags: false
}})
```

You can check all the options in [juice's documentation](https://github.com/automattic/juice#options)

You can add includePaths for [sass][sass] using sassOptions.

```javascript
new EmailTemplate(templateDir, {sassOptions: {
  includePaths: ['~/someproject/sass']
}})
```

## Examples

### Basic

Render a single template (having only loaded the template once).

```javascript
var EmailTemplate = require('email-templates').EmailTemplate
var path = require('path')

var templateDir = path.join(__dirname, 'templates', 'newsletter')

var newsletter = new EmailTemplate(templateDir)
var user = {name: 'Joe', pasta: 'spaghetti'}
newsletter.render(user, function (err, result) {
  // result.html
  // result.text
})

var async = require('async')
var users = [
  {name: 'John', pasta: 'Rigatoni'},
  {name: 'Luca', pasta: 'Tortellini'}
]

async.each(users, function (user, next) {
  newsletter.render(user, function (err, result) {
    if (err) return next(err)
    // result.html
    // result.text
    // result.subject
  })
}, function (err) {
  //
})
```

Render a template for a single email or render multiple (having only loaded the template once) using Promises.

```js
var path           = require('path')
var templateDir   = path.join(__dirname, 'templates', 'pasta-dinner')
var EmailTemplate = require('email-templates').EmailTemplate

var template = new EmailTemplate(templateDir)
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

var templates = users.map(function (user) {
  return template.render(user)
})

Promise.all(templates)
  .then(function (results) {
    console.log(results[0].html)
    console.log(results[0].text)
    console.log(results[0].subject)
    console.log(results[1].html)
    console.log(results[1].text)
    console.log(results[1].subject)
  })
```

### More

Please check the [examples directory](https://github.com/niftylettuce/node-email-templates/tree/master/examples)

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
[consolidate]: https://www.npmjs.com/package/consolidate
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
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat
[standard-url]: https://github.com/feross/standard
