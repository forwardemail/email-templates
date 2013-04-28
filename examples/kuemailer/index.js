/**
send mail based kue example

make sure started redis-server on localhost:6379

and then
```
cd examples/kuemailer
node index.js
```

open new terminal
```
$ curl -H "Content-Type: application/json" -X POST -d \
    '{
       "type": "postbox",
       "data": {
         "title": "Mangia gli spaghetti con polpette!",
         "to": "mamma.mia@spaghetti.com",
         "template": "newsletter",
         "params": {
            "name": {
              "first": "Mamma",
              "last": "Mia"
            }
         }
       },
       "options" : {
         "attempts": 5,
         "priority": "high"
       }
     }' http://localhost:3000/job

```

PS: mail is not really send, because SMTP config is wrong.

*/
var path = require('path'),
  templatesDir = path.resolve(__dirname, '..', 'templates'),
  emailTemplates = require('../../'),
  nodemailer = require('nodemailer'),
  kue = require('kue');

var events = require("events");
var deliver = new events.EventEmitter();

var jobs = kue.createQueue();
kue.app.listen(3000);

jobs.process('postbox', function(job, done) {
  deliver.emit(job.data.template, job.data, done);
});


emailTemplates(templatesDir, function(err, template) {
  if (err) {
    console.log(err);
  } else {
    // Prepare nodemailer transport object
    var transport = nodemailer.createTransport("SMTP", {
      service: "Gmail",
      auth: {
        user: "some-user@gmail.com",
        pass: "some-password"
      }
    });

    template('newsletter', true, function(err, batch) {
      deliver.on('newsletter', function(data, done) {
        batch(data.params, templatesDir, function(err, html, text) {
          transport.sendMail({
            from: 'Spicy Meatball <spicy.meatball@spaghetti.com>',
            to: data.to,
            subject: data.title,
            html: html,
            text: text
          }, function(err, responseStatus) {
            if (err) {
              console.log(err);
              done(err);
            } else {
              done();
              console.log(responseStatus.message);
            }
          });
        });
      });
    });
  }
});