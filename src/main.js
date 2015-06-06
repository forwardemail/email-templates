import {ensureDirectory} from './util'
import {isFunction} from 'lodash'
import EmailTemplate from './email-template'
import Debug from 'debug'
import {basename} from 'path'
import {requires} from 'consolidate'

const debug = Debug('email-templates:creator')

function exportable (templateDirectory, options, done) {
  if (isFunction(options)) {
    done = options
    options = {}
  }
  if (!templateDirectory) {
    return done(new Error('templateDirectory is undefined'))
  }

  return ensureDirectory(templateDirectory, function (err) {
    if (err) return done(err)
    debug('Creating Email Templates in %s', basename(templateDirectory))
    return done(null, template(templateDirectory, options))
  })
}

function template (templateDirectory, options) {
  return function _template (directory, locals, callback) {
    if (isFunction(locals)) {
      callback = locals
      locals = {}
    }
    if (directory == null) {
      return callback(new Error('templateName was not defined'))
    }

    var et = new EmailTemplate(`${templateDirectory}/${directory}`, options)
    if (locals === true) {
      return callback(null, function (locals, dir, next) {
        et.render(locals, function (err, result) {
          result = result || {}
          next(err, result.html, result.text)
        })
      })
    }

    et.render(locals, function (err, result) {
      result = result || {}
      callback(err, result.html, result.text)
    })
  }
}

exportable.EmailTemplate = EmailTemplate
exportable.requires = requires

export default exportable
