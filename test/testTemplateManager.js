/* global describe it beforeEach afterEach */
var tm = require('../src/template-manager')
var path = require('path')
var expect = require('chai').expect
var fs = require('fs')
var tmpDir = path.join(__dirname, '..', '.test-templates')
var tmpSassDir = path.join(__dirname, '..', '.test-sass')
var mkdirp = require('mkdirp')
var rimraf = require('rimraf')

describe('Template manager', function () {
  // Setup
  beforeEach(function (done) {
    // Setup a tmp directory for test files.
    mkdirp(tmpDir, () => {
      mkdirp(tmpSassDir, done)
    })
  })

  afterEach(function (done) {
    // Destroy all test files.
    rimraf(tmpDir, () => {
      rimraf(tmpSassDir, done)
    })
  })

  // Tests
  it('should render ejs', function (done) {
    var file = {
      filename: 'test.ejs',
      content: '<h1><%= item%> <%= engine%></h1>'
    }
    var locals = {item: 'test'}

    tm.render(file, locals, function (err, res) {
      expect(err).to.be.null
      expect(res).to.equal('<h1>test .ejs</h1>')

      done()
    })
  })

  it('should render ejs with custom opening and closing tags', function (done) {
    var file = {
      filename: 'test.ejs',
      content: '<h1><?=item?> <?=engine?></h1>'
    }
    var locals = {
      item: 'test',
      delimiter: '?'
    }

    tm.render(file, locals, function (err, res) {
      expect(err).to.be.null
      expect(res).to.equal('<h1>test .ejs</h1>')
      done()
    })
  })

  it('should render jade', function (done) {
    var file = {
      filename: 'test.jade',
      content: 'h1= item\nh1= engine'
    }
    var locals = {item: 'test'}

    tm.render(file, locals, function (err, res) {
      expect(err).to.be.null
      expect(res).to.equal('<h1>test</h1><h1>.jade</h1>')

      done()
    })
  })

  it('should render swig', function (done) {
    var file = {
      filename: 'test.swig',
      content: '<h1>{{ item }} {{ engine }}</h1>'
    }
    var locals = {item: 'test'}

    tm.render(file, locals, function (err, res) {
      expect(err).to.be.null
      expect(res).to.equal('<h1>test .swig</h1>')

      done()
    })
  })

  it('should render handlebars', function (done) {
    var file = {
      filename: 'test.handlebars',
      content: '<h1>{{ item }} {{ engine }}</h1>'
    }
    var locals = {item: 'test'}

    tm.render(file, locals, function (err, res) {
      expect(err).to.be.null
      expect(res).to.equal('<h1>test .handlebars</h1>')

      done()
    })
  })

  it('should render handlebars with helpers', function (done) {
    var file = {
      filename: 'test.hbs',
      content: '<h1>{{uppercase item}} {{engine}}</h1>'
    }
    var locals = {
      item: 'test',
      helpers: {
        uppercase: function (context) {
          return context.toUpperCase()
        }
      }
    }
    tm.render(file, locals, function (err, res) {
      if (err) console.error(err.stack)
      expect(err).to.be.null
      expect(res).to.equal('<h1>TEST .hbs</h1>')
      done()
    })
  })

  it('should render dust', function (done) {
    var file = {
      filename: 'test.dust',
      content: '<h1>{item}\n</h1><h1>{engine}</h1>'
    }
    var locals = {item: 'test'}

    tm.render(file, locals, function (err, res) {
      expect(err).to.be.null
      expect(res).to.equal('<h1>test</h1><h1>.dust</h1>')

      done()
    })
  })

  it('should render less', function (done) {
    var file = {
      filename: 'test.less',
      content: '.class{ width: (1 + 1) }'
    }
    var locals = {}

    tm.render(file, locals, function (err, res) {
      expect(err).to.be.null
      expect(res).to.equal('.class {\n  width: 2;\n}\n')

      done()
    })
  })

  it('should render less with @import statement', function (done) {
    var testMainLessFile = path.join(tmpDir, 'main.less')
    var testIncludesFile = path.join(tmpDir, 'includes.less')

    // Write out some test LESS files.
    fs.writeFileSync(testMainLessFile, '@import "includes.less";')
    fs.writeFileSync(testIncludesFile, '.body { color: #333333}')

    var file = {
      filename: testMainLessFile,
      content: fs.readFileSync(testMainLessFile).toString()
    }

    tm.render(file, {}, function (err, res) {
      expect(err).to.be.null
      expect(res).to.equal('.body {\n  color: #333333;\n}\n')

      done()
    })
  })

  it('should render stylus', function (done) {
    var file = {
      filename: 'test.stylus',
      content: 'body\n  width: 2px\n'
    }
    tm.render(file, {}, function (err, res) {
      expect(err).to.be.null
      expect(res).to.equal('body {\n  width: 2px;\n}\n')
      done()
    })
  })

  it('should render styl', function (done) {
    var file = {
      filename: 'test.styl',
      content: 'body\n  color: blue'
    }
    var locals = {whitespace: true}

    tm.render(file, locals, function (err, res) {
      expect(err).to.be.null
      expect(res).to.equal('body {\n  color: blue;\n}')
      done()
    })
  })

  it('should render sass', function (done) {
    var file = {
      filename: 'test.sass',
      content: '$gray: #ccc;body {color: $gray}'
    }

    tm.render(file, {}, function (err, res) {
      expect(err).to.be.null
      expect(res).to.equal('body {\n  color: #ccc; }\n')

      done()
    })
  })

  it('should allow a custom include path for rendering sass', function (done) {
    var testMainSassFile = path.join(tmpDir, 'main.scss')
    var testIncludesFile = path.join(tmpSassDir, 'includes.scss')

    // Write out some test SASS files.
    fs.writeFileSync(testMainSassFile, '@import "includes.scss";')
    fs.writeFileSync(testIncludesFile, 'body { color: #333}')

    var file = {
      filename: testMainSassFile,
      content: fs.readFileSync(testMainSassFile).toString()
    }

    tm.render(file, {includePaths: ['.test-sass']}, function (err, res) {
      expect(err).to.be.null
      expect(res).to.equal('body {\n  color: #333; }\n')
      done()
    })
  })

  it('should render css', function (done) {
    var file = {
      filename: 'test.css',
      content: 'body { color: #ccc; }'
    }

    tm.render(file, {}, function (err, res) {
      expect(err).to.be.null
      expect(res).to.equal('body { color: #ccc; }')

      done()
    })
  })
})
