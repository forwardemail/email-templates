const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');

const Email = require('..');

const transport = nodemailer.createTransport(
  nodemailerSendgrid({
    apiKey: 'your API KEY HERE'
  })
);

const email = new Email({
  message: {
    from: 'niftylettuce@gmail.com'
  },
  // uncomment below to send emails in development/test env:
  // send: true
  transport
});

email
  .send({
    template: 'mars',
    message: {
      to: 'elon@spacex.com'
    },
    locals: {
      name: 'Elon'
    }
  })
  .then(console.log)
  .catch(console.error);
