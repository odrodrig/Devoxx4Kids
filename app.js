/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix

// Blue Socks Chat Application Authors
// This application is based off of the socket.io chat example seen here (https://github.com/socketio/socket.io)
// Watson Tone Analyzer and SockBot implementation built by Stefania Kacmarczyk (https://github.com/slkaczma)
// Language Translation implemented by Oliver Rodriguez (https://github.com/odrodrig)
//------------------------------------------------------------------------------

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request-promise');

//Pull in Watson Developer Cloud library
var watson = require('watson-developer-cloud');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

/*********************************************************************************************************
                                           Parsing Service Credentials
*********************************************************************************************************/

//get services from environment variables
var services = appEnv.services;

var username = "";
var password = "";

if(appEnv.isLocal) {
  console.log("Running Locally. Deploy to Bluemix for this app to work.");
} else {
  //If running in the cloud, then we will pull the service credentials from the environment variables
  console.log("Running in Cloud");
  const watsonCreds = services['language_translator'][0].credentials;
  const toneCreds = services['tone_analyzer'][0].credentials;
  const conversationCreds = services['conversation'][0].credentials;

  username = watsonCreds.username;
  password = watsonCreds.password;

  toneUser = toneCreds.username;
  tonePass = toneCreds.password;

  conversationUser = conversationCreds.username;
  conversationPass = conversationCreds.password;

}

const language_translation = new watson.LanguageTranslatorV2({
  username: username,
  password: password,
  url: 'https://gateway.watsonplatform.net/language-translator/api/'
});

const tone_analyzer = watson.tone_analyzer({
  url: 'https://gateway.watsonplatform.net/tone-analyzer/api/',
  username: toneUser,
  password: tonePass,
  version_date: '2016-05-19',
  version: 'v3'
});

const conversation = new watson.ConversationV1({
  username: process.env.CONVERSATION_USERNAME || conversationUser,
  password: process.env.CONVERSATION_PASSWORD || conversationPass,
  version_date: watson.ConversationV1.VERSION_DATE_2017_02_03
});

/*********************************************************************************************************
                                        End of Parsing Service Credentials
*********************************************************************************************************/

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

http.listen(appEnv.port, function(){
  console.log('listening on '+ appEnv.port);
});

// Chatroom

var numUsers = 0;
var chatHistory= [];
var context = {};

io.on('connection', function (socket) {
  var addedUser = false;
  console.log("connected to socket.io");

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'

	console.log('in new message: ' + data);
	chatHistory.push(data.message);

	getTone(data.message);

    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data.message
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;
    console.log("added user");

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });

    //Add watson stuff here?
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

 /**********************************************************************************************************
                                           Translation Socket
 ***********************************************************************************************************/

  //When a translation tag is read from chat
  socket.on('translate', function(data) {

  	console.log(data.message);
  	console.log(data.sourceLang);
  	console.log(data.targetLang);


  	language_translation.translate({
  		text: data.message, source : data.sourceLang, target: data.targetLang },
  		function (err, translation) {

  			console.log("Watson will translate : " + data.message);

    		if (err) {
      		console.log('error:', err);

          socket.emit('translationResults', {
            username: socket.username,
            message: "Error translating. Try again."
          });

          socket.broadcast.emit('translationResults', {
            username: socket.username,
            message: "Error translating. Try again."
          });

    		} else {
      			console.log(translation.translations[0].translation);
      			data.message = translation.translations[0].translation;

      			socket.emit('translationResults', {
			    	username: socket.username,
			    	message: data.message
			      });

    		    socket.broadcast.emit('translationResults', {
    		    	username: socket.username,
    		    	message: data.message
    		    });
        }
	    }
    );

  });

  /**********************************************************************************************************
                                         End of Translation Socket
  ***********************************************************************************************************/
  /**********************************************************************************************************
                                         Watson Socket
  ***********************************************************************************************************/

  socket.on('watson', function(data) {

    console.log("Watson socket called");

    const payload = {
      workspace_id: '0f9b4f18-81a8-4d46-a4df-7421c959b4be',
      input: {text: data.message},
      context: context
      };

    conversation.message(payload, function(err, data) {

      context = data.context;

      console.log(data);

      if (err) {

        console.error(JSON.stringify(err, null, 2));
      } else {
        // APPLICATION-SPECIFIC CODE TO PROCESS THE DATA
        // FROM CONVERSATION SERVICE
        //console.log(JSON.stringify(data, null, 2));



        if(context.weakness) {
          var pokemon = context.pokemon;
          console.log(pokemon);
          context = {};
          getWeakness(pokemon, function(weaknesses) {

            socket.emit('new message', {
          		username:"Watson",
          		message: pokemon+"'s weaknesses include: "+weaknesses
          	});

          	socket.broadcast.emit('new message', {
          		username: "Watson",
          		message: pokemon+"'s weaknesses include: "+weaknesses
          	});
          });
        } else {

          var response = data.output.text[0];

          socket.emit('new message', {
        		username:"Watson",
        		message: response
        	});

        	socket.broadcast.emit('new message', {
        		username: "Watson",
        		message: response
        	});
        }
      }
    });

  });

  /**********************************************************************************************************
                                         End of Watson Socket
  ***********************************************************************************************************/

function getTone(data){
	var tones;
	var message;
	var name;
	var score;

  	tone_analyzer.tone({text:data}, function(err, results) {
    	if (err)
    		console.log("Error getting tone: "+err);
    	else {
    		tones = results.document_tone.tone_categories[0].tones;
    		var stats = [];

			for(var i=0; i<tones.length; i++){
				name = tones[i].tone_name;
				score = tones[i].score;

				stats.push(score);

				console.log(name+":"+score);
			}

			var topTrait = Math.max.apply(Math,stats);
			var topTraitPercent = (topTrait *100).toFixed(2);

      if(topTraitPercent > 60.00) {

  			switch(topTrait){
  					case stats[0]:
  						name = tones[0].tone_name;
  						message = "The chat is too volatile. Let's be nice! Anger at "+topTraitPercent+"%";
  						botTalk(message);
  						break;
  					case stats[1]:
  						name = tones[1].tone_name;
  						break;
  					case stats[2]:
  						name = tones[2].tone_name;
  						break;
  					case stats[3]:
  						name = tones[3].tone_name;
  						break;
  					case stats[4]:
  						name = tones[4].tone_name;
  						message = "Cheer up "+socket.username+". Sadness at "+topTraitPercent+"%";
  						botTalk(message);
  						break;
        }
			}
		}
	});

  }

  function getWeakness(pokemon, callback) {
    request({uri:'http://pokeapi.co/api/v2/pokemon/'+pokemon, json: true})

    .then(function(json) {
      var types = json.types;
      var typeEntry = types.slice(-1)[0];
      var type = typeEntry.type.name;

      return(type);
    })
    .then(function(type) {
      request({uri: 'http://pokeapi.co/api/v2/type/'+type, json: true})
       .then(function(json) {

          var doubleDamage = json.damage_relations.double_damage_from;
          var weaknesses = "";

          for(var i = 0; i<doubleDamage.length; i++) {

              weaknesses += doubleDamage[i].name;
              weaknesses += ", "

          }
          callback(weaknesses);
        })
    })
    .catch(function(error) {
      console.log(error);

      socket.emit('new message', {
        username:"Watson",
        message: "That pokemon was not found. Try again.",
      });

      socket.broadcast.emit('new message', {
        username: "Watson",
        message: "That pokemon was not found. Try again.",
      });

    });
  }

  function botTalk(message){
	socket.emit('new message', {
		username:"SockBot",
		message: message,
	});

	socket.broadcast.emit('new message', {
		username: "SockBot",
		message: message,
	});
}


});
