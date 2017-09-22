const os = require('os');
const path = require('path');
const debug = require('debug')('email-templates');
const fs = require('fs-extra');
const uuid = require('uuid');
const htmlToText = require('html-to-text');
const opn = require('opn');
const I18N = require('@ladjs/i18n');
const autoBind = require('auto-bind');
const nodemailer = require('nodemailer');
const base64ToS3 = require('nodemailer-base64-to-s3');
const consolidate = require('consolidate');
const isFunction = require('lodash.isfunction');
const isObject = require('lodash.isobject');
const isEmpty = require('lodash.isempty');
const isString = require('lodash.isstring');
const defaultsDeep = require('lodash.defaultsdeep');
const merge = require('lodash.merge');

const getPaths = require('get-paths');
const juiceResources = require('juice-resources-promise');

// TODO: recommend lad in email-templates
// TODO: update lad readme to show it uses email-templates v3
// TODO: redis caching
// TODO: upgrade web-resource-inliner once <https://github.com/jrit/web-resource-inliner/pull/31> is released

class Email {
  constructor(config = {}) {
    debug('config passed %O', config);
    this.config = merge(
      {
        views: {
          // directory where email templates reside
          root: path.resolve('emails'),
          options: {
            // default file extension for template
            extension: 'pug',
            map: {},
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
        send: !['development', 'test'].includes(process.env.NODE_ENV),
        open: process.env.NODE_ENV === 'development',
        // <https://github.com/ladjs/i18n>
        // set to an object to configure and enable it
        i18n: false,
        // pass a custom render function if necessary
        render: this.render.bind(this),
        // <https://github.com/werk85/node-html-to-text>
        htmlToText: {
          ignoreImage: true
        },
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
        transport: {},
        // <https://github.com/ladjs/nodemailer-base64-to-s3
        base64ToS3: {}
      },
      config
    );

    if (!isObject(this.config.transport) || isEmpty(this.config.transport))
      throw new Error(
        'Transport option must be a transport instance or configuration object'
      );

    if (!isFunction(this.config.transport.sendMail))
      this.config.transport = nodemailer.createTransport(this.config.transport);

    if (isObject(this.config.base64ToS3) && !isEmpty(this.config.base64ToS3))
      this.config.transport.use('compile', base64ToS3(this.config.base64ToS3));

    debug('transformed config %O', this.config);

    autoBind(this);
  }

  // promise version of consolidate's render
  // inspired by koa-views and re-uses the same config
  // <https://github.com/queckezz/koa-views>
  render(view, locals) {
    return new Promise(async (resolve, reject) => {
      try {
        const { map, engineSource, extension } = this.config.views.options;
        const paths = await getPaths(this.config.views.root, view, extension);
        const filePath = path.resolve(this.config.views.root, paths.rel);
        const suffix = paths.ext;
        if (suffix === 'html' && !map) {
          const res = await fs.readFile(filePath, 'utf8');
          resolve(res);
        } else {
          const engineName = map && map[suffix] ? map[suffix] : suffix;
          const render = engineSource[engineName];
          if (!engineName || !render)
            return reject(
              new Error(`Engine not found for the ".${suffix}" file extension`)
            );
          // TODO: convert this to a promise based version
          render(filePath, locals, (err, res) => {
            if (err) return reject(err);
            resolve(res);
          });
        }
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

    message = defaultsDeep(this.config.message, message);
    locals = defaultsDeep(this.config.views.locals, locals);

    debug('template %s', template);
    debug('message %O', message);
    debug('locals (keys only): %O', Object.keys(locals));

    return new Promise(async (resolve, reject) => {
      try {
        if (isObject(this.config.i18n)) {
          const i18n = new I18N(
            Object.assign({}, this.config.i18n, {
              register: locals
            })
          );

          // support `locals.user.last_locale`
          // (e.g. for <https://lad.js.org>)
          if (isObject(locals.user) && isString(locals.user.last_locale))
            locals.locale = locals.user.last_locale;

          if (isString(locals.locale)) i18n.setLocale(locals.locale);
        }

        if (!message.subject && template)
          message.subject = await this.config.render(
            `${template}/subject`,
            Object.assign({}, locals, { pretty: false })
          );

        if (!message.html && template)
          message.html = await this.config.render(`${template}/html`, locals);

        if (!this.config.htmlToText && !message.text && template)
          message.text = await this.config.render(
            `${template}/text`,
            Object.assign({}, locals, { pretty: false })
          );
        else if (this.config.htmlToText && message.html)
          // we'd use nodemailer-html-to-text plugin
          // but we really don't need to support cid
          // <https://github.com/andris9/nodemailer-html-to-text>
          message.text = htmlToText.fromString(
            message.html,
            this.config.htmlToText
          );

        // transform the html with juice using remote paths
        // google now supports media queries
        // https://developers.google.com/gmail/design/reference/supported_css
        if (this.config.juice && message.html)
          message.html = await juiceResources(
            message.html,
            this.config.juiceResources
          );

        // TODO: rewrite this so we have a npm package doing this
        // <https://github.com/ryanb/letter_opener/blob/master/lib/letter_opener/templates/default.html.erb>
        // <https://github.com/jugglinmike/srcdoc-polyfill>
        // <https://github.com/davidcornu/mail-preview>
        if (this.config.open && message.html) {
          debug('opening in browser');
          const id = uuid.v4();
          const tmpHtmlPath = `${os.tmpdir()}/${id}.html`;
          await fs.writeFile(tmpHtmlPath, message.html);
          await opn(tmpHtmlPath, { wait: false });
          if (message.text) {
            const tmpTxtPath = `${os.tmpdir()}/${id}.txt`;
            await fs.writeFile(tmpTxtPath, message.text);
            await opn(tmpTxtPath, { wait: false });
          }
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
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Email;
