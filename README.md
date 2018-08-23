# google-oauth2

Test Google OpenID/OAuth2 and GMail API with Node.js.

This simple client/server application authenticates with Google through OAuth2.0, loads all gmail messages metadata and formats the results.

## Install dependancies

### Server

Navigate to the repository root: ```cd google-oauth2/```.  
Install the dependancies with```yarn install``` or ```npm i```.

### Client

Navigate to the client folder: ```cd google-oauth2/client/```.  
Install the dependancies with ```yarn install``` or ```npm i```.

## Setup config.json

Touch ```config.json``` in the repository root and input your Google Project credentials like so:

```json
{
  "auth": {
    "google": {
      "clientId": "….apps.googleusercontent.com",
      "clientSecret": "…",
      "redirectUri": "http://localhost:8080/auth/cb"
    }
}
```

Get your clientId, clientSecret, and redirectUri from the Google Cloud Platform → API Console → Credentials.

## How to run

### Server

From repo-root start the server with ```yarn server``` or ```npm server```

### Client

From repo-root start the server with ```yarn client``` or ```npm client```