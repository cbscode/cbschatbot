'use strict'

//const token = process.env.FB_PAGE_ACCESS_TOKEN_TEST
const token = process.env.FB_PAGE_ACCESS_TOKEN
const vtoken = process.env.FB_PAGE_VERIFY_TOKEN

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const fs = require('fs')

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

//Empty the users.txt file
function deleteUsers() {
  fs.writeFileSync("users.txt","", 'utf8')
}

function handleMessage(sender_psid, received_message) {

  let response;
	//Empty Introduction varable that is only shown to new users
  let introduction;
  //Workshop questions
  let text = received_message.text;
  text = text.toLowerCase();

  //Check if new user or old user
  let newUser;
  let users = fs.readFileSync("users.txt", 'utf8').split(" ");
  //If our 'database' has this sender_psid it is not a new user
  if (users.includes(sender_psid)){
    //If it is a new user, send the welcome message
    introduction = "Hi my name is Alfred 1.0, the CBS Code Chatbot.";
    newUser = false;
    console.log("USERS containts: " + sender_psid);
  } else {
		introduction = "";
    newUser = true;
  }

  //Delete all data in users.txt
  if (received_message.text === "heroku deleteUsers -t " + vtoken) {
    deleteUsers();
    console.log("USER deleted");
    return;
  }




  //Keyword Intelligence
	//Topics
  let keywords = ["experience", "contact", "event", "welcome", "negative", "positive"];

	//Sub Keywords
  let key_experience = ["experience", "knowledge"];
	let key_contact = ["email", "contact", "join", "question"];
	let key_event = ["event","chatbot","workshop"];
  let key_welcome = ["hej", "hi", "hey", "hello", "hola", "start"];
	let key_negative = ["hate", "fuck", "garbage", "shit", "bitch"];
	let key_positive = ["love"];

  //How many words are in the string
	let words = text.split(" ").length;
  let x,y;
	let key = [];
	let answered = false;

  // Check if the message contains text
  if (received_message.text) {

		function print_word(keyword,key){
			//The console Intelligence
			console.log("TOPIC: "+keyword+" KEYWORD: "+key);
			if(keyword === "contact"){
				//Posibly looks for a contact
				response = {
					"text":  introduction+` You can contact us on info@cbscode.com!`
				}
				callSendAPI(sender_psid, response);
			}else if(keyword === "experience"){
				response = {
					"text": introduction+` No coding experience is necessary on the workshop! Nevertheless is always an advantage.`
				}
				callSendAPI(sender_psid, response);
			}else if(keyword === "welcome"){
				response = {
					"text": introduction
				}
				sendEventInfo(sender_psid,keyword);
				//callSendAPI(sender_psid, response);
			}else if(keyword === "negative"){
				response = {
					"text": introduction+` I have no feelings, nobody can hurt me.`
				}
				callSendAPI(sender_psid, response);
			}else if(keyword === "positive"){
				response = {
					"text": introduction+` Unfortunately I have no feelings, I am only a piece of software.`
				}
				callSendAPI(sender_psid, response);
			}else if(keyword === "event"){
				sendEventInfo(sender_psid,keyword);
			}else if(!answered && newUser){
				//Any other scenario
				response = {
						"text": introduction+` Clever! I am a beta experiment learning from your interaction. I will need to contact my human to answer you!`
				}
        //Add this sender_psid to the 'database'
        fs.writeFileSync("users.txt", fs.readFileSync("users.txt", 'utf8') + sender_psid + " ", 'utf8')
        console.log("Added to USERS: " + fs.readFileSync("users.txt", 'utf8'));
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
							answered = true;
					 }
				}
		}
		if (!answered){print_word("empty","0")}

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

function sendEventInfo(sender_psid,keyword) {
    let response; 
		if(keyword === "welcome"){			
      response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Welcome to CBS Code",
										"image_url":"http://cbscode.com/wp-content/uploads/2017/02/1.png",
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
                    }],
                }]
            }
        }
			}	
		}else if(keyword === "event"){
      response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Welcome to CBS Code",
										"image_url":"http://cbscode.com/wp-content/uploads/2017/11/22538684_1580502938677015_4938843189517739898_o.jpg",
                    "subtitle": "Workshop on Create your Own ChatBot",
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
                    }],
                }]
            }
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
