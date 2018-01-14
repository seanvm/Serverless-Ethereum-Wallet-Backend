'use strict';

const Wallet = require('./objects/Wallet');
const User = require('./objects/User');
const AuthPolicy = require('./objects/AuthPolicy');
const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

// TODO: Implement auth0Authorizer npm module
// const auth0Authorizer = require('npm-auth0-authorizer/methods/auth0Authorizer');

module.exports.createWallet = (event, context, callback) => {
  // Create wallet with web3 and insert into dynamoDB
  var wallet = new Wallet(event, context, callback);
  wallet.create()
};

module.exports.getWalletBalance = (event, context, callback) => {
  // Get the balance of the current user's wallet using web3
  var wallet = new Wallet(event, context, callback);
  wallet.getBalance()
};

module.exports.getUserInfo = (event, context, callback) => {
  // Retrieve user info from Auth0 and DynamoDB
  var user = new User(event, context, callback);
  user.getInfo();
};

// TODO: Add transaction capability
// module.exports.newTransaction = (event, context, callback) => {
  
// };

module.exports.auth0Authorizer = function(event, context, callback){  
  let client = jwksClient({
    strictSsl: true, // Default value
    jwksUri : 'https://' + process.env.AUTH0_DOMAIN + '/.well-known/jwks.json'
  });

  let policyResources = AuthPolicy.policyResources(event);
  client.getKeys((err, key) => {
    client.getSigningKey(key[0].kid, (err, key) => {
      const signingKey = key.publicKey || key.rsaPublicKey;
      const token = event.authorizationToken.substring(7);
      
      jwt.verify(token, signingKey, { algorithms: ['RS256'] }, (err, payload) => {
        let principalId = payload ? payload.sub : 'invalidJWT';
        const policy = new AuthPolicy(principalId, policyResources.awsAccountId, policyResources.apiOptions);
        payload ? policy.allowAllMethods() : policy.denyAllMethods();
        let authResponse = policy.build();
        return callback(null, authResponse);
      });
    });
  });
};

// TODO: Implement auth0Authorizer npm module
// module.exports.auth0Authorizer = function(event, context, callback){
//   auth0Authorizer(event).then(success => {
//     return callback(null, success);
//   }).catch(err => {
//     return callback(err);
//   });
// };