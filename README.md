
# Fragments UI

Fragments UI is a simple web interface that interacts with a fragments microservice, allowing authenticated users to retrieve and display their data fragments (plain text as of now). It uses Amazon Cognito for authentication and authorization and interacts with the fragments microservice through secure API calls.


## Features 

* User Authentication: Users can sign in via Amazon Cognito.
* Retrieve User Fragments: After signing in, the app fetches and displays the user's data fragments from the microservice.
* AWS Cognito Integration: Secure login using AWS Cognito Hosted UI.
* OAuth 2.0: Utilizes Access Code Grant flow for authentication.

## Prerequisites 

* Node.js: Install the latest version of Node.js.
* AWS Cognito: Set up an Amazon Cognito User Pool and App Client.
* Fragments Microservice: Ensure the fragments microservice is running and accessible.

## Installing Dependencies  
```
npm install
```

## Run the Deployment Server

```
npm start
```

## Authors

- [@jivinchugh](https://github.com/jivinchugh)

