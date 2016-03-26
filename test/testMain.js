/* global describe it beforeEach afterEach */
var emailTemplates = require('../src/main')
var expect = require('chai').expect
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var templateDir = path.join(__dirname, '..', '.test-templates')
var templateName = 'test-template'
var templatePath = path.join(templateDir, templateName)

describe('Email templates', function () {
  // Setup test environment.
  beforeEach(function (done) {
    // Setup the template directory structure.
    mkdirp(templatePath, done)
  })
  afterEach(function (done) {
    // Destroy the template directory structure.
    rimraf(templatePath, done)
  })

  // Test base functionality
  describe('should render', function () {
    it('html file', function (done) {
      var html = '<h4><%= item%></h4>'
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), html)
      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text) {
          expect(err).to.be.null
          expect(text).to.not.be.ok
          expect(html).to.equal('<h4>test</h4>')
          done()
        })
      })
    })

    it('html file with custom name', function (done) {
      var html = '<h4><%= item%></h4>'
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-html.ejs'), html)
      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text) {
          expect(err).to.be.null
          expect(text).to.not.be.ok
          expect(html).to.equal('<h4>test</h4>')
          done()
        })
      })
    })

    it('html and text files', function (done) {
      var html = '<h4><%= item%></h4>'
      var text = '<%= item%>'
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'text.ejs'), text)

      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text) {
          expect(err).to.be.null
          expect(html).to.equal('<h4>test</h4>')
          expect(text).to.equal('test')
          done()
        })
      })
    })

    it('html, text, and subject files', function (done) {
      var html = '<h4><%= item%></h4>'
      var text = '<%= item%>'
      var subject = 'Hello <%= item%>'
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'text.ejs'), text)
      fs.writeFileSync(path.join(templateDir, templateName, 'subject.ejs'), subject)

      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text, subject) {
          expect(err).to.be.null
          expect(html).to.equal('<h4>test</h4>')
          expect(text).to.equal('test')
          expect(subject).to.equal('Hello test')
          done()
        })
      })
    })

    it('html and text files with custom names', function (done) {
      var html = '<h4><%= item%></h4>'
      var text = '<%= item%>'
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-text.ejs'), text)

      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text) {
          expect(err).to.be.null
          expect(html).to.equal('<h4>test</h4>')
          expect(text).to.equal('test')
          done()
        })
      })
    })

    it('html, text, and subject files with custom names', function (done) {
      var html = '<h4><%= item%></h4>'
      var text = '<%= item%>'
      var subject = 'Hello <%= item%>'
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-text.ejs'), text)
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-subject.ejs'), subject)

      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text, subject) {
          expect(err).to.be.null
          expect(html).to.equal('<h4>test</h4>')
          expect(text).to.equal('test')
          expect(subject).to.equal('Hello test')
          done()
        })
      })
    })

    it('html with style element and juiceOptions', function (done) {
      var html = '<style> h4 { color: red; }</style><h4><%= item%></h4>'
      var css = 'h4 { color: blue; }'

      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'style.ejs'), css)

      var defaults = {
        juiceOptions: { removeStyleTags: false }
      }

      emailTemplates(templateDir, defaults, function (err, template) {
        expect(err).to.be.null
        template(templateName, { item: 'test' }, function (err, html, text) {
          expect(err).to.be.null
          expect(text).to.not.be.ok
          expect(html).to.equal(
            '<style> h4 { color: red; }</style><h4 style=\"color: blue;\">test</h4>')
          done()
        })
      })
    })

    it('html with inline CSS(ejs) and text file', function (done) {
      var html = '<h4><%= item%></h4>'
      var text = '<%= item%>'
      var css = 'h4 { color: <%= color %> }'
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'text.ejs'), text)
      fs.writeFileSync(path.join(templateDir, templateName, 'style.ejs'), css)

      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test', color: '#ccc'}, function (err, html, text) {
          expect(err).to.be.null
          expect(text).to.equal('test')
          expect(html).to.equal(
            '<h4 style=\"color: #ccc;\">test</h4>')
          done()
        })
      })
    })

    it('html(jade) with inline CSS(less)', function (done) {
      var html = 'h4= item'
      var css = '@color: #cccccc; h4 { color: @color }'
      fs.writeFileSync(path.join(templateDir, templateName, 'html.jade'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'style.less'), css)

      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text) {
          expect(err).to.be.null
          expect(text).to.not.be.ok
          expect(html).to.equal(
            '<h4 style=\"color: #cccccc;\">test</h4>')
          done()
        })
      })
    })

    it('html with inline CSS and text file with custom names', function (done) {
      var html = '<h4><%= item%></h4>'
      var text = '<%= item%>'
      var css = 'h4 { color: #ccc }'
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-text.ejs'), text)
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-style.ejs'), css)

      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text) {
          expect(err).to.be.null
          expect(text).to.equal('test')
          expect(html).to.equal(
            '<h4 style=\"color: #ccc;\">test</h4>')
          done()
        })
      })
    })

    it('batch templates', function (done) {
      var html = '<h4><%= item%></h4>'
      var text = '<%= item%>'
      var css = 'h4 { color: #ccc }'
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'text.ejs'), text)
      fs.writeFileSync(path.join(templateDir, templateName, 'style.ejs'), css)

      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, true, function (err, batch) {
          expect(err).to.be.null
          expect(batch).to.be.an.instanceof(Function)
          batch({item: 'test'}, templateDir, function (err, html, text) {
            expect(err).to.be.null
            expect(text).to.equal('test')
            expect(html).to.equal(
              '<h4 style=\"color: #ccc;\">test</h4>')
            done()
          })
        })
      })
    })
  })

  // Test that error handling is working as expected.
  describe('should error', function () {
    it('if template directory was not defined', function (done) {
      var badVar
      emailTemplates(badVar, function (err, template) {
        expect(err.message).to.equal('templateDirectory is undefined')
        expect(template).to.be.undefined
        done()
      })
    })

    it('if template name was not defined', function (done) {
      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        var badVar
        template(badVar, {item: 'test'}, function (err, html, text) {
          expect(err.message).to.contain('templateName was not defined')
          expect(html).to.be.undefined
          expect(text).to.be.undefined
          done()
        })
      })
    })

    it('on misnamed html file', function (done) {
      fs.writeFileSync(path.join(templateDir, templateName, 'html-custom-filename.ejs'), '')
      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text) {
          expect(html).to.be.undefined
          expect(text).to.be.undefined
          expect(err.code).to.equal('ENOENT')
          done()
        })
      })
    })

    it('should render only text', function (done) {
      var text = '<%= item%>'
      fs.writeFileSync(path.join(templateDir, templateName, 'text.ejs'), text)

      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text) {
          expect(err).to.be.null
          expect(text).to.equal('test')
          expect(html).to.not.be.ok
          done()
        })
      })
    })

    it('on missing html and text file', function (done) {
      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text) {
          expect(err.code).to.equal('ENOENT')
          expect(html).to.be.undefined
          expect(text).to.be.undefined

          done()
        })
      })
    })

    it('on missing html, text, and subject file', function (done) {
      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text, subject) {
          expect(err.code).to.equal('ENOENT')
          expect(html).to.be.undefined
          expect(text).to.be.undefined
          expect(subject).to.be.undefined

          done()
        })
      })
    })

    it('on empty html and text file', function (done) {
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), '')
      fs.writeFileSync(path.join(templateDir, templateName, 'text.ejs'), '')

      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text) {
          expect(html).to.be.undefined
          expect(text).to.be.undefined
          expect(err.message).to.contain('both empty in path')
          done()
        })
      })
    })

    it('on empty html, text, and subject file', function (done) {
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), '')
      fs.writeFileSync(path.join(templateDir, templateName, 'text.ejs'), '')
      fs.writeFileSync(path.join(templateDir, templateName, 'subject.ejs'), '')

      emailTemplates(templateDir, function (err, template) {
        expect(err).to.be.null
        template(templateName, {item: 'test'}, function (err, html, text, subject) {
          expect(html).to.be.undefined
          expect(text).to.be.undefined
          expect(subject).to.be.undefined
          expect(err.message).to.contain('both empty in path')
          done()
        })
      })
    })
  })
})
