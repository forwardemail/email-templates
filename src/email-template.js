import P from 'bluebird'
import Debug from 'debug'
import {basename} from 'path'
import juice from 'juice'
import {isFunction} from 'lodash'
import {ensureDirectory, readContents, renderFile} from './util'

const debug = Debug('email-templates:email-template')

export default class EmailTemplate {
  constructor (path, options) {
    this.files = {}
    this.path = path
    this.dirname = basename(path)
    debug('Creating Email template for path %s', basename(path))
  }

  init (callback) {
    return ensureDirectory(this.path)
    .then(() => this.loadTemplate())
    .nodeify(callback)
  }

  loadTemplate () {
    return P.map(['html', 'text', 'style'], (type) => {
      return readContents(this.path, type)
    })
    .then((files) => {
      let [html, text, style] = files
      if (!html) {
        let err = new Error(`HTML file not found or empty in path ${this.dirname}`)
        err.code = 'ENOENT'
        throw err
      }
      this.files.html = html
      debug('Found HTML file %s in %s', basename(html.filename), this.dirname)

      if (text) {
        debug('Found text %s file in %s', basename(text.filename), this.dirname)
      }
      this.files.text = text

      if (style) {
        debug('Found stylesheet %s in %s', basename(style.filename), this.dirname)
      }
      this.files.style = style

      debug('Finished loading template')
    })
  }

  renderText (locals, callback) {
    debug('Rendering text')
    if (!this.files.text) return Promise.resolve(null)
    return renderFile(this.files.text, locals)
    .tap(() => debug('Finished rendering text'))
    .nodeify(callback)
  }

  renderHtml (locals, callback) {
    debug('Rendering HTML')
    return renderFile(this.files.html, locals)
    .then((html) => {
      return this.renderStyle(locals)
      .then((style) => {
        if (!style) return html
        let juiceOptions = {
          extraCss: style
        }
        if (locals.juiceOptions) {
          debug('Using juice options ', locals.juiceOptions)
          juiceOptions = locals.juiceOptions || {}
          juiceOptions.extraCss = (locals.juiceOptions.extraCss || '') + style
        }
        return juice(html, juiceOptions)
      })
    })
    .tap(() => debug('Finished rendering HTML'))
    .nodeify(callback)
  }

  render (locals, callback) {
    if (isFunction(locals)) {
      callback = locals
      locals = {}
    }
    debug('Rendering template with locals %j', locals)

    return P.all([
      this.renderHtml(locals),
      this.renderText(locals)
    ])
    .then((rendered) => {
      let [html, text] = rendered
      return {
        html, text
      }
    })
    .nodeify(callback)
  }

  renderStyle (locals, callback) {
    return new P((resolve) => {
      // cached
      if (this.style !== undefined) return resolve(this.style)

      // no style
      if (!this.files.style) return resolve(null)

      debug('Rendering stylesheet')
      renderFile(this.files.style, locals)
      .then((style) => {
        this.style = style
        debug('Finished rendering stylesheet')
        resolve(style)
      })
    })
    .nodeify(callback)
  }
}
