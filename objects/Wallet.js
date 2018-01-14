'use strict';

const Web3 = require('Web3');
// http://web3js.readthedocs.io/en/1.0/

const dynamo = require('serverless-dynamo-client');

class Wallet {
  constructor(event, context, callback){
    this.callback = callback;
    this.userID = event.requestContext.authorizer.principalId;
    this.balance = 0;
    this.publicKey = '';
    this.privateKey = '';
    
    this.web3 = new Web3();
    this.web3.setProvider(new this.web3.providers.HttpProvider(`https://rinkeby.infura.io/${process.env.INFURA}`)); // TODO: Move URLs into environment config
    this.db = dynamo.getDocumentClient({convertEmptyValues: true});
  };
  
  create(){
    var account = this.web3.eth.accounts.create();
    var wallet = this.web3.eth.accounts.wallet.add(account);
    var params = {
      TableName: 'usersTable',
      Item:{
        auth0ID: this.userID,
        publicKey: account.address,
        privateKey: account.privateKey
      }
    };
    
    return this.db.put(params).promise().then(data => {
      this.publicKey = params.Item.publicKey;
      this.balance = 0;
      
      this.responseHandler();
    });
  };
  
  getBalance(){
    var params = {
      TableName: 'usersTable',
      KeyConditionExpression: "auth0ID = :auth0ID",
      ExpressionAttributeValues: {
          ":auth0ID": this.userID
      }
    };
    
    this.db.query(params).promise().then((data) => {
      // If no wallet exists for the current user, create a new one
      if(data.Count == 0){
        this.create()
      }else{
        this.publicKey = data.Items[0].publicKey;
        this.web3.eth.getBalance(this.publicKey).then(balance =>{
          this.balance = balance;
          this.responseHandler();
        });
      }
    });
	};
	
	responseHandler(){
    var response = {
      statusCode: 200,
      body: JSON.stringify({
        balance: this.balance,
        publicKey: this.publicKey,
        event: this.userID
      }),
    };
    
    this.callback(null, response);
  };
};

module.exports = Wallet;