# [**email-templates**](https://github.com/niftylettuce/email-templates)

[![build status](https://img.shields.io/travis/niftylettuce/email-templates.svg)](https://travis-ci.org/niftylettuce/email-templates)
[![code coverage](https://img.shields.io/codecov/c/github/niftylettuce/email-templates.svg)](https://codecov.io/gh/niftylettuce/email-templates)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/niftylettuce/email-templates.svg)](LICENSE)

> Create, preview, and send custom email templates for [Node.js][node]. Highly configurable and supports automatic inline CSS, stylesheets, embedded images and fonts, and much more!
>
> **NEW**: v3.0.0 is released! See the [2.x branch][2-x-branch] documentation if you're using an older version


## Table of Contents

* [Install](#install)
* [Usage](#usage)
  * [Basic](#basic)
  * [Localization](#localization)
* [Options](#options)
* [Plugins](#plugins)
* [Custom Rendering (e.g. from a MongoDB database)](#custom-rendering-eg-from-a-mongodb-database)
* [Tip](#tip)
* [Contributors](#contributors)
* [License](#license)


## Install

> By default we recommend [pug][] for your template engine, but you can use [any template engine][supported-engines].

[npm][]:

```sh
npm install email-templates pug
```

[yarn][]:

```sh
yarn add email-templates pug
```


## Usage

### Basic

> You can swap the `transport` option with a [Nodemailer transport][nodemailer-transport] configuration object or transport instance. We highly recommend using [Postmark][] for your transport (it's the default in [Lad][]).

```js
const Email = require('email-templates');

const email = new Email({
  message: {
    from: 'niftylettuce@gmail.com'
  },
  transport: {
    jsonTransport: true
  }
});

email.send({
  template: 'mars',
  message: {
    to: 'elon@spacex.com'
  },
  locals: {
    name: 'Elon'
  }
}).then(console.log).catch(console.error);
```

The example above assumes you have the following directory structure:

```sh
.
├── app.js
└── emails
    └── mars
        ├── html.pug
        └── subject.pug
```

And the contents of the `pug` files are:

> `html.pug`:

```pug
p Hi #{name},
p Welcome to Mars, the red planet.
```

> `subject.pug`:

```pug
= `Hi ${name}, welcome to Mars`
```

### Localization

All you need to do is simply pass an [i18n][] configuration object as `config.i18n` (or an empty one as this example shows to use defaults).

```js
const Email = require('email-templates');

const email = new Email({
  message: {
    from: 'niftylettuce@gmail.com'
  },
  transport: {
    jsonTransport: true
  },
  i18n: {} // <------ HERE
});

email.send({
  template: 'mars',
  message: {
    to: 'elon@spacex.com'
  },
  locals: {
    name: 'Elon'
  }
}).then(console.log).catch(console.error);
```

Then slightly modify your templates to use localization functions.

> `html.pug`:

```pug
p= t(`Hi ${name},`)
p= t('Welcome to Mars, the red planet.')
```

> `subject.pug`:

```pug
= t(`Hi ${name}, welcome to Mars`)
```

Note that if you use [Lad][], you have a built-in filter called `translate`:

```pug
p: :translate(locale) Hi #{name}
p: :translate(locale) Welcome to Mars, the red planet.
```


## Options

For a list of all available options and defaults [view the configuration object](index.js).


## Plugins

You can use any [nodemailer][] plugin. Simply pass an existing transport instance as `config.transport`.

By default we include [nodemailer-base64-to-s3][] which you can enable via `options.base64ToS3`.

We highly recommend to add to your default `config.locals` the following:

* [custom-fonts-in-emails][] - render any font in emails as an image w/retina support (no more Photoshop or Sketch exports!)
* [font-awesome-assets][] - render any [Font Awesome][fa] icon as an image in an email w/retina support (no more Photoshop or Sketch exports!)


## Custom Rendering (e.g. from a MongoDB database)

You can pass a custom `config.render` function which accepts two arguments `view` and `locals` and must return a `Promise`.

If you wanted to read a stored EJS template from MongoDB, you could do something like:

```js
const ejs = require('ejs');

const email = new Email({
  // ...
  render: (view, locals) => {
    return new Promise((resolve, reject) => {
      // this example assumes that `template` returned
      // is an ejs-based template string
      db.templates.findOne({ view }, (err, template) => {
        if (err) return reject(err);
        if (!template) return reject(new Error('Template not found'));
        resolve(ejs.render(template, locals));
      });
    });
  }
});
```


## Tip

Instead of having to configure this for yourself, you could just use [Lad][] instead.


## Contributors

| Name           | Website                   |
| -------------- | ------------------------- |
| **Nick Baugh** | <http://niftylettuce.com> |


## License

[MIT](LICENSE) © [Nick Baugh](http://niftylettuce.com)


## 

[node]: https://nodejs.org

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/

[pug]: https://pugjs.org

[supported-engines]: https://github.com/tj/consolidate.js/#supported-template-engines

[nodemailer]: https://nodemailer.com/plugins/

[font-awesome-assets]: https://github.com/ladjs/font-awesome-assets

[custom-fonts-in-emails]: https://github.com/ladjs/custom-fonts-in-emails

[nodemailer-base64-to-s3]: https://github.com/ladjs/nodemailer-base64-to-s3

[lad]: https://lad.js.org

[2-x-branch]: https://github.com/niftylettuce/node-email-templates/tree/2.x

[i18n]: https://github.com/ladjs/i18n#options

[fa]: http://fontawesome.io/

[nodemailer-transport]: https://nodemailer.com/transports/

[postmark]: https://postmarkapp.com/
