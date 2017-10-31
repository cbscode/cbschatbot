'use strict'

const token = process.env.FB_PAGE_ACCESS_TOKEN_TEST
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


	let response;
	let introduction = "Hi my name is Alfred, the CBS Code Chatbot.";
	//Workshop questions
	let text = received_message.text;		

  //Keyword Intelligence 
	//Topics
  let keywords = ["experience", "contact", "event"];
  
	//Sub Keywords
  let key_experience = ["experience"];
	let key_contact = ["email", "contact", "join", "question"];
	let key_event = ["event","chatbot"];
  
  //How many words are in the string
	let words = text.split(" ").length;
  let x,y;
	let key = [];
  
  // Check if the message contains text
  if (received_message.text) {    

  function print_word(keyword,key){
    //The console Intelligence
	  console.log("TOPIC: "+keyword+" KEYWORD: "+key);
    if(keyword === "contact"){
			//Posibly looks for a contact
			response = {
				"text":  introduction+` you can contact us on info@cbscode.com!`
			}
			callSendAPI(sender_psid, response);    	
		}else if(keyword === "experience"){			
			response = {
				"text": introduction+` no coding experience is necessary on the workshop! Nevertheless is always an advantage.`
			}
			callSendAPI(sender_psid, response);    	
		}else if(keyword == "event"){
			sendEventInfo(sender_psid);			
		}else{
			//Any other scenario	
			response = {
					"text": introduction+` I will contact a human to answer your question!`
			}
			callSendAPI(sender_psid, response);    	
		}

	}

  //This For measures the main categories on each array
	for(x=0;x<=keywords.length-1;x++){	
      key = eval("key_"+keywords[x]);
			//Here I check if each word inside of each category array has a match on the written text
		  for(y=0;y<=key.length-1;y++){
         if (text.indexOf(key[y]) > -1){
						print_word(keywords[x],key[y]);	 
				 }
			}
	}

    /*
		if (text === "hi"){
			 sendEventInfo(sender_psid);		
		}else if(text = "*experience*"){	 
			response = {
				"text": introduction+` no coding experience is necessary on the workshop!`
			}
			callSendAPI(sender_psid, response);    
		}else if(text = "*contact*"){	 
			//Posibly looks for a contact
			response = {
				"text":  introduction+` you can contact us on info@cbscode.com!`
			}
			callSendAPI(sender_psid, response);    
		}else if(text = "*email*"){	 
			//Posibly looks for a contact
			response = {
				"text":  introduction+` you can contact us on info@cbscode.com!`
			}
			callSendAPI(sender_psid, response);    
		}else if(text = "*join*"){	 
			//Posibly a new volunteer
			response = {
				"text":  introduction+` we are always open to volunteers, I will contact a human!`
			}
			callSendAPI(sender_psid, response);    
		}else if(text = "*experience*"){	 
			response = {
				"text": introduction+` no coding experience is necessary on the workshop!`
			}
			callSendAPI(sender_psid, response);    
		}else if(text != "*event*"){
			response = {
				//"text": `Hi my name is Alfred, the CBS Code Chatbot: "${received_message.text}". I will contact a human to answer your question!`
				"text": introduction+` I will contact a human to answer your question!`
			}
			callSendAPI(sender_psid, response);    	 
		}else{	
			response = {
				"text": introduction+` I will contact a human to answer your question!`
			}
			callSendAPI(sender_psid, response);    
		}
		// Create the payload for a basic text message
		*/	
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
		//callSendAPI(sender_psid, response);    
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender_psid},
            message: response,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}
