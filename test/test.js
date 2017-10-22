const path = require('path');
const fs = require('fs');
const test = require('ava');
const nodemailer = require('nodemailer');
const cheerio = require('cheerio');

const Email = require('../lib');

const root = path.join(__dirname, 'fixtures', 'emails');

test('deep merges config', t => {
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

test('throws error without transport', t => {
  const error = t.throws(() => new Email());
  t.is(
    error.message,
    'Transport option must be a transport instance or configuration object'
  );
});

test('returns itself', t => {
  t.true(
    new Email({
      transport: {
        jsonTransport: true
      }
    }) instanceof Email
  );
});

test('allows custom nodemailer transport instances', t => {
  t.true(
    new Email({
      transport: nodemailer.createTransport({
        jsonTransport: true
      })
    }) instanceof Email
  );
});

test('send email', async t => {
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
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
      to: 'niftylettuce+to@gmail.com',
      cc: 'niftylettuce+cc@gmail.com',
      bcc: 'niftylettuce+bcc@gmail.com'
    },
    locals: { name: 'niftylettuce' }
  });
  t.true(typeof res === 'object');
});

test('send two emails with two different locals', async t => {
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
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
      to: 'niftylettuce+to@gmail.com',
      cc: 'niftylettuce+cc@gmail.com',
      bcc: 'niftylettuce+bcc@gmail.com'
    },
    locals: { name: 'niftylettuce1' }
  });
  res.message = JSON.parse(res.message);
  t.is(res.message.subject, 'Test email for niftylettuce1');
  res = await email.send({
    template: 'test',
    message: {
      to: 'niftylettuce+to@gmail.com',
      cc: 'niftylettuce+cc@gmail.com',
      bcc: 'niftylettuce+bcc@gmail.com'
    },
    locals: { name: 'niftylettuce2' }
  });
  res.message = JSON.parse(res.message);
  t.is(res.message.subject, 'Test email for niftylettuce2');
  t.pass();
});

test('send email with attachment', async t => {
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
      from: 'niftylettuce+from@gmail.com',
      attachments
    }
  });
  t.true(Array.isArray(JSON.parse(res.message).attachments));
});

test('send email with locals.user.last_locale', async t => {
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
      to: 'niftylettuce+to@gmail.com'
    },
    locals: {
      name: 'niftylettuce',
      user: {
        last_locale: 'en'
      }
    }
  });
  t.true(typeof res === 'object');
});

test('send email with locals.locale', async t => {
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
      to: 'niftylettuce+to@gmail.com'
    },
    locals: {
      name: 'niftylettuce',
      locale: 'en'
    }
  });
  t.true(typeof res === 'object');
});

test('throws error with missing template', async t => {
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
  const error = await t.throws(
    email.send({
      template: 'missing',
      message: {
        to: 'niftylettuce+to@gmail.com',
        cc: 'niftylettuce+cc@gmail.com',
        bcc: 'niftylettuce+bcc@gmail.com'
      },
      locals: { name: 'niftylettuce' }
    })
  );
  t.regex(error.message, /no such file or directory/);
});

test('send email and open in browser', async t => {
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
    },
    transport: {
      jsonTransport: true
    },
    juiceResources: {
      webResources: {
        relativeTo: root
      }
    },
    open: true
  });
  const res = await email.send({
    template: 'test',
    message: {
      to: 'niftylettuce+to@gmail.com',
      cc: 'niftylettuce+cc@gmail.com',
      bcc: 'niftylettuce+bcc@gmail.com'
    },
    locals: { name: 'niftylettuce' }
  });
  t.true(typeof res === 'object');
});

test('send email with html to text disabled', async t => {
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
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
      to: 'niftylettuce+to@gmail.com',
      cc: 'niftylettuce+cc@gmail.com',
      bcc: 'niftylettuce+bcc@gmail.com'
    },
    locals: { name: 'niftylettuce' }
  });
  t.true(typeof res === 'object');
});

test('inline css with juice using render', async t => {
  const root = path.join(__dirname, 'fixtures', 'emails');
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
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
    name: 'niftylettuce'
  });
  const $ = cheerio.load(html);
  const color = $('p').css('color');
  t.is(color, 'red');
});

test('inline css with juice using send', async t => {
  const email = new Email({
    views: { root },
    message: {
      from: 'niftylettuce+from@gmail.com'
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
      to: 'niftylettuce+to@gmail.com'
    },
    locals: { name: 'niftylettuce' }
  });
  t.true(typeof res === 'object');
  const message = JSON.parse(res.message);
  const $ = cheerio.load(message.html);
  const color = $('p').css('color');
  t.is(color, 'red');
});
