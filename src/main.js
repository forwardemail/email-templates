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
      return new EmailTemplate(`${templateDirectory}/${directory}`, locals, callback)
    }
  })
  .nodeify(done)
}
