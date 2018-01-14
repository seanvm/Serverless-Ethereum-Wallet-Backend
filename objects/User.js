'use strict';

const Auth0Service = require('./Auth0');
const ManagementClient = require('auth0').ManagementClient;
const dynamo = require('serverless-dynamo-client');

class User {
  constructor(event, context, callback){
    this.user = [];
    this.callback = callback;
    this.userID = event.requestContext.authorizer.principalId;
    this.auth0 = new Auth0Service();
    this.db = dynamo.getDocumentClient({convertEmptyValues: true});
  };
  
  getInfo() {
    this.auth0.managementClient.getUser({ id: this.userID }).then(user =>{
      this.user = user;
      
      // Query database for Auth0 user
      var db = dynamo.getDocumentClient({convertEmptyValues: true});
      var params = {
        TableName: 'usersTable',
        KeyConditionExpression: "auth0ID = :auth0ID",
        ExpressionAttributeValues: {
            ":auth0ID": this.userID
        }
      };
      
      db.query(params).promise().then((data) => {
        this.user.hasAccount = data.Count > 0 ? true : false;
        this.responseHandler();
      });
    }).catch(err =>{
      var error = new Error('[500] Error Retrieving User')
      this.callback(error);
    });
  };
  
  responseHandler(){
    var response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin" : "*" // Required for CORS support to work
      },
      body: JSON.stringify({
        user: this.user,
        email: this.user.email,
        hasAccount: this.user.hasAccount,
        userID: this.userID
      }),
    };
    
    this.callback(null, response);
  };
  
};

module.exports = User;