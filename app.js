var express = require("express");
var bodyParser = require("body-parser");
//var Axios = require("axios");
var Request = require("request");
var cors = require("cors");
var config = require("./config.json");
//var OAuth = require("oauth");
//var timestamp = require("unix-timestamp");
//var oauthSignature = require("oauth-signature");
var { google } = require("googleapis");

var app = express();
app.use(cors());
app.use(bodyParser.json());
// app.use(allowCrossDomain);

/*app.get("/", function(req, res) {
  res.send("vue-authenticate");
});*/

app.post("/auth/:provider", function(req, res) {
  switch (req.params.provider) {
    case "github":
      githubAuth(req, res);
      break;
    case "facebook":
      facebookAuth(req, res);
      break;
    case "google":
      googleAuth(req, res);
      break;
    case "twitter":
      twitterAuth(req, res);
      break;
    case "instagram":
      instagramAuth(req, res);
      break;
    case "bitbucket":
      bitbucketAuth(req, res);
      break;
    case "linkedin":
      linkedinAuth(req, res);
      break;
    case "live":
      liveAuth(req, res);
      break;
    case "login":
      loginAuth(req, res);
      break;
    case "register":
      registerAuth(req, res);
      break;
  }
});

app.listen(3000);
console.log("Google OAuth2 server listening on port 3000.");

/*function allowCrossDomain(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
}*/

/*function loginAuth(req, res) {
  res.json({
    id: 1,
    name: "John Doe",
    email: "john.doe@domain.com",
    created_at: new Date(),
    access_token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiBMb2dpbiBEb2UiLCJhZG1pbiI6dHJ1ZX0.VHK2sCbj5nKJ8oC44UTHuhQHXEdPN8zjKjaFT0OZ-LY"
  });
}*/

/*function registerAuth(req, res) {
  res.json({
    id: 1,
    name: "John Doe",
    email: "john.doe@domain.com",
    created_at: new Date(),
    access_token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSIsIm5hbWUiOiJKb2huIFJlZ2lzdGVyIERvZSIsImFkbWluIjp0cnVlfQ.zTR57xocFkGp2UdFwBLk1cZUeqgSujvTqVAFagBlU4I"
  });
}*/

/*function githubAuth(req, res) {
  Axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: config.auth.github.clientId,
      client_secret: config.auth.github.clientSecret,
      code: req.body.code,
      redirect_uri: req.body.redirectUri,
      state: req.body.state,
      grant_type: "authorization_code"
    },
    { "Content-Type": "application/json" }
  )
    .then(function(response) {
      var responseJson = parseQueryString(response.data);
      if (responseJson.error) {
        res.status(500).json({ error: responseJson.error });
      } else {
        res.json(responseJson);
      }
    })
    .catch(function(err) {
      res.status(500).json(err);
    });
}*/

/*function facebookAuth(req, res) {
  Axios.post(
    "https://graph.facebook.com/v2.4/oauth/access_token",
    {
      client_id: config.auth.facebook.clientId,
      client_secret: config.auth.facebook.clientSecret,
      code: req.body.code,
      redirect_uri: req.body.redirectUri
    },
    { "Content-Type": "application/json" }
  )
    .then(function(response) {
      var responseJson = response.data;
      res.json(responseJson);
    })
    .catch(function(err) {
      res.status(500).json(err);
    });
}*/

//googleAuth
const oauth2Client = new google.auth.OAuth2(
  config.auth.google.clientId,
  config.auth.google.clientSecret,
  config.auth.google.redirectUri
);

function listMessagesIds(gmail) {
  const getPageOfMessagesIds = function(request, result) {
    return request.then(function(resp) {
      result = result.concat(resp.data.messages);
      let nextPageToken = resp.data.nextPageToken;
      if (nextPageToken) {
        request = gmail.users.messages.list({
          userId: "me",
          pageToken: nextPageToken
        });
        return getPageOfMessagesIds(request, result);
      } else {
        return result;
      }
    });
  };
  let initialRequest = gmail.users.messages.list({ userId: "me" });
  return getPageOfMessagesIds(initialRequest, []);
}

function getMessageMeta(gmail, id) {
  return gmail.users.messages
    .get({
      userId: "me",
      id: id,
      format: "metadata",
      metadataHeaders: ["From", "To", "Delivered-To", "Cc", "Subject"]
    })
    .catch(err => {
      console.log("getMessageMeta - error: ", err);
    });
}

function formatMessagesMeta(data) {
  return data.map(formatMessageMeta).filter(obj => obj !== null);
}
function formatMessageMeta(data) {
  let headers = data.payload.headers;
  let formated = {};

  // array to object
  headers = headers.reduce((obj, item) => {
    obj[item.name.toLowerCase()] = item.value;
    return obj;
  }, {});

  // discard incomplete
  if (!(headers.from && headers.to)) {
    return null;
  }

  // date
  formated.ts = data.internalDate;
  // cc
  if (headers.cc) {
    formated.ccs = headers.cc.split(", ");
  } else {
    formated.ccs = [];
  }
  // addresses
  const formatAddress = function(address) {
    let name = "";
    let email = "";
    if (address.indexOf("<") > 0) {
      name = /.*(?=<)/.exec(address)[0].slice(0, -1);
      email = /[^<]*$/.exec(address)[0].slice(0, -1);
    } else {
      email = address;
    }
    return { name: name, email: email };
  };
  formated.ccs = formated.ccs.map(formatAddress);
  formated.from = formatAddress(headers.from);
  formated.to = formatAddress(headers.to);
  formated.delivered_to = formatAddress(headers.to);

  return formated;
}

function getMessagesMeta(gmail, messages_ids) {
  if (!messages_ids) return [];
  const getNextMessageMeta = function(gmail, ids, results) {
    let message_id = ids.pop();
    return getMessageMeta(gmail, message_id).then(message => {
      results.push(message.data);
      if (ids.length > 0) {
        return getNextMessageMeta(gmail, ids, results);
      } else {
        return results;
      }
    });
  };
  return getNextMessageMeta(gmail, messages_ids, []);
}

function toRelationships(messages) {
  let relationships = messages.reduce((result, item, index) => {
    let from_email = item.from.email;
    let to_email = item.to.email;
    let cc_emails = item.ccs.map(cc => cc.email);
    let receiver_emails = cc_emails.concat([to_email]);

    if (result[from_email]) {
      result[from_email] = result[from_email].concat(receiver_emails);
    } else {
      result[from_email] = receiver_emails;
    }

    return result;
  }, {});

  Object.keys(relationships).forEach(key => {
    relationships[key] = relationships[key].reduce((result, item, index) => {
      if (result[item]) {
        result[item] += 1;
      } else {
        result[item] = 1;
      }

      return result;
    }, {});
  }, {});

  return relationships;
}

async function googleAuth(req, res) {
  let code = req.body.code;
  let clientId = req.body.clientId;
  let redirectUri = req.body.redirectUri;
  //check if clientId and redirectUri are correct
  if (clientId !== config.auth.google.clientId) {
    let error = "googleAuth - error. Wrong clientId: " + clientId;
    console.log(error);
    res.status(400).json(error);
    return;
  }
  if (redirectUri !== config.auth.google.redirectUri) {
    let error = "googleAuth - error. Wrong redirectUri: " + redirectUri;
    console.log(error);
    res.status(400).json(error);
    return;
  }

  // get tokens
  let { tokens } = await oauth2Client.getToken(code);
  console.log("Authenticated with: ", tokens);
  oauth2Client.setCredentials(tokens);

  // open APIs
  let plus = google.plus({
    version: "v1",
    auth: oauth2Client
  });
  let gmail = google.gmail({
    version: "v1",
    auth: oauth2Client
  });
  // get and return profile
  Promise.all([
    plus.people.get({ userId: "me" }),
    gmail.users.getProfile({ userId: "me" })
  ])
    .then(responses => {
      let plus_data = responses[0].data;
      let gmail_data = responses[1].data;
      console.log("plus_data: ", plus_data);
      console.log("gmail_data: ", gmail_data);

      let profile = {
        name: plus_data.displayName,
        email: gmail_data.emailAddress,
        domain: plus_data.domain,
        logo_url: plus_data.image.url,
        first_name: plus_data.name.givenName,
        last_name: plus_data.name.familyName
      };
      res.json({ profile: profile });
    })
    .catch(err => {
      let error =
        "googleAuth – Error getting user profile from Google+ API: " + err;
      console.log(error);
    });

  // get list of emails
  /*listMessagesIds(gmail)
    .then(messages_list => {
      // get emails metadata
      console.log(`Loading ${messages_list.length} messages.`);
      let messages_ids = messages_list.map(obj => obj.id).slice(0, 10);
      return getMessagesMeta(gmail, messages_ids);
    })
    .then(messages_data => {
      console.log(`${messages_data.length} messages loaded!`);
      // format messages data
      let messages = formatMessagesMeta(messages_data);
      // calculate relationships from messages
      let relationships = toRelationships(messages);
      // response
      res.json({
        access_token: tokens.access_token,
        messages_data: messages_data,
        messages: messages,
        relationships: relationships
      });
    });*/

  /*Request(
    {
      method: "post",
      url: "https://accounts.google.com/o/oauth2/token",
      form: {
        code: req.body.code,
        client_id: config.auth.google.clientId,
        client_secret: config.auth.google.clientSecret,
        redirect_uri: req.body.redirectUri,
        grant_type: "authorization_code"
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      }
    },
    function(err, response, body) {
      try {
        if (!err && response.statusCode === 200) {
          var responseJson = JSON.parse(body);
          res.json(responseJson);
        } else {
          res.status(response.statusCode).json(err);
        }
      } catch (e) {
        res.status(500).json(err || e);
      }
    }
  );*/
}

/*function instagramAuth(req, res) {
  Request(
    {
      method: "post",
      url: "https://api.instagram.com/oauth/access_token",
      form: {
        code: req.body.code,
        client_id: config.auth.instagram.clientId,
        client_secret: config.auth.instagram.clientSecret,
        redirect_uri: req.body.redirectUri,
        grant_type: "authorization_code"
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      }
    },
    function(err, response, body) {
      try {
        if (!err && response.statusCode === 200) {
          var responseJson = JSON.parse(body);
          res.json(responseJson);
        } else {
          res.status(response.statusCode).json(err);
        }
      } catch (e) {
        res.status(500).json(err || e);
      }
    }
  );
}*/

/*function bitbucketAuth(req, res) {
  Request(
    {
      method: "post",
      url: "https://bitbucket.org/site/oauth2/access_token",
      form: {
        code: req.body.code,
        client_id: config.auth.bitbucket.clientId,
        client_secret: config.auth.bitbucket.clientSecret,
        redirect_uri: req.body.redirectUri,
        grant_type: "authorization_code"
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      }
    },
    function(err, response, body) {
      try {
        if (!err && response.statusCode === 200) {
          var responseJson = JSON.parse(body);
          res.json(responseJson);
        } else {
          res.status(response.statusCode).json(err);
        }
      } catch (e) {
        res.status(500).json(err || e);
      }
    }
  );
}*/

/*function linkedinAuth(req, res) {
  Request(
    {
      method: "post",
      url: "https://www.linkedin.com/oauth/v2/accessToken",
      form: {
        code: req.body.code,
        client_id: config.auth.linkedin.clientId,
        client_secret: config.auth.linkedin.clientSecret,
        redirect_uri: req.body.redirectUri,
        grant_type: "authorization_code"
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      }
    },
    function(err, response, body) {
      try {
        if (!err && response.statusCode === 200) {
          var responseJson = JSON.parse(body);
          res.json(responseJson);
        } else {
          res.status(response.statusCode).json(err);
        }
      } catch (e) {
        res.status(500).json(err || e);
      }
    }
  );
}*/

/*function liveAuth(req, res) {
  Request(
    {
      method: "post",
      url: "https://login.live.com/oauth20_token.srf",
      form: {
        code: req.body.code,
        client_id: config.auth.live.clientId,
        client_secret: config.auth.live.clientSecret,
        redirect_uri: req.body.redirectUri,
        grant_type: "authorization_code"
      },
      headers: {
        "content-type": "application/json"
      }
    },
    function(err, response, body) {
      try {
        if (!err && response.statusCode === 200) {
          var responseJson = JSON.parse(body);
          res.json(responseJson);
        } else {
          res.status(response.statusCode).json(err);
        }
      } catch (e) {
        res.status(500).json(err || e);
      }
    }
  );
}*/

/*oauthService = new OAuth.OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  config.auth.twitter.clientId,
  config.auth.twitter.clientSecret,
  "1.0A",
  null,
  "HMAC-SHA1"
);

function twitterAuth(req, res) {
  if (!req.body.oauth_token) {
    oauthService.getOAuthRequestToken(
      { oauth_callback: req.body.redirectUri },
      function(error, oauthToken, oauthTokenSecret, results) {
        if (error) {
          res.status(500).json(error);
        } else {
          res.json({
            oauth_token: oauthToken,
            oauth_token_secret: oauthTokenSecret
          });
        }
      }
    );
  } else {
    oauthService.getOAuthAccessToken(
      req.body.oauth_token,
      null,
      req.body.oauth_verifier,
      function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
        if (error) {
          res.status(500).json(error);
        } else {
          var verifyCredentialsUrl =
            "https://api.twitter.com/1.1/account/verify_credentials.json";
          var parameters = {
            oauth_consumer_key: config.auth.twitter.clientId,
            oauth_token: oauthAccessToken,
            oauth_nonce: "vueauth-" + new Date().getTime(),
            oauth_timestamp: timestamp.now(),
            oauth_signature_method: "HMAC-SHA1",
            oauth_version: "1.0"
          };

          var signature = oauthSignature.generate(
            "GET",
            verifyCredentialsUrl,
            parameters,
            config.auth.twitter.clientSecret,
            oauthAccessTokenSecret
          );

          Axios.get(
            "https://api.twitter.com/1.1/account/verify_credentials.json",
            {
              headers: {
                Authorization:
                  "OAuth " +
                  'oauth_consumer_key="' +
                  config.auth.twitter.clientId +
                  '",' +
                  'oauth_token="' +
                  oauthAccessToken +
                  '",' +
                  'oauth_nonce="' +
                  parameters.oauth_nonce +
                  '",' +
                  'oauth_timestamp="' +
                  parameters.oauth_timestamp +
                  '",' +
                  'oauth_signature_method="HMAC-SHA1",' +
                  'oauth_version="1.0",' +
                  'oauth_signature="' +
                  signature +
                  '"'
              }
            }
          )
            .then(function(response) {
              res.json({
                access_token: oauthAccessToken,
                access_token_secret: oauthAccessTokenSecret,

                profile: response.data
              });
            })
            .catch(function(err) {
              console.log(err.response.data.errors);
              res.status(500).json(err.response.data.errors);
            });
        }
      }
    );
  }
}*/

function parseQueryString(str) {
  let obj = {};
  let key;
  let value;
  (str || "").split("&").forEach(keyValue => {
    if (keyValue) {
      value = keyValue.split("=");
      key = decodeURIComponent(value[0]);
      obj[key] = !!value[1] ? decodeURIComponent(value[1]) : true;
    }
  });
  return obj;
}
