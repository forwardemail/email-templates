# [**Email Templates**](https://github.com/forwardemail/email-templates)

[![build status](https://travis-ci.com/forwardemail/email-templates.svg)](https://travis-ci.com/forwardemail/email-templates)
[![code coverage](https://img.shields.io/codecov/c/github/forwardemail/email-templates.svg)](https://codecov.io/gh/forwardemail/email-templates)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/forwardemail/email-templates.svg)](LICENSE)

> :heart: Love this project? Support <a href="https://github.com/niftylettuce" target="_blank">@niftylettuce's</a> [FOSS](https://en.wikipedia.org/wiki/Free_and_open-source_software) on <a href="https://patreon.com/niftylettuce" target="_blank">Patreon</a> or <a href="https://paypal.me/niftylettuce">PayPal</a> :unicorn:

Create, [preview][preview-email], and send custom email templates for [Node.js][node]. Highly configurable and supports automatic inline CSS, stylesheets, embedded images and fonts, and much more! Made for sending beautiful emails with [Lad][].


## Table of Contents

* [Install](#install)
* [Preview](#preview)
* [Usage](#usage)
  * [Debugging](#debugging)
  * [Basic](#basic)
  * [Attachments](#attachments)
  * [Automatic Inline CSS via Stylesheets](#automatic-inline-css-via-stylesheets)
  * [Render HTML and/or Text](#render-html-andor-text)
  * [Cache Pug Templates](#cache-pug-templates)
  * [Localization](#localization)
  * [Text-Only Email (no HTML)](#text-only-email-no-html)
  * [Prefix Subject Lines](#prefix-subject-lines)
  * [Custom Text Template](#custom-text-template)
  * [Custom Template Engine (e.g. EJS)](#custom-template-engine-eg-ejs)
  * [Custom Default Message Options](#custom-default-message-options)
  * [Custom Rendering (e.g. from a MongoDB database)](#custom-rendering-eg-from-a-mongodb-database)
  * [Absolute Path to Templates](#absolute-path-to-templates)
  * [Open Email Previews in Firefox](#open-email-previews-in-firefox)
* [Options](#options)
* [Plugins](#plugins)
* [Breaking Changes](#breaking-changes)
  * [v7.0.0](#v700)
  * [v6.0.0](#v600)
  * [v5.0.0](#v500)
  * [v4.0.0](#v400)
  * [v3.0.0](#v300)
* [Tip](#tip)
* [Related](#related)
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


## Preview

We've added [preview-email][] by default to this package!

This means that (by default) in the development environment (e.g. `NODE_ENV=development`) your emails will be rendered to the tmp directory for you and automatically opened in the browser.

If you have trouble previewing emails in your browser, you can configure a `preview` option which gets passed along to [open's options][open-options] (e.g. `preview: { open: { app: 'firefox' } }`).

See the example below for [Open Email Previews in Firefox](#open-email-previews-in-firefox).


## Usage

### Debugging

#### Environment Flag

If you run into any issues with configuration, files, templates, locals, etc, then you can use the `DEBUG` environment flag:

```sh
DEBUG=email-templates node app.js
```

This will output to the console all debug statements in our codebase for this package.

#### Inspect Message

As of v3.6.1 you can now inspect the message passed to `nodemailer.sendMail` internally.

In the response object from `email.send`, you have access to `res.originalMessage`:

```js
email
  .send({
    template: 'mars',
    message: {
      to: 'elon@spacex.com'
    },
    locals: {
      name: 'Elon'
    }
  })
  .then(res => {
    console.log('res.originalMessage', res.originalMessage)
  })
  .catch(console.error);
```

### Basic

> You can swap the `transport` option with a [Nodemailer transport][nodemailer-transport] configuration object or transport instance. We highly recommend using [Postmark][] for your transport (it's the default in [Lad][]).
>
> If you want to send emails in `development` or `test` environments, set `options.send` to `true`.

```js
const Email = require('email-templates');

const email = new Email({
  message: {
    from: 'niftylettuce@gmail.com'
  },
  // uncomment below to send emails in development/test env:
  // send: true
  transport: {
    jsonTransport: true
  }
});

email
  .send({
    template: 'mars',
    message: {
      to: 'elon@spacex.com'
    },
    locals: {
      name: 'Elon'
    }
  })
  .then(console.log)
  .catch(console.error);
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

### Attachments

Please reference [Nodemailer's attachment documentation][attachments] for further reference.

> If you want to set default attachments sent with every email:

```js
const Email = require('email-templates');

const email = new Email({
  message: {
    from: 'niftylettuce@gmail.com',
    attachments: [
      {
        filename: 'text1.txt',
        content: 'hello world!'
      }
    ]
  }
});

email
  .send({
    template: 'mars',
    message: {
      to: 'elon@spacex.com'
    },
    locals: {
      name: 'Elon'
    }
  })
  .then(console.log)
  .catch(console.error);
```

> If you want to set attachments sent individually:

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

email
  .send({
    template: 'mars',
    message: {
      to: 'elon@spacex.com',
      attachments: [
        {
          filename: 'text1.txt',
          content: 'hello world!'
        }
      ]
    },
    locals: {
      name: 'Elon'
    }
  })
  .then(console.log)
  .catch(console.error);
```

### Automatic Inline CSS via Stylesheets

Simply include the path or URL to the stylesheet in your template's `<head>`:

```pug
link(rel="stylesheet", href="/css/app.css", data-inline)
```

This will look for the file `/css/app.css` in the `build/` folder.

If this asset is in another folder, then you will need to modify the default options when creating an `Email` instance:

```js
const email = new Email({
  // <https://github.com/Automattic/juice>
  juice: true,
  juiceResources: {
    preserveImportant: true,
    webResources: {
      //
      // this is the relative directory to your CSS/image assets
      // and its default path is `build/`:
      //
      // e.g. if you have the following in the `<head`> of your template:
      // `<link rel="stylesheet" href="style.css" data-inline="data-inline">`
      // then this assumes that the file `build/style.css` exists
      //
      relativeTo: path.resolve('build')
      //
      // but you might want to change it to something like:
      // relativeTo: path.join(__dirname, '..', 'assets')
      // (so that you can re-use CSS/images that are used in your web-app)
      //
    }
  }
});
```

### Render HTML and/or Text

If you don't need this module to send your email, you can still use it to render HTML and/or text templates.

Simply use the `email.render(view, locals)` method we expose (it's the same method that `email.send` uses internally).

> If you need to render a specific email template file (e.g. the HTML version):

```js
const Email = require('email-templates');

const email = new Email();

email
  .render('mars/html', {
    name: 'Elon'
  })
  .then(console.log)
  .catch(console.error);
```

The example above assumes you have the following directory structure (note that this example would only render the `html.pug` file):

```sh
.
├── app.js
└── emails
    └── mars
        ├── html.pug
        ├── text.pug
        └── subject.pug
```

The Promise for `email.render` resolves with a String (the HTML or text rendered).

> If you need to render all available template files for a given email template (e.g. `html.pug`, `text.pug`, and `subject.pug` – you can use `email.renderAll` (this is the method that `email.send` uses).

```js
const Email = require('email-templates');

const email = new Email();

email
  .renderAll('mars', {
    name: 'Elon'
  })
  .then(console.log)
  .catch(console.error);
```

> If you need to render multiple, specific templates at once (but not all email templates available), then you can use `Promise.all` in combination with `email.render`:

```js
const Email = require('email-templates');

const email = new Email();
const locals = { name: 'Elon' };

Promise
  .all([
    email.render('mars/html', locals),
    email.render('mars/text', locals)
  ])
  .then(([ html, text ]) => {
    console.log('html', html);
    console.log('text', text);
  })
  .catch(console.error);
```

### Cache Pug Templates

Out of the box, templates are cached as they are compiled (e.g. as emails are sent, the template they're using is cached).  However these templates are not cached in-advance, so the first emails sent of each template will be slower to send.

We strongly suggest to pre-cache your templates with [cache-pug-templates][] (if you're using the default [Pug][] template engine).

If you do not do this, then your Pug templates will re-compile and re-cache every time you deploy new code and restart your app.

Note that you will need to specify the `views` option to your `new CachePugTemplates({ views: '...' });` instance, with `views` being a file path (Array or String) to your email template directory.  See [cache-pug-templates][] documentation for more information.

### Localization

All you need to do is simply pass an [i18n][] configuration object as `config.i18n` (or an empty one as this example shows to use defaults).

> Don't want to handle localization and translation yourself?  Just use [Lad][lad] – it's built in and uses [mandarin][] (with automatic Google Translate support) under the hood!

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

email
  .send({
    template: 'mars',
    message: {
      to: 'elon@spacex.com'
    },
    locals: {
      locale: 'en', // <------ CUSTOMIZE LOCALE HERE (defaults to `i18n.defaultLocale` - `en`)
      // is your user french?
      // locale: 'fr',
      name: 'Elon'
    }
  })
  .then(console.log)
  .catch(console.error);
```

Then slightly modify your templates to use localization functions.

> `html.pug`:

```pug
p= `${t('Hi')} ${name},`
p= t('Welcome to Mars, the red planet.')
```

> `subject.pug`:

```pug
p= `${t('Hi')} ${name}, ${t('welcome to Mars')}`
```

Note that if you use [Lad][], you have a built-in filter called `translate`:

```pug
p: :translate(locale) Welcome to Mars, the red planet.
```

### Text-Only Email (no HTML)

If you wish to have only a text-based version of your email you can simply pass the option `textOnly: true`.

Regardless if you use the `htmlToText` option or not (see next example), it will still render only a text-based version.

```js
const Email = require('email-templates');

const email = new Email({
  message: {
    from: 'niftylettuce@gmail.com'
  },
  transport: {
    jsonTransport: true
  },
  textOnly: true // <----- HERE
});

email
  .send({
    template: 'mars',
    message: {
      to: 'elon@spacex.com'
    },
    locals: {
      name: 'Elon'
    }
  })
  .then(console.log)
  .catch(console.error);
```

### Prefix Subject Lines

You can pass an option to prefix subject lines with a string, which is super useful for deciphering development / staging / production environment emails.

For example, you could make it so on non-production environments the email is prefixed with a `[DEVELOPMENT] Some Subject Line Here`.

You could do this manually by passing a `message.subject` property, however if you are storing your subject lines in templates (e.g. `subject.ejs` or `subject.pug`) then it's not as easy.

Simply use the `subjectPrefix` option and set it to whatever you wish (**note you will need to append a trailing space if you wish to have a space after the prefix; see example below**):

```js
const Email = require('email-templates');

const env = process.env.NODE_ENV || 'development';

const email = new Email({
  message: {
    from: 'niftylettuce@gmail.com'
  },
  transport: {
    jsonTransport: true
  },
  subjectPrefix: env === 'production' ? false : `[${env.toUpperCase()}] `; // <--- HERE
});
```

### Custom Text Template

> By default we use `html-to-text` to generate a plaintext version and attach it as `message.text`.

If you'd like to customize the text body, you can pass `message.text` or create a `text` template file just like you normally would for `html` and `subject`.

You may also set `config.htmlToText: false` to force the usage of the `text` template file.

```js
const Email = require('email-templates');

const email = new Email({
  message: {
    from: 'niftylettuce@gmail.com'
  },
  transport: {
    jsonTransport: true
  },
  htmlToText: false // <----- HERE
});

email
  .send({
    template: 'mars',
    message: {
      to: 'elon@spacex.com'
    },
    locals: {
      name: 'Elon'
    }
  })
  .then(console.log)
  .catch(console.error);
```

> `text.pug`:

```pug
| Hi #{name},
| Welcome to Mars, the red planet.
```

### Custom Template Engine (e.g. EJS)

1. Install your desired template engine (e.g. [EJS][])

   [npm][]:

   ```sh
   npm install ejs
   ```

   [yarn][]:

   ```sh
   yarn add ejs
   ```

2. Set the extension in options and send an email

   ```js
   const Email = require('email-templates');

   const email = new Email({
     message: {
       from: 'niftylettuce@gmail.com'
     },
     transport: {
       jsonTransport: true
     },
     views: {
       options: {
         extension: 'ejs' // <---- HERE
       }
     }
   });
   ```

### Custom Default Message Options

You can configure your Email instance to have default message options, such as a default "From", an unsubscribe header, etc.

For a list of all available message options and fields see [the Nodemailer message reference](https://nodemailer.com/message/).

> Here's an example showing how to set a default custom header and a list unsubscribe header:

```js
const Email = require('email-templates');

const email = new Email({
  message: {
    from: 'niftylettuce@gmail.com',
    headers: {
      'X-Some-Custom-Thing': 'Some-Value'
    },
    list: {
      unsubscribe: 'https://niftylettuce.com/unsubscribe'
    }
  },
  transport: {
    jsonTransport: true
  }
});
```

### Custom Rendering (e.g. from a MongoDB database)

You can pass a custom `config.render` function which accepts two arguments `view` and `locals` and must return a `Promise`.

Note that if you specify a custom `config.render`, you should have it use `email.juiceResources` before returning the final HTML.  The example below shows how to do this.

If you wanted to read a stored EJS template from MongoDB, you could do something like:

```js
const ejs = require('ejs');

const email = new Email({
  // ...
  render: (view, locals) => {
    return new Promise((resolve, reject) => {
      // this example assumes that `template` returned
      // is an ejs-based template string
      // view = `${template}/html` or `${template}/subject` or `${template}/text`
      db.templates.findOne({ name: view }, (err, template) => {
        if (err) return reject(err);
        if (!template) return reject(new Error('Template not found'));
        let html = ejs.render(template, locals);
        html = await email.juiceResources(html);
        resolve(html);
      });
    });
  }
});
```

### Absolute Path to Templates

As of v5.0.1+ we now support passing absolute paths to templates for rendering (per discussion in [#320](https://github.com/forwardemail/email-templates/issues/320).

For both `email.send` and `email.render`, the `template` option passed can be a relative path or absolute:

> Relative example:

```js
email
  .send({
    template: 'mars',
    message: {
      to: 'elon@spacex.com'
    },
    locals: {
      name: 'Elon'
    }
  })
  .then(console.log)
  .catch(console.error);
```

> Absolute example:

```js
const path = require('path');

// ...

email
  .send({
    template: path.join(__dirname, 'some', 'folder', 'mars')
    message: {
      to: 'elon@spacex.com'
    },
    locals: {
      name: 'Elon'
    }
  })
  .then(console.log)
  .catch(console.error);
```

### Open Email Previews in Firefox

The `preview` option can be a custom Object of options to pass along to [open's options][open-options].

> Firefox example:

```js
const email = new Email({
  // ...
  preview: {
    open: {
      app: 'firefox',
      wait: false
    }
  }
});
```


## Options

For a list of all available options and defaults [view the configuration object](src/index.js), or reference the list below:

* `views` (Object)
  * `root` (String) - defaults to the current working directory's "emails" folder via `path.resolve('emails')`
  * `options` (Object)
    * `extension` (String) - defaults to `'pug'`, and is the default file extension for templates
    * `map` (Object) - a template file extension mapping, defaults to `{ hbs: 'handlebars', njk: 'nunjucks' }` (this is useful if you use different file extension naming conventions)
    * `engineSource` (Object) - the default template engine source, defaults to [consolidate][]
  * `locals` (Object) - locals to pass to templates for rendering
    * `cache` (Boolean) - defaults to `false` for `development` and `test` environments, and `true` for all others (via `process.env.NODE_ENV`), whether or not to cache templates
    * `pretty` (Boolean) - defaults to `true`, but is automatically set to `false` for subject templates and text-based emails
* `message` (Object) - default [Nodemailer message object][nodemailer-message-object] for messages to inherit (defaults to an empty object `{}`)
* `send` (Boolean) - whether or not to send emails, defaults to `false` for `development` and `test` environments, and `true` for all others (via `process.env.NODE_ENV`) (**NOTE: IF YOU ARE NOT USING `NODE_ENV` YOU WILL NEED TO MANUALLY SET THIS TO `true`**)
* `preview` (Boolean or Object) - whether or not to preview emails using [preview-email][], defaults to `false` unless the environment is `development` (via `process.env.NODE_ENV`)
* `i18n` (Boolean or Object) - translation support for email templates, this accepts an I18N configuration object (defaults to `false`, which means it is disabled) which is passed along to [@ladjs/i18n][i18n] – see [Localization](#localization) example for more insight
* `render` (Function) - defaults to a stable function that accepts two argument, `view` (String) and `locals` (Object) - you should not need to set this unless you have a need for custom rendering (see [Custom Rendering (e.g. from a MongoDB database)](#custom-rendering-eg-from-a-mongodb-database))
* `customRender` (Boolean) - defaults to `false`, unless you pass your own `render` function, and in that case it will be automatically set to `true`
* `textOnly` (Boolean) - whether or not to force text-only rendering of a template and disregard the template folder (defaults to `false`)
* `htmlToText` (Object) - configuration object for [html-to-text][]
  * `ignoreImage` (Boolean) - defaults to `true`
* `subjectPrefix` (Boolean or String) - defaults to `false`, but if set to a string it will use that string as a prefix for your emails' subjects
* `juice` (Boolean) - whether or not to use [juice][] when rendering templates (defaults to `true`) (note that if you have a custom rendering function you will need to implement [juice][] in it yourself)
* `juiceResources` (Object) - options to pass to `juice.juiceResources` method (only used if `juice` option is set to `true`, see [juice's][juice] API for more information
  * `preserveImportant` (Boolean) - defaults to `true`
  * `webResources` (Object) - an options object that will be passed to [web-resource-inliner][]
    * `relativeTo` (String) - defaults to the current working directory's "build" folder via `path.resolve('build')` (**NOTE: YOU SHOULD MODIFY THIS PATH TO WHERE YOUR BUILD/ASSETS FOLDER IS**)
    * `images` (Boolean or Number) - defaults to `false`, and is  whether or not to inline images unless they have an exclusion attribute (see [web-resource-inliner][] for more insight), if it is set to a Number then that is used as the KB threshold
* `transport` (Object) - a transport configuration object or a Nodemailer transport instance created via `nodemailer.createTransport`, defaults to an empty object `{}`, see [Nodemailer transports][nodemailer-transports] documentation for more insight
* `getPath` (Function) - a function that returns the path to a template file, defaults to `function (type, template) { return path.join(template, type); }`, and accepts three arguments `type`, `template`, and `locals`


## Plugins

You can use any [nodemailer][] plugin. Simply pass an existing transport instance as `config.transport`.

You should add the [nodemailer-base64-to-s3][] plugin to convert base64 inline images to actual images stored on Amazon S3 and Cloudfront.

When doing so (as of v4.0.2+), you will need to adjust your `email-templates` configuration to pass `images: true` as such:

```js
const email = new Email({
  // ...
  juiceResources: {
    preserveImportant: true,
    webResources: {
      relativeTo: path.resolve('build'),
      images: true // <--- set this as `true`
    }
  }
});
```

We also highly recommend to add to your default `config.locals` the following:

* [custom-fonts-in-emails][] - render any font in emails as an image w/retina support (no more Photoshop or Sketch exports!)
* [font-awesome-assets][] - render any [Font Awesome][fa] icon as an image in an email w/retina support (no more Photoshop or Sketch exports!)


## Breaking Changes

See the [Releases](https://github.com/forwardemail/email-templates/releases) page for an up to date changelog.

### v7.0.0

We upgraded `preview-email` to `v2.0.0`, which supports stream attachments, and additionally the view rendering is slightly different (we simply iterate over header lines and format them in a `<pre><code>` block).  A major version bump was done due to the significant visual change in the preview rendering of emails.

### v6.0.0

* Performance should be significantly improved as the rendering of subject, html, and text parts now occurs asynchronously in parallel (previously it was in series and had blocking lookup calls).
* We removed [bluebird][] and replaced it with a lightweight alternative [pify][] (since all we were using was the `Promise.promisify` method from `bluebird` as well).
* This package now only supports Node v8.x+ (due to [preview-email][]'s [open][] dependency requiring it).
* Configuration for the `preview` option has slightly changed, which now allows you to [specify a custom template and stylesheets](https://github.com/niftylettuce/preview-email#custom-preview-template-and-stylesheets) for preview rendering.

  > If you were using a custom `preview` option before, you will need to change it slightly:

  ```diff
  const email = new Email({
    // ...
    preview: {
  +    open: {
  +      app: 'firefox',
  +      wait: false
  +    }
  -    app: 'firefox',
  -    wait: false
    }
  });
  ```

### v5.0.0

In version 4.x+, we changed the order of defaults being set.  See [#313](https://github.com/forwardemail/email-templates/issues/313) for more information.  This allows you to override message options such as `from` (even if you have a global default `from` set).

### v4.0.0

See v5.0.0 above

### v3.0.0

> If you are upgrading from v2 or prior to v3, please note that the following breaking API changes occurred:

1. You need to have Node v6.4.0+, we recommend using [nvm](https://github.com/creationix/nvm) to manage your Node versions.

2. Instead of calling `const newsletter = new EmailTemplate(...args)`, you now call `const email = new Email(options)`.

   * The arguments you pass to the constructor have changed as well.
   * Previously you'd pass `new EmailTemplate(templateDir, options)`.  Now you will need to pass simply one object with a configuration as an argument to the constructor.
   * If your `templateDir` path is the "emails" folder in the root of your project (basically `./emails` folder) then you do not need to pass it at all since it is the default per the [configuration object](src/index.js).
   * The previous value for `templateDir` can be used as such:

   ```diff
   -const newsletter = new EmailTemplate(templateDir);
   +const email = new Email({
   +  views: { root: templateDir }
   +});
   ```

   * Note that if you are inlining CSS, you should also make sure that the option for `juiceResources.webResources.relativeTo` is accurate.

3. Instead of calling `newsletter.render(locals, callback)` you now call `email.render(template, locals)`.  The return value of `email.render` when invoked is a `Promise` and does not accept a callback function.

   > **NOTE**: `email-templates` v3 now has an `email.send` method ([see basic usage example](#basic)) which uses `nodemailer`; you should now use `email.send` instead of `email.render`!

   ```diff
   -newsletter.render({}, (err, result) => {
   -  if (err) return console.error(err);
   -  console.log(result);
   -});
   +email.render(template, {}).then(console.log).catch(console.error);
   ```

4. Localized template directories are no longer supported.  We now support i18n translations out of the box.  See [Localization](#localization) for more info.

5. A new method `email.send` has been added.  This allows you to create a Nodemailer transport and send an email template all at once (it calls `email.render` internally).  See the [Basic](#basic) usage documentation above for an example.

6. There are new options `options.send` and `options.preview`.  Both are Boolean values and configured automatically based off the environment.  Take a look at the [configuration object](src/index.js).  Note that you can optionally pass an Object to `preview` option, which gets passed along to [open's options][open-options].

7. If you wish to send emails in development or test environment (disabled by default), set `options.send` to `true`.


## Tip

Instead of having to configure this for yourself, you could just use [Lad][] instead.


## Related

* [lad][] - Scaffold a [Koa][] webapp and API framework for [Node.js][node]
* [lass][] - Scaffold a modern boilerplate for [Node.js][node]
* [cabin][] - Logging and analytics solution for [Node.js][node], [Lad][], [Koa][], and [Express][]
* [forward-email][] - Free, encrypted, and open-source email forwarding service for custom domains
* [lipo][] - Free image manipulation API service built on top of [Sharp][]


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

[i18n]: https://github.com/ladjs/i18n#options

[fa]: http://fontawesome.io/

[nodemailer-transport]: https://nodemailer.com/transports/

[postmark]: https://postmarkapp.com/

[ejs]: http://ejs.co/

[cache-pug-templates]: https://github.com/ladjs/cache-pug-templates

[preview-email]: https://github.com/niftylettuce/preview-email

[attachments]: https://nodemailer.com/message/attachments/

[lass]: https://lass.js.org

[cabin]: https://cabinjs.com

[forward-email]: https://forwardemail.net

[lipo]: https://lipo.io

[koa]: https://koajs.com/

[sharp]: http://sharp.dimens.io/

[express]: https://expressjs.com

[open-options]: https://github.com/sindresorhus/open#options

[mandarin]: https://github.com/niftylettuce/mandarin

[consolidate]: https://github.com/tj/consolidate.js

[nodemailer-message-object]: https://nodemailer.com/message/

[html-to-text]: https://github.com/werk85/node-html-to-text

[web-resource-inliner]: https://github.com/jrit/web-resource-inliner

[nodemailer-transports]: https://nodemailer.com/transports/

[juice]: https://github.com/Automattic/juice

[bluebird]: https://github.com/petkaantonov/bluebird

[pify]: https://github.com/sindresorhus/pify

[open]: https://github.com/sindresorhus/open
