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
    if (options === true) {
      // We are trying to load the template into memory, but not render it
      // This lets us send batches of emails using the same template
      //  and we only are loading the assets once
      this.isBatch = true
    }
    this.options = options || {}
    debug('Creating Email template for path %s', basename(path))

    return ensureDirectory(path)
    .then(() => this.readFileContents())
    .then(() => {
      if (!this.isBatch) {
        return this.renderFiles(this.options, _.isFunction(callback))
      }
      return (options, templateDir, cb) => {
        debug('rendering batch with options', options)
        return this.renderFiles(options, _.isFunction(cb))
        .tap(nodeifySuccess(cb))
        .catch(nodeifyError(cb))
      }
    })
    .tap(nodeifySuccess(callback))
    .catch(nodeifyError(callback))
  }

  readFileContents () {
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
    })
  }

  renderFiles (options, returnArray) {
    return P.map(['html', 'text', 'style'], (type) => {
      return this.renderFile(this.files[type], options)
    })
    .then((files) => {
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
    .then(() => {
      // Backwards compatibility
      if (returnArray) {
        return [this.html, this.text]
      }
      return {
        html: this.html,
        text: this.text
      }
    })
  }

  renderFile (file, options) {
    if (!file) return
    return tm.render(file.filename, file.content, options)
  }

}

function nodeifySuccess (callback) {
  return function (ret) {
    if (_.isFunction(callback)) {
      callback.apply(null, [null].concat(ret))
    }
  }
}

function nodeifyError (callback) {
  return function (err) {
    if (_.isFunction(callback)) {
      return callback(err)
    }
    throw err
  }
}
