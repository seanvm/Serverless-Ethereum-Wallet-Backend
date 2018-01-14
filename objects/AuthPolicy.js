'use strict';

class AuthPolicy {
  constructor(principal, awsAccountId, apiOptions){
    this.awsAccountId = awsAccountId;
    this.principalId = principal;
    this.version = "2012-10-17";
    this.pathRegex = new RegExp('^[/.a-zA-Z0-9-\*]+$');
    
    this.allowMethods = [];
    this.denyMethods = [];
    
    this.HttpVerb = {
      GET     : "GET",
      POST    : "POST",
      PUT     : "PUT",
      PATCH   : "PATCH",
      HEAD    : "HEAD",
      DELETE  : "DELETE",
      OPTIONS : "OPTIONS",
      ALL     : "*"
    };

    if (!apiOptions || !apiOptions.restApiId) {
      this.restApiId = "*";
    } else {
      this.restApiId = apiOptions.restApiId;
    }
    if (!apiOptions || !apiOptions.region) {
      this.region = "*";
    } else {
      this.region = apiOptions.region;
    }
    if (!apiOptions || !apiOptions.stage) {
      this.stage = "*";
    } else {
      this.stage = apiOptions.stage;
    }
  };
  
  static policyResources(event) {

    let tmp = event.methodArn.split(':')
    let apiGatewayArnTmp = tmp[5].split('/');
    let data = {
      apiGatewayArnTmp: apiGatewayArnTmp,
      awsAccountId: tmp[4],
      apiOptions: {
        region: tmp[3],
        restApiId: apiGatewayArnTmp[0],
        stage: apiGatewayArnTmp[1]
      },
      method: apiGatewayArnTmp[2],
      resource: '/' //root resource
    }
    if (data.apiGatewayArnTmp[3]) {
      data.resource += data.apiGatewayArnTmp.slice(3, data.apiGatewayArnTmp.length).join('/');
    }
    
    return data;
  };
  
  addMethod(effect, verb, resource, conditions) {
    if (verb != "*" && !this.HttpVerb.hasOwnProperty(verb)) {
      throw new Error("Invalid HTTP verb " + verb + ". Allowed verbs in AuthPolicy.HttpVerb");
    }

    if (!this.pathRegex.test(resource)) {
      throw new Error("Invalid resource path: " + resource + ". Path should match " + this.pathRegex);
    }

    var cleanedResource = resource;
    if (resource.substring(0, 1) == "/") {
        cleanedResource = resource.substring(1, resource.length);
    }
    var resourceArn = "arn:aws:execute-api:" +
      this.region + ":" +
      this.awsAccountId + ":" +
      this.restApiId + "/" +
      this.stage + "/" +
      verb + "/" +
      cleanedResource;

    if (effect.toLowerCase() == "allow") {
      this.allowMethods.push({
        resourceArn: resourceArn,
        conditions: conditions
      });
    } else if (effect.toLowerCase() == "deny") {
      this.denyMethods.push({
        resourceArn: resourceArn,
        conditions: conditions
      })
    }
  };
  
  getEmptyStatement(effect) {
    effect = effect.substring(0, 1).toUpperCase() + effect.substring(1, effect.length).toLowerCase();
    var statement = {};
    statement.Action = "execute-api:Invoke";
    statement.Effect = effect;
    statement.Resource = [];

    return statement;
  };
  
  getStatementsForEffect(effect, methods) {
    var statements = [];

    if (methods.length > 0) {
      var statement = this.getEmptyStatement(effect);

      for (var i = 0; i < methods.length; i++) {
        var curMethod = methods[i];
        if (curMethod.conditions === null || curMethod.conditions.length === 0) {
          statement.Resource.push(curMethod.resourceArn);
        } else {
          var conditionalStatement = this.getEmptyStatement(effect);
          conditionalStatement.Resource.push(curMethod.resourceArn);
          conditionalStatement.Condition = curMethod.conditions;
          statements.push(conditionalStatement);
        }
      }

      if (statement.Resource !== null && statement.Resource.length > 0) {
        statements.push(statement);
      }
    }

    return statements;
  };
  
  allowAllMethods() {
    this.addMethod.call(this, "allow", "*", "*", null);
  };

  denyAllMethods() {
    this.addMethod.call(this, "deny", "*", "*", null);
  };

  allowMethod(verb, resource) {
    this.addMethod.call(this, "allow", verb, resource, null);
  };

  denyMethod (verb, resource) {
    this.addMethod.call(this, "deny", verb, resource, null);
  };

  allowMethodWithConditions(verb, resource, conditions) {
    this.addMethod.call(this, "allow", verb, resource, conditions);
  };

  denyMethodWithConditions (verb, resource, conditions) {
    this.addMethod.call(this, "deny", verb, resource, conditions);
  };

  build() {
    if ((!this.allowMethods || this.allowMethods.length === 0) &&
        (!this.denyMethods || this.denyMethods.length === 0)) {
      throw new Error("No statements defined for the policy");
    }

    var policy = {};
    policy.principalId = this.principalId;
    var doc = {};
    doc.Version = this.version;
    doc.Statement = [];

    doc.Statement = doc.Statement.concat(this.getStatementsForEffect.call(this, "Allow", this.allowMethods));
    doc.Statement = doc.Statement.concat(this.getStatementsForEffect.call(this, "Deny", this.denyMethods));

    policy.policyDocument = doc;

    return policy;
  }
  
};

module.exports = AuthPolicy;