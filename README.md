# Introduction
[myLineBot](https://github.com/ChiehChunLin/myLineBot) is a LINE Bot controller to service [myMoments](https://github.com/ChiehChunLin/myMoments), which is a product designed for families with children to help them record their child's daily activities, including time tracks, daily logs, and routine records. Families can browse photos, videos, and important moments of their child's growth, which are sure to bring smiles. Additionally, the routine data can be exported into charts for caregivers to view conveniently. Advanced features will integrate an AI facial recognition model to automatically detect and collect photos of the child uploaded by family and friends in communication groups into a baby album, saving parents the time of organizing photos.

### !! Notice !!
The main job of a LINE Bot controller is handling line events and put messages of images, videos, texts to AWS S3 and AWS RDS. Then [myMoments](https://github.com/ChiehChunLin/myMoments) can deal with messages to show on the web pages.

# Architecture
![Architecture]()

# Structure

```
├── controllers
├── database
├── myLambdaDB
│ ├── .env.temp
│ ├── index.js
│ ├── package.json
│ ├── package-lock.json
├── myLambdaS3
│ ├── .env.temp
│ ├── index.js
│ ├── package.json
│ ├── package-lock.json
├── utils
├── views
├── app.js
├── node_modules
├── package.json
├── package-lock.json
├── .env
└── .gitignore
```

# Installation 
## !! ensure the LINE Channel Setting in .env !!
1. run on server machine
```
npm install
node app.js
```
2. run on the severless lambda (two lambdas according to architecture above)
```
cd myLambdaS3
npm install
```
```
cd myLambdaDB
npm install
```

**package the node_modules and index.js as a zip file, and upload to aws lambda**

# Reference
* [LINE Developers](https://developers.line.biz/en/docs/messaging-api/overview/#send-different-message-types)
* [LINE Github](https://github.com/line/line-bot-sdk-nodejs/blob/master/examples/echo-bot/index.js)
* [APIGateway-SQS-Lambda](https://www.youtube.com/watch?v=AII6RRVq4Uo)
* [APIGateway-to-RESTAPI](https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/integrate-amazon-api-gateway-with-amazon-sqs-to-handle-asynchronous-rest-apis.html)