const path = require('path');
const debug = require('debug')('email-templates');
const fs = require('fs-extra');
const htmlToText = require('html-to-text');
const I18N = require('@ladjs/i18n');
const autoBind = require('auto-bind');
const nodemailer = require('nodemailer');
const consolidate = require('consolidate');
const previewEmail = require('preview-email');
const _ = require('lodash');
const Promise = require('bluebird');

const getPaths = require('get-paths');
const juiceResources = require('juice-resources-promise');

const env = process.env.NODE_ENV || 'development';

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
            relativeTo: path.resolve('build')
          }
        },
        // pass a transport configuration object or a transport instance
        // (e.g. an instance is created via `nodemailer.createTransport`)
        // <https://nodemailer.com/transports/>
        transport: {}
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
  getTemplatePath(view) {
    return new Promise(async (resolve, reject) => {
      try {
        const paths = await getPaths(
          this.config.views.root,
          view,
          this.config.views.options.extension
        );
        const filePath = path.resolve(this.config.views.root, paths.rel);
        resolve({ filePath, paths });
      } catch (err) {
        reject(err);
      }
    });
  }

  // returns true or false if a template exists
  // (uses same look-up approach as `render` function)
  templateExists(view) {
    return new Promise(async resolve => {
      try {
        const { filePath } = await this.getTemplatePath(view);
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) throw new Error(`${filePath} was not a file`);
        resolve(true);
      } catch (err) {
        debug('templateExists', err);
        resolve(false);
      }
    });
  }

  // promise version of consolidate's render
  // inspired by koa-views and re-uses the same config
  // <https://github.com/queckezz/koa-views>
  render(view, locals = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const { map, engineSource } = this.config.views.options;
        const { filePath, paths } = await this.getTemplatePath(view);
        if (paths.ext === 'html' && !map) {
          const res = await fs.readFile(filePath, 'utf8');
          resolve(res);
        } else {
          const engineName = map && map[paths.ext] ? map[paths.ext] : paths.ext;
          const renderFn = engineSource[engineName];
          if (!engineName || !renderFn)
            return reject(
              new Error(
                `Engine not found for the ".${paths.ext}" file extension`
              )
            );

          if (_.isObject(this.config.i18n)) {
            const i18n = new I18N(
              Object.assign({}, this.config.i18n, {
                register: locals
              })
            );

            // support `locals.user.last_locale`
            // (e.g. for <https://lad.js.org>)
            if (_.isObject(locals.user) && _.isString(locals.user.last_locale))
              locals.locale = locals.user.last_locale;

            if (_.isString(locals.locale)) i18n.setLocale(locals.locale);
          }

          // TODO: convert this to a promise based version
          renderFn(filePath, locals, (err, res) => {
            if (err) return reject(err);
            // transform the html with juice using remote paths
            // google now supports media queries
            // https://developers.google.com/gmail/design/reference/supported_css
            if (!this.config.juice) return resolve(res);
            this.juiceResources(res)
              .then(resolve)
              .catch(reject);
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  renderAll(template, locals = {}, message = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        let subjectTemplateExists = this.config.customRender;
        let htmlTemplateExists = this.config.customRender;
        let textTemplateExists = this.config.customRender;

        const promises = [
          this.templateExists(`${template}/subject`),
          this.templateExists(`${template}/html`),
          this.templateExists(`${template}/text`)
        ];

        if (template && !this.config.customRender)
          [
            subjectTemplateExists,
            htmlTemplateExists,
            textTemplateExists
          ] = await Promise.all(promises);

        if (!message.subject && subjectTemplateExists) {
          message.subject = await this.render(
            `${template}/subject`,
            Object.assign({}, locals, { pretty: false })
          );
          message.subject = message.subject.trim();
        }

        if (message.subject && this.config.subjectPrefix)
          message.subject = this.config.subjectPrefix + message.subject;

        if (!message.html && htmlTemplateExists)
          message.html = await this.render(`${template}/html`, locals);

        if (!message.text && textTemplateExists)
          message.text = await this.render(
            `${template}/text`,
            Object.assign({}, locals, { pretty: false })
          );

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

        resolve(message);
      } catch (err) {
        reject(err);
      }
    });
  }

  send(options = {}) {
    options = Object.assign(
      {
        template: '',
        message: {},
        locals: {}
      },
      options
    );

    let { template, message, locals } = options;

    const attachments =
      message.attachments || this.config.message.attachments || [];

    message = _.defaultsDeep(
      {},
      _.omit(this.config.message, 'attachments'),
      _.omit(message, 'attachments')
    );
    locals = _.defaultsDeep({}, this.config.views.locals, locals);

    if (attachments) message.attachments = attachments;

    debug('template %s', template);
    debug('message %O', message);
    debug('locals (keys only): %O', Object.keys(locals));

    return new Promise(async (resolve, reject) => {
      try {
        // get all available templates
        const obj = await this.renderAll(template, locals, message);

        // assign the object variables over to the message
        Object.assign(message, obj);

        if (this.config.preview) {
          debug('using `preview-email` to preview email');
          await previewEmail(message);
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
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Email;
