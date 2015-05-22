[antoinepairet]: https://github.com/antoinepairet
[jasonsims]: https://github.com/jasonsims
[nicjansma]: https://github.com/nicjansma
[miguelmota]: https://github.com/miguelmota
[vekexasia]: https://github.com/vekexasia
[nikuph]: https://github.com/nikuph
[jonkemp]: https://github.com/jonkemp
[jscharlach]: https://github.com/jscharlach
[skimmmer]: https://github.com/skimmmer
[jksdua]: https://github.com/jksdua
[DesignByOnyx]: https://github.com/DesignByOnyx
[anotherjazz]: https://github.com/anotherjazz
[jeduan]: https://github.com/jeduan
[kingcody]: https://github.com/kingcody
[remicastaing]: https://github.com/remicastaing

## 1.3.0 (2015-05-22)
* development: [@andybrown](https://github.com/astephenb) Supports node-sass 3.0

## 1.2.1 (2015-03-18)
* enhancement: [@kingcody][kingcody] Supports less 2.0
* enhancement: [@remicastaing][remicastaing] Allow using import in scss files
* enhancement: [@kewisch][kewisch] Allow passing options to juice

## 1.2.0 (2015-02-17)
* enhancement: [@jeduan][jeduan] Migrates back to Juice to support Node.js 0.12
* enhancement: [@jeduan][jeduan] Uses consolidate.js
* enhancement: [@gierschv][gierschv] Uses node-sass 2.0

## 1.1.0 (2014-07-05)
* enhancement: [@DesignByOnyx][DesignByOnyx]: Add support for filename prefix
* enhancement: [@skimmmer][skimmmer]: Add dust-linkedin template engine
* enhancement: [@anotherjazz][anotherjazz]: Add emblem template engine
* development: [@jksdua][jksdua]: Update node-sass version

## 1.0.0 (2014-05-27)
* bugfix: [@jscharlach][jscharlach]: Fix template scope issues
* development: [@jasonsims][jasonsims]: Update all project dependencies
* development: [@jasonsims][jasonsims]: Drop support for node v0.8.x
* development: [@jonkemp][jonkemp]: Switch to Juice2

## 0.1.8 (2014-04-03)
* enhancement: [@nikuph][nikuph]: Add support for LESS @import statement
* development: [@jasonsims][jasonsims]: Add test coverage for LESS @import

## 0.1.7 (2014-03-24)
* enhancement: [@antoinepairet][antoinepairet]: Add support for `.scss` file extension
* development: Moved changelog to CHANGELOG.md
* development: [@jasonsims][jasonsims]: Added [TravisCI][travisci] integration
[travisci]: https://travis-ci.org/niftylettuce/node-email-templates

## 0.1.6 (2014-03-14)
* development: [@jasonsims][jasonsims]: Deprecated windows branch and module

## 0.1.5 (2014-03-13)
* bugfix: [@miguelmota][miguelmota]: Batch templateName issue

## 0.1.4 (2014-03-10)
* bugfix: Misc bugfixes to main
* development: [@jasonsims][jasonsims]: Abstracted templateManager
* development: [@jasonsims][jasonsims]: Added integration tests
* development: [@jasonsims][jasonsims]: Added unit tests

## 0.1.3 (2014-03-03)
* enhancement: [@jasonsims][jasonsims]: Added support for various CSS pre-processors

## 0.1.2 (2014-02-22)
* enhancement: [@jasonsims][jasonsims]: Added support for multiple HTML template engines

## 0.1.1 (2013-12-14)
* bugfix: Long path issue for Windows

## 0.1.0 (2013-04-16)
* bugfix: Batch documentation issue

## 0.0.9
* bugfix: Juice dependency issue

## 0.0.8 (2013-03-03)
* enhancement: Minor updates

## 0.0.7
* enhancement: [@nicjansma][nicjansma]: Added support for ejs's include directive

## 0.0.6 (2012-11-01)
* bugfix: [@vekexasia][vekexasia]: Fixed batch problem (...has no method slice)

## 0.0.5 (2012-09-12)
* enhancement: Added support for an optional zlib compression type. You can
  now return compressed html/text buffer for db storage

  ```javascript
  template('newsletter', locals, 'deflateRaw', function(err, html, text) {
    // The `html` and `text` are buffers compressed using zlib.deflateRaw
    // <http://nodejs.org/docs/latest/api/zlib.html#zlib_zlib_deflateraw_buf_callback>
    // **NOTE**: You could also pass 'deflate' or 'gzip' if necessary, and it works with batch rendering as well
  })
  ```

## 0.0.4
* enhancement: Removed requirement for style.css and text.ejs files with
  compatibility in node v0.6.x to v0.8.x. It now utilizes path.exists instead
  of fs.exists respectively.
