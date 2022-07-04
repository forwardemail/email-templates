const path = require('path');
const fs = require('fs');
const test = require('ava');
const nodemailer = require('nodemailer');
const cheerio = require('cheerio');
const _ = require('lodash');

const Email = require('..');

const root = path.join(__dirname, 'fixtures', 'emails');

test('deep merges config', (t) => {
  const email = new Email({
    transport: { jsonTransport: true },
    juiceResources: {
      preserveImportant: false,
      webResources: {
        images: false
      }
    }
  });
  t.is(
    email.config.juiceResources.webResources.relativeTo,
    path.resolve('build')
  );
});

test('returns itself without transport', (t) => {
  t.true(new Email() instanceof Email);
});

test('inline css with juice using render without transport', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const html = await email.render('test/html', {
    name: 'test'
  });
  const $ = cheerio.load(html);
  const color = $('p').css('color');
  t.is(color, 'red');
});

test('returns itself', (t) => {
  t.true(
    new Email({
      transport: {
        jsonTransport: true
      }
    }) instanceof Email
  );
});

test('allows custom nodemailer transport instances', (t) => {
  t.true(
    new Email({
      transport: nodemailer.createTransport({
        jsonTransport: true
      })
    }) instanceof Email
  );
});

test('send email', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'test+to@gmail.com',
      cc: 'test+cc@gmail.com',
      bcc: 'test+bcc@gmail.com'
    },
    locals: { name: 'test' }
  });
  t.true(_.isObject(res));
  const message = JSON.parse(res.message);
  t.true(_.has(message, 'html'));
  t.regex(message.html, /This is just a html test/);
  t.true(_.has(message, 'text'));
  t.regex(message.text, /This is just a text test/);
});

test('throws with non-existing absolute template path', async (t) => {
  const email = new Email({
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const nonExistingAbsolutePath = path.join(
    __dirname,
    'fixtures',
    'emails',
    'tests'
  );
  const error = await t.throwsAsync(email.render(nonExistingAbsolutePath));
  t.regex(error.message, /no such file or directory/);
});

test('sends with absolute template path', async (t) => {
  const email = new Email({
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const absolutePath = path.join(__dirname, 'fixtures', 'emails', 'test');
  const res = await email.send({ template: absolutePath });
  t.true(_.isObject(res));
  const message = JSON.parse(res.message);
  t.true(_.has(message, 'html'));
  t.regex(message.html, /This is just a html test/);
  t.true(_.has(message, 'text'));
  t.regex(message.text, /This is just a text test/);
});

test('send email with ejs template', async (t) => {
  const email = new Email({
    views: { root, options: { extension: 'ejs' } },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const res = await email.send({
    template: 'test-ejs',
    message: {
      to: 'test+to@gmail.com',
      cc: 'test+cc@gmail.com',
      bcc: 'test+bcc@gmail.com'
    },
    locals: { name: 'test' }
  });
  t.true(_.isObject(res));
  const message = JSON.parse(res.message);
  t.is(message.subject, 'Test email for test');
  t.regex(message.html, /This is just a html test/);
  t.regex(message.text, /This is just a text test/);
});

test('send email with subject prefix', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    subjectPrefix: 'SUBJECTPREFIX ',
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'test+to@gmail.com',
      cc: 'test+cc@gmail.com',
      bcc: 'test+bcc@gmail.com'
    },
    locals: { name: 'test' }
  });
  t.true(_.isObject(res));
  const message = JSON.parse(res.message);
  t.is(message.subject, 'SUBJECTPREFIX Test email for test');
});

test('send two emails with two different locals', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  let res = await email.send({
    template: 'test',
    message: {
      to: 'test+to@gmail.com',
      cc: 'test+cc@gmail.com',
      bcc: 'test+bcc@gmail.com'
    },
    locals: { name: 'test1' }
  });
  res.message = JSON.parse(res.message);
  t.is(res.message.subject, 'Test email for test1');
  res = await email.send({
    template: 'test',
    message: {
      to: 'test+to@gmail.com',
      cc: 'test+cc@gmail.com',
      bcc: 'test+bcc@gmail.com'
    },
    locals: { name: 'test2' }
  });
  res.message = JSON.parse(res.message);
  t.is(res.message.subject, 'Test email for test2');
  t.pass();
});

test('send email with attachment', async (t) => {
  const filePath = path.join(__dirname, 'fixtures', 'filename.png');
  const email = new Email({
    views: { root },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const attachments = [
    {
      filename: 'filename.png',
      path: filePath,
      content: fs.createReadStream(filePath),
      cid: 'EmbeddedImageCid'
    }
  ];
  const res = await email.send({
    message: {
      from: 'test+from@gmail.com',
      attachments
    }
  });
  t.true(Array.isArray(JSON.parse(res.message).attachments));
});

test('send email with locals.user.last_locale', async (t) => {
  const email = new Email({
    views: { root },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    },
    i18n: {}
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'test+to@gmail.com'
    },
    locals: {
      name: 'test',
      user: {
        last_locale: 'en'
      }
    }
  });
  t.true(_.isObject(res));
});

test('send email with locals.locale', async (t) => {
  const email = new Email({
    views: { root },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    },
    i18n: {}
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'test+to@gmail.com'
    },
    locals: {
      name: 'test',
      locale: 'en'
    }
  });
  t.true(_.isObject(res));
});

test('does not throw error with missing transport option (#293)', async (t) => {
  const email = new Email({
    views: { root },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  await t.notThrowsAsync(
    email.render('test/html', {
      name: 'test'
    })
  );
});

test('throws error with missing template on render call', async (t) => {
  const email = new Email({
    views: { root },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const error = await t.throwsAsync(
    email.render('missing', {
      name: 'test'
    })
  );
  t.regex(error.message, /no such file or directory/);
});

test('send mail with custom render function and no templates', async (t) => {
  const email = new Email({
    render(view) {
      let res;
      if (view === 'noFolder/subject') {
        res = 'Test subject';
      } else if (view === 'noFolder/html') {
        res = 'Test html';
      } else {
        res = '';
      }

      return Promise.resolve(email.juiceResources(res));
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const res = await email.send({
    template: 'noFolder',
    message: {
      to: 'test+to@gmail.com'
    },
    locals: {
      name: 'test',
      locale: 'en'
    }
  });
  const message = JSON.parse(res.message);
  t.true(_.isObject(res));
  t.is(message.subject, 'Test subject');
  t.is(message.html, 'Test html');
});

test('send email with html to text disabled', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    },
    htmlToText: false
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'test+to@gmail.com',
      cc: 'test+cc@gmail.com',
      bcc: 'test+bcc@gmail.com'
    },
    locals: { name: 'test' }
  });
  t.true(_.isObject(res));
  const message = JSON.parse(res.message);
  t.true(_.has(message, 'html'));
  t.regex(message.html, /This is just a html test/);
  t.true(_.has(message, 'text'));
  t.regex(message.text, /This is just a text test/);
});

test('send email with missing text template', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const res = await email.send({
    template: 'test-html-only',
    message: {
      to: 'test+to@gmail.com',
      cc: 'test+cc@gmail.com',
      bcc: 'test+bcc@gmail.com'
    },
    locals: { name: 'test' }
  });
  t.true(_.isObject(res));
  const message = JSON.parse(res.message);
  t.true(_.has(message, 'html'));
  t.regex(message.html, /This is just a html test/);
  t.true(_.has(message, 'text'));
  t.regex(message.text, /This is just a html test/);
});

test('inline css with juice using render', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const html = await email.render('test/html', {
    name: 'test'
  });
  const $ = cheerio.load(html);
  const color = $('p').css('color');
  t.is(color, 'red');
});

test('inline css with juice using send', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'test+to@gmail.com'
    },
    locals: { name: 'test' }
  });
  t.true(_.isObject(res));
  const message = JSON.parse(res.message);
  const $ = cheerio.load(message.html);
  const color = $('p').css('color');
  t.is(color, 'red');
});

test('render text.pug only if html.pug does not exist', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const res = await email.send({
    template: 'test-text-only',
    message: {
      to: 'test+to@gmail.com',
      cc: 'test+cc@gmail.com',
      bcc: 'test+bcc@gmail.com'
    },
    locals: { name: 'test' }
  });
  t.true(_.isObject(res));
  res.message = JSON.parse(res.message);
  t.true(_.isUndefined(res.message.html));
  t.is(res.message.text, 'Hi test,\nThis is just a test.');
});

test('preserve originalMessage in response object from sendMail', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const res = await email.send({
    template: 'test-text-only',
    message: {
      to: 'test+to@gmail.com',
      cc: 'test+cc@gmail.com',
      bcc: 'test+bcc@gmail.com'
    },
    locals: { name: 'test' }
  });
  t.true(_.isObject(res));
  t.true(_.isObject(res.originalMessage));
  t.true(_.isUndefined(res.originalMessage.html));
  t.is(res.originalMessage.text, 'Hi test,\nThis is just a test.');
});

test('render text-only email with `textOnly` option', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    },
    textOnly: true,
    htmlToText: false
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'test+to@gmail.com',
      cc: 'test+cc@gmail.com',
      bcc: 'test+bcc@gmail.com'
    },
    locals: { name: 'test' }
  });
  t.true(_.isObject(res));
  res.message = JSON.parse(res.message);
  t.true(_.isUndefined(res.message.html));
  t.is(res.message.text, 'Hi test,\nThis is just a text test.');
});

test('override config message via send options', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const res = await email.send({
    template: 'test',
    message: {
      from: 'test+from+via+send@gmail.com',
      to: 'test+to@gmail.com',
      cc: 'test+cc@gmail.com',
      bcc: 'test+bcc@gmail.com'
    },
    locals: { name: 'test' }
  });
  t.true(_.isObject(res));
  res.message = JSON.parse(res.message);
  t.is(res.message.from.address, 'test+from+via+send@gmail.com');
});

test('should throw an error when no tmpl passed', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const error = await t.throwsAsync(
    email.send({ message: { to: 'test+to@gmail.com' } })
  );
  t.regex(error.message, /No content was passed/);
});

test('should throw an error when tmpl dir not found', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const error = await t.throwsAsync(
    email.send({
      template: 'this-template-dir-does-not-exist',
      message: { to: 'test+to@gmail.com' }
    })
  );
  t.regex(error.message, /No content was passed/);
});

test('should throw an error when tmpl dir exists but no props', async (t) => {
  const email = new Email({
    views: { root },
    message: {
      from: 'test+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    }
  });
  const error = await t.throwsAsync(
    email.send({
      template: 'this-template-dir-is-empty',
      message: { to: 'test+to@gmail.com' }
    })
  );
  t.regex(error.message, /No content was passed/);
});
