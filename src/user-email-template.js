import P from 'bluebird'
import Debug from 'debug'
import juice from 'juice'
import isFunction from 'lodash/isFunction'
import assign from 'lodash/assign'
import {renderUserFile} from './util'

const debug = Debug('email-templates:email-template')

export default class UserEmailTemplate {
  constructor (templates, options = {}) {
    this.options = options
    debug('Creating Email template %s', templates.name)
    // localized templates cache
    this.ltpls = templates.locales
  }

  _init (locale) {
    return P.resolve() // i18n cache
  }

  renderText (locals, locale, callback) {
    if (!locale || (!callback && isFunction(locale))) {
      callback = locale
      locale = 'en-us'
    }

    debug('Rendering text')
    return this._init(locale)
    .then(() => {
      if (!this.ltpls[locale].text) return null
      return renderUserFile(this.ltpls[locale].text, locals)
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
      if (!this.ltpls[locale].subject) return null
      return renderUserFile(this.ltpls[locale].subject, locals)
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
        renderUserFile(this.ltpls[locale].html, locals),
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
      if (this.ltpls[locale].compiledStyle !== undefined) {
        return resolve(this.ltpls[locale].compiledStyle)
      }

      // no style
      if (!this.ltpls[locale].style) return resolve(null)

      if (this.options.sassOptions) {
        locals = assign({}, locals, this.options.sassOptions)
      }

      debug('Rendering stylesheet')

      resolve(renderUserFile(this.ltpls[locale].style, locals)
      .then((style) => {
        this.ltpls[locale].compiledStyle = style
        debug('Finished rendering stylesheet')
        return style
      }))
    })
  }
}
