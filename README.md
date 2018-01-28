# Serverless Ethereum Wallet (Backend)
This is the backend application for a lightweight Ethereum wallet. The backend for this application is written in Node.js, and utilizes the [serverless framework](https://github.com/serverless/serverless) for AWS Lambda. Authentication is handled via Auth0.

The front-end companion project can be found here: [Serverless Ethereum Wallet Frontend](https://github.com/seanvm/Serverless-Ethereum-Wallet-Frontend)

This is both a WIP, and a proof of concept, and is very limited in functionality. As such, **it should only be used with the Ethereum testnet**. 

## Requirements
- To run this application you must have an AWS account and be familiar with [deploying serverless applications](https://serverless.com/framework/docs/providers/aws/guide/deploying/).
- You must have an Auth0 account.
- You must either be running an Ethereum node, or use a service such as [Infura](https://infura.io/)

## Setup

1. Install npm dependencies:
```
npm install
```
2. Install DynamoDB locally
```
sls dynamodb install
```
3. You must create and populate a `secrets.yml` file. Reference the `environment.yml` file to see which items are required.

4. The default configuration assumes you are using Infura. If you are using your own node, you will need to swap the `HttpProvider` URL in the `objects/Wallet.js` file.

5. To run the app locally:
```
npm start
```

## Deploying

If you are running `npm install` on OSX or Windows, you may need to rebuild the node_modules folder from within a Docker container running Linux before this app will work on AWS Lambda. An explanation of this workaround can be found [here](https://www.thepolyglotdeveloper.com/2017/12/deploying-native-nodejs-dependencies-aws-lambda/).

If this is the case, simply run the following commands:

1. Build the container
```
docker build -t eth .
```

2. Run the container. This will open up the terminal within the container:
```
docker run -v $(pwd):/eth -it eth:latest
```

3. Run the commands manually from the `./bin/dockerCommands.sh` file:
```
source /root/.nvm/nvm.sh 
nvm use 6.10
cd eth && npm rebuild
```

4. This should update your node_modules folder with the proper modules compiled for linux. You can now run `npm run deploy` to deploy to AWS.

## API

All authentication is handled via Auth0. You will need to obtain an access token (JWT) to submit requests to the API.

The following endpoints are current available:
* Wallets
  * /wallet/create
  * /wallet/balance

* Users
  * /user/get
