const fs = require('fs');
const path = require('path');
const I18N = require('@ladjs/i18n');
const _ = require('lodash');
const autoBind = require('auto-bind');
const consolidate = require('consolidate');
const debug = require('debug')('email-templates');
const getPaths = require('get-paths');
const htmlToText = require('html-to-text');
const is = require('@sindresorhus/is');
const juice = require('juice');
const nodemailer = require('nodemailer');
const pify = require('pify');
const previewEmail = require('preview-email');

// promise version of `juice.juiceResources`
const juiceResources = (html, options) => {
  return new Promise((resolve, reject) => {
    juice.juiceResources(html, options, (err, html) => {
      if (err) return reject(err);
      resolve(html);
    });
  });
};

const env = (process.env.NODE_ENV || 'development').toLowerCase();
const stat = pify(fs.stat);
const readFile = pify(fs.readFile);

class Email {
  constructor(config = {}) {
    debug('config passed %O', config);

    // 2.x backwards compatible support
    if (config.juiceOptions) {
      config.juiceResources = config.juiceOptions;
      delete config.juiceOptions;
    }

    if (config.disableJuice) {
      config.juice = false;
      delete config.disableJuice;
    }

    if (config.render) {
      config.customRender = true;
    }

    this.config = _.merge(
      {
        views: {
          // directory where email templates reside
          root: path.resolve('emails'),
          options: {
            // default file extension for template
            extension: 'pug',
            map: {
              hbs: 'handlebars',
              njk: 'nunjucks'
            },
            engineSource: consolidate
          },
          // locals to pass to templates for rendering
          locals: {
            // turn on caching for non-development environments
            cache: !['development', 'test'].includes(env),
            // pretty is automatically set to `false` for subject/text
            pretty: true
          }
        },
        // <https://nodemailer.com/message/>
        message: {},
        send: !['development', 'test'].includes(env),
        preview: env === 'development',
        // <https://github.com/ladjs/i18n>
        // set to an object to configure and enable it
        i18n: false,
        // pass a custom render function if necessary
        render: this.render.bind(this),
        customRender: false,
        // force text-only rendering of template (disregards template folder)
        textOnly: false,
        // <https://github.com/werk85/node-html-to-text>
        htmlToText: {
          ignoreImage: true
        },
        subjectPrefix: false,
        // <https://github.com/Automattic/juice>
        juice: true,
        juiceResources: {
          preserveImportant: true,
          webResources: {
            relativeTo: path.resolve('build'),
            images: false
          }
        },
        // pass a transport configuration object or a transport instance
        // (e.g. an instance is created via `nodemailer.createTransport`)
        // <https://nodemailer.com/transports/>
        transport: {},
        // last locale field name (also used by @ladjs/i18n)
        lastLocaleField: 'last_locale'
      },
      config
    );

    // override existing method
    this.render = this.config.render;

    if (!_.isFunction(this.config.transport.sendMail))
      this.config.transport = nodemailer.createTransport(this.config.transport);

    debug('transformed config %O', this.config);

    autoBind(this);
  }

  // shorthand use of `juiceResources` with the config
  // (mainly for custom renders like from a database)
  juiceResources(html) {
    return juiceResources(html, this.config.juiceResources);
  }

  // a simple helper function that gets the actual file path for the template
  async getTemplatePath(template) {
    const [root, view] = path.isAbsolute(template)
      ? [path.dirname(template), path.basename(template)]
      : [this.config.views.root, template];
    const paths = await getPaths(
      root,
      view,
      this.config.views.options.extension
    );
    const filePath = path.resolve(root, paths.rel);
    return { filePath, paths };
  }

  // returns true or false if a template exists
  // (uses same look-up approach as `render` function)
  async templateExists(view) {
    try {
      const { filePath } = await this.getTemplatePath(view);
      const stats = await stat(filePath);
      if (!stats.isFile()) throw new Error(`${filePath} was not a file`);
      return true;
    } catch (err) {
      debug('templateExists', err);
      return false;
    }
  }

  async checkAndRender(type, template, locals) {
    const str = `${template}/${type}`;
    if (!this.config.customRender) {
      const exists = await this.templateExists(str);
      if (!exists) return;
    }

    return this.render(str, {
      ...locals,
      ...(type === 'html' ? {} : { pretty: false })
    });
  }

  // promise version of consolidate's render
  // inspired by koa-views and re-uses the same config
  // <https://github.com/queckezz/koa-views>
  async render(view, locals = {}) {
    const { map, engineSource } = this.config.views.options;
    const { filePath, paths } = await this.getTemplatePath(view);
    if (paths.ext === 'html' && !map) {
      const res = await readFile(filePath, 'utf8');
      return res;
    }

    const engineName = map && map[paths.ext] ? map[paths.ext] : paths.ext;
    const renderFn = engineSource[engineName];
    if (!engineName || !renderFn)
      throw new Error(
        `Engine not found for the ".${paths.ext}" file extension`
      );

    if (_.isObject(this.config.i18n)) {
      if (
        this.config.i18n.lastLocaleField &&
        this.config.lastLocaleField &&
        this.config.i18n.lastLocaleField !== this.config.lastLocaleField
      )
        throw new Error(
          `The 'lastLocaleField' (String) option for @ladjs/i18n and email-templates do not match, i18n value was ${this.config.i18n.lastLocaleField} and email-templates value was ${this.config.lastLocaleField}`
        );

      const i18n = new I18N({ ...this.config.i18n, register: locals });

      // support `locals.user.last_locale` (variable based name lastLocaleField)
      // (e.g. for <https://lad.js.org>)
      if (
        _.isObject(locals.user) &&
        _.isString(locals.user[this.config.lastLocaleField])
      )
        locals.locale = locals.user[this.config.lastLocaleField];

      if (_.isString(locals.locale)) i18n.setLocale(locals.locale);
    }

    const res = await pify(renderFn)(filePath, locals);
    // transform the html with juice using remote paths
    // google now supports media queries
    // https://developers.google.com/gmail/design/reference/supported_css
    if (!this.config.juice) return res;
    const html = await this.juiceResources(res);
    return html;
  }

  async renderAll(template, locals = {}, nodemailerMessage = {}) {
    const message = { ...nodemailerMessage };

    if (template) {
      const [subject, html, text] = await Promise.all(
        ['subject', 'html', 'text'].map(type =>
          this.checkAndRender(type, template, locals)
        )
      );

      if (subject) message.subject = subject.trim();
      if (html) message.html = html;
      if (text) message.text = text;
    }

    if (message.subject && this.config.subjectPrefix)
      message.subject = this.config.subjectPrefix + message.subject;

    if (this.config.htmlToText && message.html && !message.text)
      // we'd use nodemailer-html-to-text plugin
      // but we really don't need to support cid
      // <https://github.com/andris9/nodemailer-html-to-text>
      message.text = htmlToText.fromString(
        message.html,
        this.config.htmlToText
      );

    // if we only want a text-based version of the email
    if (this.config.textOnly) delete message.html;

    // if no subject, html, or text content exists then we should
    // throw an error that says at least one must be found
    // otherwise the email would be blank (defeats purpose of email-templates)
    if (
      (!is.string(message.subject) ||
        is.emptyStringOrWhitespace(message.subject)) &&
      (!is.string(message.text) || is.emptyStringOrWhitespace(message.text)) &&
      (!is.string(message.html) || is.emptyStringOrWhitespace(message.html)) &&
      _.isArray(message.attachments) &&
      _.isEmpty(message.attachments)
    )
      throw new Error(
        `No content was passed for subject, html, text, nor attachments message props. Check that the files for the template "${template}" exist.`
      );

    return message;
  }

  async send(options = {}) {
    options = {
      template: '',
      message: {},
      locals: {},
      ...options
    };

    let { template, message, locals } = options;

    const attachments =
      message.attachments || this.config.message.attachments || [];

    message = _.defaultsDeep(
      {},
      _.omit(message, 'attachments'),
      _.omit(this.config.message, 'attachments')
    );
    locals = _.defaultsDeep({}, this.config.views.locals, locals);

    if (attachments) message.attachments = attachments;

    debug('template %s', template);
    debug('message %O', message);
    debug('locals (keys only): %O', Object.keys(locals));

    // get all available templates
    const obj = await this.renderAll(template, locals, message);

    // assign the object variables over to the message
    Object.assign(message, obj);

    if (this.config.preview) {
      debug('using `preview-email` to preview email');
      if (_.isObject(this.config.preview))
        await previewEmail(message, this.config.preview);
      else await previewEmail(message);
    }

    if (!this.config.send) {
      debug('send disabled so we are ensuring JSONTransport');
      // <https://github.com/nodemailer/nodemailer/issues/798>
      // if (this.config.transport.name !== 'JSONTransport')
      this.config.transport = nodemailer.createTransport({
        jsonTransport: true
      });
    }

    const res = await this.config.transport.sendMail(message);
    debug('message sent');
    res.originalMessage = message;
    return res;
  }
}

module.exports = Email;
