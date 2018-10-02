"use strict";
const Email = require("email-templates");
const AWS = require("aws-sdk");
let transporter = {
  SES: new AWS.SES({ apiVersion: "2010-12-01", region: "us-east-1" }) // Or whatever works for you.
};

const email = new Email({
  message: {
    from: "niftylettuce@gmail.com"
  },
  // uncomment below to send emails in development/test env:
  // send: true
  transport: transporter
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
