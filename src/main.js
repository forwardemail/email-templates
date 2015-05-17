import {ensureDirectory} from './util'
import _ from 'lodash'
import EmailTemplate from './email-template'
import Debug from 'debug'
import {basename} from 'path'

const debug = Debug('email-templates:creator')

export default function (templateDirectory, defaults, done) {
  if (_.isFunction(defaults)) {
    done = defaults
    defaults = {}
  }

  return ensureDirectory(templateDirectory)
  .then(() => {
    debug('Creating Email Templates in %s', basename(templateDirectory))
    return function (directory, locals, callback) {
      locals = _.defaults(locals, defaults)
      if (directory == null) {
        return callback(new Error('templateName was not defined'))
      }
      return new EmailTemplate(`${templateDirectory}/${directory}`, locals, callback)
    }
  })
  .catch((err) => {
    if (err instanceof TypeError && err.message === 'path must be a string') {
      throw new Error('templateDirectory is undefined')
    }
    throw err
  })
  .nodeify(done)
}
