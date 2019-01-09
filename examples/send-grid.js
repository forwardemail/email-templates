"use strict";
const Email = require("email-templates");
const nodemailerSendgrid = require('nodemailer-sendgrid');
const mailer = nodemailer.createTransport(
    nodemailerSendgrid({
        apiKey: 'your API KEY HERE'
    })
);
 const email = new Email({
  message: {
    from: "niftylettuce@gmail.com"
  },
  // uncomment below to send emails in development/test env:
  // send: true
  transport: mailer
});
 email
  .send({
    template: "mars",
    message: {
      to: "elon@spacex.com"
    },
    locals: {
      name: "Elon"
    }
  })
  .then(console.log)
  .catch(console.error);
