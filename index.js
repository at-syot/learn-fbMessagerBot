const 
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json())

app.use(express.static('public'))

const request = require('request')

// read .env file.
const dotenv = require('dotenv')
dotenv.config()
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

function handleMessage(sender_psid, received_message) {
  console.log('always log message.')
  console.log(received_message)
  let res
  if (received_message.text) {
    const text = received_message.text
    if (text == 'start') {
      res = {
        "text": "Pick: income or expense ?",
        "quick_replies":[
          {
            "content_type":"text",
            "title":"income",
            "payload": "",
            "image_url":"https://vast-cliffs-28332.herokuapp.com/images/income.png"
          },{
            "content_type":"text",
            "title":"expense",
            "payload":"",
            "image_url":"https://vast-cliffs-28332.herokuapp.com/images/expense.png"
          }
        ]
      }
    } else {
      res = {
        text: `You send this msg: ${text} back to the page!.`
      }
    }
  }

  if (received_message.attachments) {
    let attachment_url = received_message.attachments[0].payload.url
    res = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  }

  callSendAPI(sender_psid, res)
}

function handlePostback(sender_psid, received_postback) {
  let payload = received_postback.payload
  callSendAPI(sender_psid, (function() {
    if (payload == 'yes') {
      return {
        text: 'OK, this is the right photo.'
      }
    }
    return { 
      text: 'Ops! Try upload another one.'
    }
  })())
}

function callSendAPI(sender_psid, res) {
  let request_body = {
    recipient: {
      id: sender_psid
    },
    message: res
  }

  console.log('request_body')
  console.log(request_body)
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { "access_token": PAGE_ACCESS_TOKEN },
    method: "POST",
    json: request_body
  }, (err, res, body) => {
    console.log(res)
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  })
} 

app.post('/webhook', (req, res) => {  

  console.log('webhook post got call.')

  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {
    body.entry.forEach(function(entry) {

      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id
      console.log('webhook event.')
      console.log(webhook_event)
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message)
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback)
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

app.get('/webhook', (req, res) => {

  console.log('webhook GET got call.')
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = process.env.VERIFY_TOKEN
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});


const port = process.env.PORT || 1337
app.listen(port, () => console.log(`web hook is listening on port: ${port}.`))