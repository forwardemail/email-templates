import P from 'bluebird'
import Debug from 'debug'
import {basename} from 'path'
import juice from 'juice'
import isFunction from 'lodash/isFunction'
import assign from 'lodash/assign'
import {ensureDirectory, readContents, renderFile} from './util'

const debug = Debug('email-templates:email-template')

export default class EmailTemplate {
  constructor (path, options = {}) {
    this.files = {}
    this.path = path
    this.dirname = basename(path)
    this.options = options
    debug('Creating Email template for path %s', basename(path))
  }

  _init () {
    if (this.isInited) return P.resolve()

    debug('Initializing templates')
    return ensureDirectory(this.path)
    .then(() => this._loadTemplates())
    .then(() => {
      this.isInited = true
      debug('Finished initializing templates')
    })
  }

  _loadTemplates () {
    return P.map(['html', 'text', 'style', 'subject'], (type) => {
      return readContents(this.path, type)
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
      this.files.html = html

      if (text) {
        debug('Found text %s file in %s', basename(text.filename), this.dirname)
      }
      this.files.text = text

      if (style) {
        debug('Found stylesheet %s in %s', basename(style.filename), this.dirname)
      }
      this.files.style = style

      if (subject) {
        debug('Found subject %s in %s', basename(subject.filename), this.dirname)
      }
      this.files.subject = subject

      debug('Finished loading template')
    })
  }

  renderText (locals, callback) {
    debug('Rendering text')
    return this._init()
    .then(() => {
      if (!this.files.text) return null
      return renderFile(this.files.text, locals)
    })
    .tap(() => debug('Finished rendering text'))
    .nodeify(callback)
  }

  renderSubject (locals, callback) {
    debug('Rendering subject')
    return this._init()
    .then(() => {
      if (!this.files.subject) return null
      return renderFile(this.files.subject, locals)
    })
    .tap(() => debug('Finished rendering subject'))
    .nodeify(callback)
  }

  renderHtml (locals, callback) {
    debug('Rendering HTML')
    return this._init()
    .then(() => {
      return P.all([
        renderFile(this.files.html, locals),
        this._renderStyle(locals)
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

  render (locals, callback) {
    if (isFunction(locals)) {
      callback = locals
      locals = {}
    } else if (locals) {
      locals = assign({}, locals)
    }
    debug('Rendering template with locals %j', locals)

    return P.all([
      this.renderHtml(locals),
      this.renderText(locals),
      this.renderSubject(locals)
    ])
    .then((rendered) => {
      let [html, text, subject] = rendered
      return {
        html, text, subject
      }
    })
    .nodeify(callback)
  }

  _renderStyle (locals) {
    return new P((resolve) => {
      // cached
      if (this.style !== undefined) return resolve(this.style)

      // no style
      if (!this.files.style) return resolve(null)

      if (this.options.sassOptions) {
        locals = assign({}, locals, this.options.sassOptions)
      }

      debug('Rendering stylesheet')
      resolve(renderFile(this.files.style, locals)
      .then((style) => {
        this.style = style
        debug('Finished rendering stylesheet')
        return style
      }))
    })
  }
}
