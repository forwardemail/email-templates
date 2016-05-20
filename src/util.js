import P from 'bluebird'
import {readFile, stat} from 'fs'
import glob from 'glob'
import {render} from './template-manager'
import {join} from 'path'

const readFileP = P.promisify(readFile)
const globP = P.promisify(glob)

export function ensureDirectory (path, callback) {
  return new P((resolve, reject) => {
    stat(path, (err, stat) => {
      if (err) return reject(err)
      if (!stat.isDirectory()) return reject()
      resolve()
    })
  })
  .nodeify(callback)
}

/**
 * Return the localized email tempalte folder or default email template folder
 *
 * @param  {String}   locale locale or null for get email without locale
 * @param  {Function} cb     callback how run with: error, folder
 * @return {Object} promisse
 */
export function resolveTPLFolder (path, locale, callback) {
  return new P((resolve, reject) => {
    getLocalizedETF(path, locale, function (err, tpl) {
      if (err) return reject(err)
      if (tpl) return resolve(tpl)

      getRootTemplateFolder(path, function (err, tpl) {
        if (err) return reject(err)
        resolve(tpl)
      })
    })
  })
  .nodeify(callback)
}

/**
 * Get email template folder, this is the default folder with out localizations
 *
 * @param  {Function} done callback run with error,folder
 */
export function getRootTemplateFolder (templatePath, done) {
  stat(templatePath, function afterCheckIfFolderExists (err) {
    if (err) return done(err)
    done(null, templatePath)
  })
}

/**
 * Get localized email template folder
 *
 * @param  {String}   locale
 * @param  {Function} done   callback run with error,folder
 */
export function getLocalizedETF (templatePath, locale, done) {
  if (!locale || (locale === 'en-us')) return done()

  var p = join(templatePath, locale)
  stat(p, function afterCheckIfFolderExists (err) {
    if (err) {
      if (err.code === 'ENOENT') return done() // not found
      return done(err) // unknow error
    }
    done(null, p)
  })
}

export function readContents (path, type) {
  return globP(`${path}/*${type}.*`)
  .then((files) => {
    if (!files.length) return null

    return readFileP(files[0], 'utf8')
    .then((content) => {
      if (!content.length) return null
      return {
        filename: files[0],
        content: content
      }
    })
  })
}

export function renderFile (file, options) {
  if (!file) return P.resolve(null)
  return render(file, options)
}

