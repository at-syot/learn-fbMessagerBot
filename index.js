const 
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json())

const request = require('request')

// read .env file.
const dotenv = require('dotenv')
dotenv.config()
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

function handleMessage(sender_psid, received_message) {
  let res
  if (received_message.message) {
    res = {
      "text": `You send this msg: ${received_message} back to the page!.`
    }
  }

  callSendAPI(sender_psid, res)
}

function handlePostback(sender_psid, received_postback) {}

function callSendAPI(sender_psid, res) {
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": res
  }
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { "access_token": PAGE_ACCESS_TOKEN },
    method: "POST",
    json: request_body
  }, (err, res, body) => {
    console.log(res)
    console.log('\n')
    console.log(body)
    console.log('\n')
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

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message)
      } else if (webhook_event.postback) {

      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Adds support for GET requests to our webhook
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
app.listen(port, function() {
  console.log(`web hook is listening on port: ${port}.`)
})