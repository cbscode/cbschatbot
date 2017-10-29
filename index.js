'use strict'

const token = process.env.FB_PAGE_ACCESS_TOKEN
const vtoken = process.env.FB_PAGE_VERIFY_TOKEN

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === vtoken) {
        res.send(req.query['hub.challenge'])
    }
    res.send('No sir')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

			// Get the sender PSID
			let sender_psid = webhook_event.sender.id;
			console.log('Sender PSID: ' + sender_psid);

			// Check if the event is a message or postback and
			// pass the event to the appropriate handler function
			if (webhook_event.message) {
				handleMessage(sender_psid, webhook_event.message);        
			} else if (webhook_event.postback) {
				handlePostback(sender_psid, webhook_event.postback);
			}

    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

function handleMessage(sender_psid, received_message) {


  // Check if the message contains text
  if (received_message.text) {    
    
		let response;
		//Workshop questions
    let text = received_message.text;
		if (text === "workshop"){
			 sendEventInfo(sender_psid);	
		}else{	
			response = {
				"text": `You sent the message: "${received_message.text}". Now send me an image!`
			}
			callSendAPI(sender_psid, response);    
		}
		// Create the payload for a basic text message
  }  
  
  // Sends the response message
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": token },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

function sendEventInfo(sender_psid) {
	  
    let response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Welcome to CBS Code",
										"image_url":"http://cbscode.com/wp-content/uploads/2017/02/team_s.jpg",
                    "subtitle": "We aim to bridge the gap between business and technology",
										"default_action":{
												"type": "web_url",
												"url": "https://www.facebook.com/cbscode/",
												"messenger_extensions": true,
												"webview_height_ratio": "tall",
										},
                    "buttons": [{
                        "type": "web_url",
                        "url": "http://www.cbscode.com",
                        "title": "Visit Website"
                    }, {
                        "type": "web_url",
                        "url": "https://www.eventbrite.com/e/cbs-code-build-your-own-chatbot-with-botsupplyai-tickets-38820426942",
                        "title": "Get Workshop Tickets"
                    }, {
                        "type": "postback",
                        "title": "Start Chatting",
                        "payload": "DEVELOPER_DEFINED_PAYLOAD",
                    }],
                }]
            }
        }
    }
		callSendAPI(sender_psid, response);    
		/*
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender_psid},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
		*/
}
/*
app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
      let event = req.body.entry[0].messaging[i]
      let sender = event.sender.id
      if (event.message && event.message.text) {
        let text = event.message.text
        if (text === 'Generic') {
            sendGenericMessage(sender)
            continue
        }
        sendTextMessage(sender, "Message received: " + text.substring(0, 200))
      }
      if (event.postback) {
        let text = JSON.stringify(event.postback)
        sendTextMessage(sender, "Postback: "+text.substring(0, 200), token)
        continue
      }
    }
    res.sendStatus(200)
  })

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}
function sendGenericMessage(sender) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "First card",
                    "subtitle": "Element #1 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.messenger.com",
                        "title": "web url"
                    }, {
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble",
                    }],
                }, {
                    "title": "Second card",
                    "subtitle": "Element #2 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}
*/
