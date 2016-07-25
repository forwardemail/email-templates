/* global describe it beforeEach afterEach */
import EmailTemplate from '../src/email-template'
var expect = require('chai').expect
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')
var templatePath = path.join(__dirname, '..', '.test-templates', 'test-template')
var sassPath = path.join(__dirname, '..', '.test-templates', '.sass-files')
var P = require('bluebird')

describe('EmailTemplate', function () {
  // Setup test environment.
  beforeEach(function (done) {
    // Setup the template directory structure.
    mkdirp(templatePath, done)
  })

  afterEach(function (done) {
    // Destroy the template directory structure.
    rimraf(templatePath, done)
  })

  describe('should render', function () {
    it('html file', function (done) {
      var html = '<h4><%= item%></h4>'
      fs.writeFileSync(path.join(templatePath, 'html.ejs'), html)

      var et = new EmailTemplate(templatePath)
      et.renderHtml({item: 'test'}, function (err, html) {
        expect(err).to.be.null
        expect(html).to.equal('<h4>test</h4>')
        done()
      })
    })

    it('html file with promises', function (done) {
      var html = '<h4><%= item%></h4>'
      fs.writeFileSync(path.join(templatePath, 'html.ejs'), html)

      var et = new EmailTemplate(templatePath)
      return et.renderHtml({item: 'test'})
      .then(function (html) {
        expect(html).to.equal('<h4>test</h4>')
        done()
      })
    })

    it('html file with localization', function (done) {
      var localeFolder = path.join(templatePath, 'pt-br')
      mkdirp(localeFolder, function () {
        var html = '<h4>Titulo: <%= item%></h4>'
        fs.writeFileSync(path.join(localeFolder, 'html.ejs'), html)

        var et = new EmailTemplate(templatePath)
        et.renderHtml({item: 'test'}, 'pt-br', function (err, html) {
          expect(err).to.be.null
          expect(html).to.equal('<h4>Titulo: test</h4>')
          done()
        })
      })
    })

    it('text file', function (done) {
      var html = '<h4><%= item%></h4>'
      var text = '<%= item%>'
      fs.writeFileSync(path.join(templatePath, 'html.ejs'), html)
      fs.writeFileSync(path.join(templatePath, 'text.ejs'), text)

      var et = new EmailTemplate(templatePath)
      et.renderText({item: 'test'}, function (err, text) {
        expect(err).to.be.null
        expect(text).to.equal('test')
        done()
      })
    })

    it('text file with promises', function (done) {
      var html = '<h4><%= item%></h4>'
      var text = '<%= item%>'
      fs.writeFileSync(path.join(templatePath, 'html.ejs'), html)
      fs.writeFileSync(path.join(templatePath, 'text.ejs'), text)

      var et = new EmailTemplate(templatePath)
      return et.renderText({item: 'test'})
      .then(function (text) {
        expect(text).to.equal('test')
        done()
      })
    })

    it('text file with localization', function (done) {
      var localeFolder = path.join(templatePath, 'pt-br')
      mkdirp(localeFolder, function () {
        var html = '<h4>Titulo: <%= item%></h4>'
        var text = '<%= item%>'
        fs.writeFileSync(path.join(localeFolder, 'html.ejs'), html)
        fs.writeFileSync(path.join(localeFolder, 'text.ejs'), text)

        var et = new EmailTemplate(templatePath)
        et.renderText({item: 'test'}, 'pt-br')
        .then(function (text) {
          expect(text).to.equal('test')
          done()
        })
      })
    })

    it('batch templates', function (done) {
      var html = '<h4><%= name%>(<%= screenName %>)</h4>'
      var text = '<%= screenName%>'
      var css = 'h4 { color: #ccc }'
      fs.writeFileSync(path.join(templatePath, 'html.ejs'), html)
      fs.writeFileSync(path.join(templatePath, 'text.ejs'), text)
      fs.writeFileSync(path.join(templatePath, 'style.ejs'), css)

      var data = [
        {name: 'Nick', screenName: 'niftylettuce'},
        {name: 'Jeduan', screenName: 'jeduan'}
      ]

      var et = new EmailTemplate(templatePath)
      return P.map(data, function (item) {
        return et.render(item)
      })
      .then(function (emails) {
        expect(emails[0].html).to.equal('<h4 style=\"color: #ccc;\">Nick(niftylettuce)</h4>')
        expect(emails[0].text).to.equal('niftylettuce')
        expect(emails[1].html).to.equal('<h4 style=\"color: #ccc;\">Jeduan(jeduan)</h4>')
        expect(emails[1].text).to.equal('jeduan')
        done()
      })
    })

    it('batch localized templates', function (done) {
      var localeFolder = path.join(templatePath, 'pt-br')
      mkdirp(localeFolder, function () {
        var html = '<h4>l<%= name%>(<%= screenName %>)</h4>'
        var text = 'l<%= screenName%>'
        var css = 'h4 { color: #ddd }'
        fs.writeFileSync(path.join(localeFolder, 'html.ejs'), html)
        fs.writeFileSync(path.join(localeFolder, 'text.ejs'), text)
        fs.writeFileSync(path.join(localeFolder, 'style.ejs'), css)

        var data = [
          {name: 'Nick', screenName: 'niftylettuce'},
          {name: 'Jeduan', screenName: 'jeduan'}
        ]

        var et = new EmailTemplate(localeFolder)
        return P.map(data, function (item) {
          return et.render(item)
        })
        .then(function (emails) {
          expect(emails[0].html).to.equal('<h4 style=\"color: #ddd;\">lNick(niftylettuce)</h4>')
          expect(emails[0].text).to.equal('lniftylettuce')
          expect(emails[1].html).to.equal('<h4 style=\"color: #ddd;\">lJeduan(jeduan)</h4>')
          expect(emails[1].text).to.equal('ljeduan')
          done()
        })
      })
    })

    it('html with style element and juiceOptions', function (done) {
      var html = '<style> h4 { color: red; }</style><h4><%= item %></h4>'
      var css = 'h4 { color: blue; }'

      fs.writeFileSync(path.join(templatePath, 'html.ejs'), html)
      fs.writeFileSync(path.join(templatePath, 'style.ejs'), css)

      var et = new EmailTemplate(templatePath, {
        juiceOptions: { removeStyleTags: false }
      })

      et.render({ item: 'test' })
      .then(function (results) {
        expect(results.html).to.equal(
          '<style> h4 { color: red; }</style><h4 style=\"color: blue;\">test</h4>')
        done()
      })
      .catch(done)
    })

    it('skip inlining if disableJuice is set to true', function (done) {
      var html = '<style> h4 { color: red; }</style><h4><%= item %></h4>'
      var css = 'h4 { color: blue; }'

      fs.writeFileSync(path.join(templatePath, 'html.ejs'), html)
      fs.writeFileSync(path.join(templatePath, 'style.ejs'), css)

      var et = new EmailTemplate(templatePath, {
        disableJuice: true
      })

      et.render({ item: 'test' })
      .then(function (results) {
        expect(results.html).to.equal(
          '<style> h4 { color: red; }</style><h4>test</h4>')
        done()
      })
      .catch(done)
    })

    it('render calls should not mutate view data', function (done) {
      var html = '<style> h4 { color: red; }</style><h4><%= item %></h4>'
      var css = 'h4 { color: blue; }'

      fs.writeFileSync(path.join(templatePath, 'html.ejs'), html)
      fs.writeFileSync(path.join(templatePath, 'style.ejs'), css)

      var et = new EmailTemplate(templatePath)
      var locals = { item: 'test' }
      et.render(locals)
      .then(function (results) {
        expect(locals).to.eql({ item: 'test' })
        done()
      })
      .catch(done)
    })

    describe('when include sass from another directory', function () {
      beforeEach(function (done) {
        // Setup the sass directory structure.
        mkdirp(sassPath, done)
      })

      afterEach(function (done) {
        // Destroy the sass directory structure.
        rimraf(sassPath, done)
      })

      it('html with the included sass directory', function (done) {
        var html = '<h4><%= item %></h4>'
        var includeCss = 'h4 { color: red; }'
        var css = '@import "includes.scss"'

        fs.writeFileSync(path.join(templatePath, 'html.ejs'), html)
        fs.writeFileSync(path.join(sassPath, 'includes.scss'), includeCss)
        fs.writeFileSync(path.join(templatePath, 'style.scss'), css)

        var et = new EmailTemplate(templatePath, {
          sassOptions: { includePaths: [sassPath] }
        })

        et.render({ item: 'test' })
        .then(function (results) {
          expect(results.html).to.equal(
            '<h4 style=\"color: red;\">test</h4>')
          done()
        })
        .catch(done)
      })
    })

    it('should reject if the style can’t be compiled', function (done) {
      var html = '<h4><%= item %></h4>'
      var css = 'h4 { <%=color: blue; }'

      fs.writeFileSync(path.join(templatePath, 'html.ejs'), html)
      fs.writeFileSync(path.join(templatePath, 'style.ejs'), css)

      var et = new EmailTemplate(templatePath, {
        juiceOptions: { removeStyleTags: false }
      })

      et.render({ item: 'test' })
      .then(function (results) {
        done(new Error('Should not be reached'))
      }, function () {
        done()
      })
    })
  })
})
