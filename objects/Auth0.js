'use strict';

const ManagementClient = require('auth0').ManagementClient;

class Auth0Service {
  constructor(){
    this.managementClient = new ManagementClient({
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_MANAGEMENT_CLIENTID,
      clientSecret: process.env.AUTH0_MANAGEMENT_SECRET,
    });
  };
  
  getUser(userID) {
    this.managementClient.getUser(userID).then(user => {
      return user;
    })
  };
};

module.exports = Auth0Service;