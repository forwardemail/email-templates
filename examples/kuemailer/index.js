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
var path = require('path')
var templatesDir = path.resolve(__dirname, '..', 'templates')
var EmailTemplate = require('../../').EmailTemplate
var nodemailer = require('nodemailer')
var kue = require('kue')
var EventEmitter = require('events').EventEmitter

var deliver = new EventEmitter()
var jobs = kue.createQueue()
kue.app.listen(3000)

jobs.process('postbox', function (job, done) {
  deliver.emit(job.data.template, job.data, done)
})

var template = new EmailTemplate(path.join(templatesDir, 'newsletter'))
var transport = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'some-user@gmail.com',
    pass: 'some-password'
  }
})

deliver.on('newsletter', function (data, done) {
  template.render(data.params, function (err, results) {
    if (err) return done(err)

    transport.sendMail({
      from: 'Spicy Meatball <spicy.meatball@spaghetti.com>',
      to: data.to,
      subject: data.title,
      html: results.html,
      text: results.text
    }, function (err, responseStatus) {
      if (err) {
        console.error(err)
        return done(err)
      }
      console.log(responseStatus.message)
      done()
    })
  })
})
