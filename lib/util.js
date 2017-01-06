'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ensureDirectory = ensureDirectory;
exports.resolveTPLFolder = resolveTPLFolder;
exports.getRootTemplateFolder = getRootTemplateFolder;
exports.getLocalizedETF = getLocalizedETF;
exports.readContents = readContents;
exports.renderFile = renderFile;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require('fs');

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _templateManager = require('./template-manager');

var _path = require('path');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var readFileP = _bluebird2.default.promisify(_fs.readFile);
var globP = _bluebird2.default.promisify(_glob2.default);

function ensureDirectory(path, callback) {
  return new _bluebird2.default(function (resolve, reject) {
    (0, _fs.stat)(path, function (err, stat) {
      if (err) return reject(err);
      if (!stat.isDirectory()) return reject();
      resolve();
    });
  }).nodeify(callback);
}

/**
 * Return the localized email tempalte folder or default email template folder
 *
 * @param  {String}   locale locale or null for get email without locale
 * @param  {Function} cb     callback how run with: error, folder
 * @return {Object} promisse
 */
function resolveTPLFolder(path, locale, callback) {
  return new _bluebird2.default(function (resolve, reject) {
    getLocalizedETF(path, locale, function (err, tpl) {
      if (err) return reject(err);
      if (tpl) return resolve(tpl);

      getRootTemplateFolder(path, function (err, tpl) {
        if (err) return reject(err);
        resolve(tpl);
      });
    });
  }).nodeify(callback);
}

/**
 * Get email template folder, this is the default folder with out localizations
 *
 * @param  {Function} done callback run with error,folder
 */
function getRootTemplateFolder(templatePath, done) {
  (0, _fs.stat)(templatePath, function afterCheckIfFolderExists(err) {
    if (err) return done(err);
    done(null, templatePath);
  });
}

/**
 * Get localized email template folder
 *
 * @param  {String}   locale
 * @param  {Function} done   callback run with error,folder
 */
function getLocalizedETF(templatePath, locale, done) {
  if (!locale || locale === 'en-us') return done();

  var p = (0, _path.join)(templatePath, locale);
  (0, _fs.stat)(p, function afterCheckIfFolderExists(err) {
    if (err) {
      if (err.code === 'ENOENT') return done(); // not found
      return done(err); // unknow error
    }
    done(null, p);
  });
}

function readContents(path, type) {
  return globP(path + '/*' + type + '.*').then(function (files) {
    if (!files.length) return null;

    return readFileP(files[0], 'utf8').then(function (content) {
      if (!content.length) return null;
      return {
        filename: files[0],
        content: content
      };
    });
  });
}

function renderFile(file, options) {
  if (!file) return _bluebird2.default.resolve(null);
  return (0, _templateManager.render)(file, options);
}