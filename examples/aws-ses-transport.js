'use strict';
const AWS = require('aws-sdk');
const Email = require('../src');

const transporter = {
  SES: new AWS.SES({ apiVersion: '2010-12-01', region: 'us-east-1' })
};

const email = new Email({
  message: {
    from: 'niftylettuce@gmail.com'
  },
  // uncomment below to send emails in development/test env:
  // send: true
  transport: transporter
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
