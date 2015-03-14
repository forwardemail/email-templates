var emailTemplates = require('../lib/main')
  , expect = require('chai').expect
  , fs = require('fs')
  , path = require('path')
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , templateDir = path.join(__dirname, '..', '.tmproj')
  , templateName = 'test-template'
  , templatePath = path.join(templateDir, templateName)

describe('Email templates', function() {
  /////////////////////////////////////////////////////////////////////////////
  // Setup test environment.
  beforeEach(function(done) {
    // Setup the template directory structure.
    mkdirp(templatePath, done)
  })
  afterEach(function(done) {
    // Destroy the template directory structure.
    rimraf(templatePath, done)
  })

  /////////////////////////////////////////////////////////////////////////////
  // Test base functionality
  describe('should render', function() {
    it('html file', function(done) {
      var html = '<h4><%= item%></h4>'
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), html)
      emailTemplates(templateDir, function(err, template) {
        template(templateName, {item: 'test'}, function(err, html, text) {
          expect(err).to.be.null
          expect(text).to.be.false
          expect(html).to.equal('<h4>test</h4>')
          done()
        })
      })
    })

    it('html file with custom name', function(done) {
      var html = '<h4><%= item%></h4>'
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-html.ejs'), html)
      emailTemplates(templateDir, function(err, template) {
        template(templateName, {item: 'test'}, function(err, html, text) {
          expect(err).to.be.null
          expect(text).to.be.false
          expect(html).to.equal('<h4>test</h4>')
          done()
        })
      })
    })

    it('html and text files', function(done) {
      var html = '<h4><%= item%></h4>'
        , text = '<%= item%>'
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'text.ejs'), text)

      emailTemplates(templateDir, function(err, template) {
        template(templateName, {item: 'test'}, function(err, html, text) {
          expect(err).to.be.null
          expect(html).to.equal('<h4>test</h4>')
          expect(text).to.equal('test')
          done()
        })
      })
    })

    it('html and text files with custom names', function(done) {
      var html = '<h4><%= item%></h4>'
        , text = '<%= item%>'
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-text.ejs'), text)

      emailTemplates(templateDir, function(err, template) {
        template(templateName, {item: 'test'}, function(err, html, text) {
          expect(err).to.be.null
          expect(html).to.equal('<h4>test</h4>')
          expect(text).to.equal('test')
          done()
        })
      })
    })

    it('html with style element and juiceOptions', function(done) {
      var html = '<style> h4 { color: red; }</style><h4><%= item%></h4>'
        , css  = 'h4 { color: blue; }';
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'style.ejs'), css)

      var defaults = {
        juiceOptions: { removeStyleTags: false }
      }

      emailTemplates(templateDir, defaults, function(err, template) {
        template(templateName, { item: 'test' }, function(err, html, text) {
          expect(err).to.be.null
          expect(text).to.be.false
          expect(html).to.equal(
            '<style> h4 { color: red; }</style><h4 style=\"color: blue;\">test</h4>')
          done()
        });
      });
    });

    it('html with inline CSS(ejs) and text file', function(done) {
      var html = '<h4><%= item%></h4>'
        , text = '<%= item%>'
        , css  = 'h4 { color: <%= color %> }'
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'text.ejs'), text)
      fs.writeFileSync(path.join(templateDir, templateName, 'style.ejs'), css)

      emailTemplates(templateDir, function(err, template) {
        template(templateName, {item: 'test', color: '#ccc'}, function(err, html, text) {
          expect(err).to.be.null
          expect(text).to.equal('test')
          expect(html).to.equal(
            '<h4 style=\"color: #ccc;\">test</h4>')
          done()
        })
      })
    })

    it('html(jade) with inline CSS(less)', function(done) {
      var html = 'h4= item'
        , text = '<%= item%>'
        , css  = '@color: #ccc; h4 { color: @color }'
      fs.writeFileSync(path.join(templateDir, templateName, 'html.jade'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'style.less'), css)

      emailTemplates(templateDir, function(err, template) {
        template(templateName, {item: 'test'}, function(err, html, text) {
          expect(err).to.be.null
          expect(text).to.equal(false)
          expect(html).to.equal(
            '<h4 style=\"color: #cccccc;\">test</h4>')
          done()
        })
      })
    })

    it('html with inline CSS and text file with custom names', function(done) {
      var html = '<h4><%= item%></h4>'
        , text = '<%= item%>'
        , css  = 'h4 { color: #ccc }'
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-text.ejs'), text)
      fs.writeFileSync(path.join(templateDir, templateName, 'custom-filename-style.ejs'), css)

      emailTemplates(templateDir, function(err, template) {
        template(templateName, {item: 'test'}, function(err, html, text) {
          expect(err).to.be.null
          expect(text).to.equal('test')
          expect(html).to.equal(
            '<h4 style=\"color: #ccc;\">test</h4>')
          done()
        })
      })
    })

    it('batch templates', function(done) {
      var html = '<h4><%= item%></h4>'
        , text = '<%= item%>'
        , css  = 'h4 { color: #ccc }'
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), html)
      fs.writeFileSync(path.join(templateDir, templateName, 'text.ejs'), text)
      fs.writeFileSync(path.join(templateDir, templateName, 'style.ejs'), css)

      emailTemplates(templateDir, function(err, template) {
        template(templateName, true, function(err, batch) {
          expect(err).to.be.null
          expect(batch).to.be.an.instanceof(Function)
          batch({item: 'test'}, templateDir, function(err, html, text) {
            expect(err).to.be.null
            expect(text).to.equal('test')
            expect(html).to.equal(
              '<h4 style=\"color: #ccc;\">test</h4>')
            done()
          })
        })
      })
    })

    it('html file with custom open and close tags', function(done) {
      var html = '<h4>{{= item }}</h4>'
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), html)
      emailTemplates(templateDir, {open: '{{', close: '}}'}, function(err, template) {
        template(templateName, {item: 'test'}, function(err, html, text) {
          expect(err).to.be.null
          expect(text).to.be.false
          expect(html).to.equal('<h4>test</h4>')
          done()
        })
      })
    })
  })

  /////////////////////////////////////////////////////////////////////////////
  // Test that error handling is working as expected.
  describe('should error', function() {
    it('if template directory was not defined', function(done) {
      var badVar;
      emailTemplates(badVar, function(err, template) {
        expect(err.message).to.equal('templateDirectory is undefined')
        expect(template).to.be.undefined
        done()
      })
    })

    it('if template name was not defined', function(done) {
      emailTemplates(templateDir, function(err, template) {
        var badVar
        template(badVar, {item: 'test'}, function(err, html, text) {
          expect(html).to.be.undefined
          expect(text).to.be.undefined
          expect(err).to.contain('templateName was not defined')
          done()
        })
      })
    })

    it('on missing html file', function(done) {
      emailTemplates(templateDir, function(err, template) {
        template(templateName, {item: 'test'}, function(err, html, text) {
          expect(html).to.be.undefined
          expect(text).to.be.undefined
          expect(err.code).to.equal('ENOENT')

          done()
        })
      })
    })

    it('on misnamed html file', function(done) {
      fs.writeFileSync(path.join(templateDir, templateName, 'html-custom-filename.ejs'), '')
      emailTemplates(templateDir, function(err, template) {
        template(templateName, {item: 'test'}, function(err, html, text) {
          expect(html).to.be.undefined
          expect(text).to.be.undefined
          expect(err.code).to.equal('ENOENT')
          done()
        })
      })
    })

    it('on empty html file', function(done) {
      fs.writeFileSync(path.join(templateDir, templateName, 'html.ejs'), '')
      emailTemplates(templateDir, function(err, template) {
        template(templateName, {item: 'test'}, function(err, html, text) {
          expect(html).to.be.undefined
          expect(text).to.be.undefined
          expect(err).to.contain('was an empty file')
          done()
        })
      })
    })
  })
})
