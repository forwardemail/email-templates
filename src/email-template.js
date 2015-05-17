import P from 'bluebird'
import Debug from 'debug'
import {basename} from 'path'
import _ from 'lodash'
import juice from 'juice'
import tm from './template-manager'
import {ensureDirectory, readContents} from './util'

const debug = Debug('email-templates:email-template')

export default class EmailTemplate {
  constructor (path, options, callback) {
    if (_.isFunction(options)) {
      callback = options
      options = {}
    }

    this.files = {}
    this.path = path
    this.dirname = basename(path)
    this.options = options || {}
    debug('Creating Email template for path %s', basename(path))

    return ensureDirectory(path)
    .then(() => this.readFileContents())
    .then(() => this.renderFiles())
    .then(() => {
      // Backwards compatibility
      if (_.isFunction(callback)) {
        return callback(null, this.html, this.text)
      }
      return {
        html: this.html,
        text: this.text
      }
    })
    .catch((err) => {
      console.error(err.stack)
      if (callback) callback(err)
    })
  }

  readFileContents () {
    return P.map(['html', 'text', 'style'], (type) => {
      return readContents(this.path, type)
    })
    .then((files) => {
      let [html, text, style] = files
      if (!html) {
        throw new Error(`HTML file not found in path ${this.dirname}`)
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
    })
  }

  renderFiles () {
    return P.map(['html', 'text', 'style'], (type) => this.renderFile(this.files[type]))
    .then((files) => {
      debug(files)
      let [html, text, stylesheet] = files
      this.html = html
      this.text = text
      if (!stylesheet) return

      let juiceOptions = {
        extraCss: stylesheet
      }
      if (this.options.juiceOptions) {
        debug('Using juice options ', this.options.juiceOptions)
        juiceOptions = this.options.juiceOptions || {}
        juiceOptions.extraCss = (this.options.juiceOptions.extraCss || '') + stylesheet
      }
      this.html = juice(html, juiceOptions)
    })
  }

  renderFile (file) {
    if (!file) return
    return tm.render(file.filename, file.content, this.options)
  }
}
