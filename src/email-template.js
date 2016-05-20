import P from 'bluebird'
import Debug from 'debug'
import {basename} from 'path'
import juice from 'juice'
import isFunction from 'lodash/isFunction'
import assign from 'lodash/assign'
import {resolveTPLFolder, readContents, renderFile} from './util'

const debug = Debug('email-templates:email-template')

export default class EmailTemplate {
  constructor (path, options = {}) {
    this.path = path
    this.dirname = basename(path)
    this.options = options
    debug('Creating Email template for path %s', basename(path))
     // localized templates cache
    this.ltpls = {}
  }

  _init (locale) {
    if (!locale) locale = 'en-us'

    if (!this.ltpls[locale]) this.ltpls[locale] = { files: {} }

    if (this.ltpls[locale].isInited) {
      return P.resolve() // i18n cache
    }

    debug('Initializing templates')
    return resolveTPLFolder(this.path, locale)
    .then((p) => this._loadTemplates(p, locale))
    .then(() => {
      this.ltpls[locale].isInited = true
      debug('Finished initializing templates')
    })
  }

  _loadTemplates (p, locale) {
    return P.map(['html', 'text', 'style', 'subject'], (type) => {
      return readContents(p, type)
    })
    .then((files) => {
      let [html, text, style, subject] = files

      if (!html && !text) {
        let err = new Error(`Neither html nor text template files found or are both empty in path ${this.dirname}`)
        err.code = 'ENOENT'
        throw err
      }

      if (html) {
        debug('Found HTML file %s in %s', basename(html.filename), this.dirname)
      }
      this.ltpls[locale].files.html = html

      if (text) {
        debug('Found text %s file in %s', basename(text.filename), this.dirname)
      }
      this.ltpls[locale].files.text = text

      if (style) {
        debug('Found stylesheet %s in %s', basename(style.filename), this.dirname)
      }
      this.ltpls[locale].files.style = style

      if (subject) {
        debug('Found subject %s in %s', basename(subject.filename), this.dirname)
      }
      this.ltpls[locale].files.subject = subject

      debug('Finished loading template')
    })
  }

  renderText (locals, locale, callback) {
    if (!locale || (!callback && isFunction(locale))) {
      callback = locale
      locale = 'en-us'
    }

    debug('Rendering text')
    return this._init(locale)
    .then(() => {
      if (!this.ltpls[locale].files.text) return null
      return renderFile(this.ltpls[locale].files.text, locals)
    })
    .tap(() => debug('Finished rendering text'))
    .nodeify(callback)
  }

  renderSubject (locals, locale, callback) {
    if (!locale || (!callback && isFunction(locale))) {
      callback = locale // locale is optional
      locale = 'en-us'
    }

    debug('Rendering subject')
    return this._init(locale)
    .then(() => {
      if (!this.ltpls[locale].files.subject) return null
      return renderFile(this.ltpls[locale].files.subject, locals)
    })
    .tap(() => debug('Finished rendering subject'))
    .nodeify(callback)
  }

  renderHtml (locals, locale, callback) {
    if (!locale || (!callback && isFunction(locale))) {
      callback = locale // locale is optional
      locale = 'en-us'
    }

    debug('Rendering HTML')
    return this._init(locale)
    .then(() => {
      return P.all([
        renderFile(this.ltpls[locale].files.html, locals),
        this._renderStyle(locals, locale)
      ])
    })
    .then((results) => {
      let [html, style] = results
      if (!style) return html
      if (this.options.disableJuice) return html
      if (this.options.juiceOptions) {
        debug('Using juice options ', this.options.juiceOptions)
      }
      return juice.inlineContent(html, style, this.options.juiceOptions || {})
    })
    .tap(() => debug('Finished rendering HTML'))
    .nodeify(callback)
  }

  render (locals, locale, callback) {
    if (isFunction(locals)) {
      callback = locals
      locals = {}
    } else if (locals) {
      locals = assign({}, locals)
    }

    if (!callback && isFunction(locale)) {
      callback = locale // locale is optional
      locale = 'en-us'
    }

    debug('Rendering template with locals %j', locals)

    return P.all([
      this.renderHtml(locals, locale),
      this.renderText(locals, locale),
      this.renderSubject(locals, locale)
    ])
    .then((rendered) => {
      let [html, text, subject] = rendered
      return {
        html, text, subject
      }
    })
    .nodeify(callback)
  }

  _renderStyle (locals, locale) {
    return new P((resolve) => {
      // cached
      if (this.ltpls[locale].style !== undefined) {
        return resolve(this.ltpls[locale].style)
      }

      // no style
      if (!this.ltpls[locale].files.style) return resolve(null)

      if (this.options.sassOptions) {
        locals = assign({}, locals, this.options.sassOptions)
      }

      debug('Rendering stylesheet')

      resolve(renderFile(this.ltpls[locale].files.style, locals)
      .then((style) => {
        this.ltpls[locale].style = style
        debug('Finished rendering stylesheet')
        return style
      }))
    })
  }
}
