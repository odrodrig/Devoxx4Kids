# My Buddy Watson

## Overview

The My Buddy Watson application is a chat application using Socket.io, IBM Bluemix, Watson Language Translation, Watson Tone Analyzer, and Watson Conversation. Using this application, we will build your very own chatroom to chat with friends. Using the Watson Language Translation, we will be able to do translations on the fly with a simple command. Also, while you chat there is a chat bot named "sockBot" who will use the Watson Tone Analyzer service to analyze the chat messages. The bot will then alert the users if the messages are either angry or sad. With the power of Watson Conversation we can create an intelligent chat bot and train it to respond to certain commands. In this case, Watson will be able to tell jokes and help us out in Pokemon battles.



### How to Use

Once in the application, choose a nickname that will appear to other users and select the language you are fluent in (English is the default).
To translate, start your message with "/translate 'language'" replacing 'language' with the language you want to translate to. For example, if I wanted to translate "Hi my name is Oliver" to spanish, I would type "/translate spanish Hello my name is Oliver" and the translated spanish output would be sent to the chat room.

To communicate with Watson, type "/watson" and then the message you would like to send. For example, if I wanted Watson to tell me a joke, I would type  "/watson Tell me a joke" and Watson would respond with something funny.

### The Services

1. Watson Language Translator
	* Watson Language Translator allows you to translate English to/from Brazilian Portuguese, French, Modern Standard Arabic, or Spanish. In our application, we are translating sentences in the chatroom.

2. Watson Tone Analyzer
	* Watson Tone Analyzer analyzes text that you send the service and returns the tone detected in the conversation. Using this service, you are able to extract emotion such as anger, disgust, fear, joy, and sadness. In our application, we use the service in our "SockBot" that is monitoring the chat for any angry or sad messages and promptly offer a comforting message.

3. Watson Conversation
	* Watson Conversation allows you to create a more intelligent chat bot for handling user input. This allows you to communicate with an application in an easy and fluid way through natural language. Using this service we will be able to train Watson to handle a few commands for us such as telling us a joke and telling us what type of pokemon to use in a battle.

## Instructions

To get the application deployed, start by clicking on the button below. This will open up the "Deploy to Bluemix" page.

1. This tool requires a Bluemix account so you will need to either create one or log in with your existing account.
2. Start by creating a unique name for your application. For example, if my name is John Smith, I'd use jsAppName
3. and verifying the bluemix information.
4. If everything is correct, click Deploy.
5. Once deployed, you will need to import the Watson Conversation workspace json file into the service. That file can be downloaded from the project directory. It is the file that starts with "workspace...".

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/odrodrig/Devoxx4Kids.git)

## Credits
* Base socket chat application is from the socket.io chat example found [here](https://github.com/socketio/socket.io)
* Tone Analyzer and SockBot implementation built by [Stefania Kaczmarczyk](https://github.com/slkaczma)
* Language Translation and Watson Conversation implemented by [Oliver Rodriguez](https://github.com/odrodrig)
