const path = require('path');
const test = require('ava');
const nodemailer = require('nodemailer');

const Email = require('../');

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
    views: {
      root: path.join(__dirname, 'fixtures', 'emails')
    },
    message: {
      from: 'niftylettuce+from@gmail.com'
    },
    transport: {
      jsonTransport: true
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

test('send email with locals.user.last_locale', async t => {
  const email = new Email({
    views: {
      root: path.join(__dirname, 'fixtures', 'emails')
    },
    transport: {
      jsonTransport: true
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
    views: {
      root: path.join(__dirname, 'fixtures', 'emails')
    },
    transport: {
      jsonTransport: true
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
    views: {
      root: path.join(__dirname, 'fixtures', 'emails')
    },
    transport: {
      jsonTransport: true
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
    views: {
      root: path.join(__dirname, 'fixtures', 'emails')
    },
    message: {
      from: 'niftylettuce+from@gmail.com'
    },
    transport: {
      jsonTransport: true
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
    views: {
      root: path.join(__dirname, 'fixtures', 'emails')
    },
    message: {
      from: 'niftylettuce+from@gmail.com'
    },
    transport: {
      jsonTransport: true
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
