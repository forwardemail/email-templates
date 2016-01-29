import P from 'bluebird'
import {readFile, stat} from 'fs'
import glob from 'glob'
import {render} from './template-manager'

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

