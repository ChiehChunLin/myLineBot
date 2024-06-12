"use strict";

const dotenv = require("dotenv").config();
const mysql = require("mysql2");
const line = require("@line/bot-sdk");
const fs = require("fs");
const path = require("path");
const util = require("util");
const { pipeline } = require("stream");
const { S3Client } = require("@aws-sdk/client-s3");

const bucketName = process.env.AWS_S3_BUCKET_NAME;
const s3Client = new S3Client({
  region: process.env.AWS_S3_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_ACCESS_SECRET_KEY
  }
});

const baseURL = process.env.LINE_CHANNEL_BASE_URL;

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
});
const blobClient = new line.messagingApi.MessagingApiBlobClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

const configDB = [
  {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE //myBaby
  },
  {
    host: process.env.AWS_RDS_HOST,
    user: process.env.AWS_RDS_USERNAME,
    password: process.env.AWS_RDS_PASSWORD,
    database: process.env.MYSQL_DATABASE //myBaby
  }
];
const conn = mysql.createPool(configDB[0]).promise();

//===========================================
//=========  LINE Bot Function  =============
//===========================================

const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage({
    replyToken: token,
    messages: texts.map((text) => ({ type: "text", text }))
  });
};
function handleEvent(event) {
  if (event.replyToken && event.replyToken.match(/^(.)\1*$/)) {
    return console.log("Test hook recieved: " + JSON.stringify(event.message));
  }

  switch (event.type) {
    case "message":
      const message = event.message;
      switch (message.type) {
        case "text":
          return handleText(message, event.replyToken, event.source);
        case "image":
          return handleImage(message, event.replyToken);
        case "video":
          return handleVideo(message, event.replyToken);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    case "join":
      return replyText(event.replyToken, `Joined ${event.source.type}`);

    case "leave":
      return console.log(`Left: ${JSON.stringify(event)}`);

    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}
async function handleText(message, replyToken, source) {
  const buttonsImageURL = `${baseURL}/static/buttons/1040.jpg`;

  switch (message.text) {
    case "profile":
      if (source.userId) {
        return client
          .getProfile(source.userId)
          .then((profile) =>
            replyText(replyToken, [
              `Display name: ${profile.displayName}`,
              `Status message: ${profile.statusMessage}`
            ])
          );
      } else {
        return replyText(
          replyToken,
          "Bot can't use profile API without user ID"
        );
      }
    case "buttons":
      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "template",
            altText: "Buttons alt text",
            template: {
              type: "buttons",
              thumbnailImageUrl: buttonsImageURL,
              title: "My button sample",
              text: "Hello, my button",
              actions: [
                { label: "Go to line.me", type: "uri", uri: "https://line.me" },
                {
                  label: "Say hello1",
                  type: "postback",
                  data: "hello こんにちは"
                },
                {
                  label: "言 hello2",
                  type: "postback",
                  data: "hello こんにちは",
                  text: "hello こんにちは"
                },
                { label: "Say message", type: "message", text: "Rice=米" }
              ]
            }
          }
        ]
      });
    case "confirm":
      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "template",
            altText: "Confirm alt text",
            template: {
              type: "confirm",
              text: "Do it?",
              actions: [
                { label: "Yes", type: "message", text: "Yes!" },
                { label: "No", type: "message", text: "No!" }
              ]
            }
          }
        ]
      });
    case "carousel":
      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "template",
            altText: "Carousel alt text",
            template: {
              type: "carousel",
              columns: [
                {
                  thumbnailImageUrl: buttonsImageURL,
                  title: "hoge",
                  text: "fuga",
                  actions: [
                    {
                      label: "Go to line.me",
                      type: "uri",
                      uri: "https://line.me"
                    },
                    {
                      label: "Say hello1",
                      type: "postback",
                      data: "hello こんにちは"
                    }
                  ]
                },
                {
                  thumbnailImageUrl: buttonsImageURL,
                  title: "hoge",
                  text: "fuga",
                  actions: [
                    {
                      label: "言 hello2",
                      type: "postback",
                      data: "hello こんにちは",
                      text: "hello こんにちは"
                    },
                    { label: "Say message", type: "message", text: "Rice=米" }
                  ]
                }
              ]
            }
          }
        ]
      });
    case "image carousel":
      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "template",
            altText: "Image carousel alt text",
            template: {
              type: "image_carousel",
              columns: [
                {
                  imageUrl: buttonsImageURL,
                  action: {
                    label: "Go to LINE",
                    type: "uri",
                    uri: "https://line.me"
                  }
                },
                {
                  imageUrl: buttonsImageURL,
                  action: {
                    label: "Say hello1",
                    type: "postback",
                    data: "hello こんにちは"
                  }
                },
                {
                  imageUrl: buttonsImageURL,
                  action: {
                    label: "Say message",
                    type: "message",
                    text: "Rice=米"
                  }
                },
                {
                  imageUrl: buttonsImageURL,
                  action: {
                    label: "datetime",
                    type: "datetimepicker",
                    data: "DATETIME",
                    mode: "datetime"
                  }
                }
              ]
            }
          }
        ]
      });
    case "datetime":
      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "template",
            altText: "Datetime pickers alt text",
            template: {
              type: "buttons",
              text: "Select date / time !",
              actions: [
                {
                  type: "datetimepicker",
                  label: "date",
                  data: "DATE",
                  mode: "date"
                },
                {
                  type: "datetimepicker",
                  label: "time",
                  data: "TIME",
                  mode: "time"
                },
                {
                  type: "datetimepicker",
                  label: "datetime",
                  data: "DATETIME",
                  mode: "datetime"
                }
              ]
            }
          }
        ]
      });
    case "imagemap":
      return client.replyMessage({
        replyToken,
        messages: [
          {
            type: "imagemap",
            baseUrl: `${baseURL}/static/rich`,
            altText: "Imagemap alt text",
            baseSize: { width: 1040, height: 1040 },
            actions: [
              {
                area: { x: 0, y: 0, width: 520, height: 520 },
                type: "uri",
                linkUri: "https://store.line.me/family/manga/en"
              },
              {
                area: { x: 520, y: 0, width: 520, height: 520 },
                type: "uri",
                linkUri: "https://store.line.me/family/music/en"
              },
              {
                area: { x: 0, y: 520, width: 520, height: 520 },
                type: "uri",
                linkUri: "https://store.line.me/family/play/en"
              },
              {
                area: { x: 520, y: 520, width: 520, height: 520 },
                type: "message",
                text: "URANAI!"
              }
            ],
            video: {
              originalContentUrl: `${baseURL}/static/imagemap/video.mp4`,
              previewImageUrl: `${baseURL}/static/imagemap/preview.jpg`,
              area: {
                x: 280,
                y: 385,
                width: 480,
                height: 270
              },
              externalLink: {
                linkUri: "https://line.me",
                label: "LINE"
              }
            }
          }
        ]
      });
    case "bye":
      switch (source.type) {
        case "user":
          return replyText(replyToken, "Bot can't leave from 1:1 chat");
        case "group":
          return replyText(replyToken, "Leaving group").then(() =>
            client.leaveGroup(source.groupId)
          );
        case "room":
          return replyText(replyToken, "Leaving room").then(() =>
            client.leaveRoom(source.roomId)
          );
      }
    default:
      console.log(`Echo message to ${replyToken}: ${message.text}`);
      return replyText(replyToken, message.text);
  }
}
async function handleImage(message, replyToken) {
  function sendReply(originalContentUrl, previewImageUrl) {
    return client.replyMessage({
      replyToken,
      messages: [
        {
          type: "image",
          originalContentUrl,
          previewImageUrl
        }
      ]
    });
  }
  try {
    if (message.contentProvider.type === "line") {
      const downloadPath = path.join(
        __dirname,
        "downloaded",
        `${message.id}.jpg`
      );
      const previewPath = path.join(
        __dirname,
        "downloaded",
        `${message.id}-preview.jpg`
      );

      // await downloadContent(message.id, downloadPath);
      //await saveContentToS3(message.id, path.extname(downloadPath));
    }
    return replyText(replyToken, "images are saved.");
  } catch (err) {
    console.log(err.message);
    return replyText(replyToken, "images fail to save.");
  }
}
async function handleVideo(message, replyToken) {
  console.log(`handleVideo: ${replyToken} ${JSON.stringify(message)}}`);

  function sendReply(originalContentUrl, previewImageUrl) {
    return client.replyMessage({
      replyToken,
      messages: [
        {
          type: "video",
          originalContentUrl,
          previewImageUrl
        }
      ]
    });
  }
  try {
    if (message.contentProvider.type === "line") {
      const downloadPath = path.join(
        __dirname,
        "downloaded",
        `${message.id}.mp4`
      );
      const previewPath = path.join(
        __dirname,
        "downloaded",
        `${message.id}-preview.jpg`
      );

      // await downloadContent(message.id, downloadPath);
      // await saveContentToS3(message.id, path.extname(downloadPath));

      return replyText(replyToken, "videos are saved.");
    }
  } catch (err) {
    console.log(err.message);
    return replyText(replyToken, "videos fail to save.");
  }
}
async function downloadContent(messageId, downloadPath) {
  const stream = await blobClient.getMessageContent(messageId);

  const pipelineAsync = util.promisify(pipeline);

  const writable = fs.createWriteStream(downloadPath);
  const date = new Date().toISOString().slice(0, 10); //YYYY-MM-DD
  await pipelineAsync(stream, writable);
  await setImage(conn, 1, 1, messageId, date);
}
async function saveContentToS3(messageId, filetype) {
  const stream = await blobClient.getMessageContent(messageId);
  const filepath = new Date().toISOString().slice(0, 10); //YYYY-MM-DD
  const filename = messageId;
  const fullname = `/${filepath}/${filename}${filetype}`;
  console.log(fullname);
  try {
    const awsResult = await putStreamImageS3(stream, filename, filetype);
    if (awsResult.$metadata.httpStatusCode !== 200) {
      throw new Error("image upload to S3 failed!");
    }
    await setImage(conn, 1, 1, filename, filepath);
  } catch (err) {
    console.log("S3 Error: " + err.message);
  }
}
//===========================================
//=========   AWS S3 Function   =============
//===========================================
async function putStreamImageS3(stream, filename, filetype) {
  const params = {
    Bucket: bucketName,
    Key: filename, //s3 will replace the same name object!
    Body: stream,
    ContentType: filetype
  };

  const data = await s3Client.send(new PutObjectCommand(params));
  return data;
}
//===========================================
//=========   AWS RDS Function   =============
//===========================================
async function setImage(conn, user_id, baby_id, filename, date) {
  const [rows] = await conn.query(
    `
     INSERT INTO images (user_id, baby_id, filename, imageDate)
     VALUES (?,?,?,?);
    `,
    [user_id, baby_id, filename, date]
  );
  console.log("setImage:" + JSON.stringify(rows));
  if (rows.length == 0 || !rows.insertId) {
    return undefined;
  } else {
    return rows.insertId;
  }
}
async function setText(conn, user_id, baby_id, content, date) {
  const [rows] = await conn.query(
    `
       INSERT INTO texts (user_id,baby_id,content,textDate)
       VALUES (?,?,?,?)
      `,
    [user_id, baby_id, content, date]
  );
  // console.log("setImage:" + JSON.stringify(rows));
  if (rows.length == 0 || !rows.insertId) {
    return undefined;
  } else {
    return rows.insertId;
  }
}

exports.handler = async (event, context) => {
  //============= webhook verify =============
  // event: {
  //     "destination": "U1e7165f3c3db2ce3142eb75643c61ec6",
  //     "events": []
  // }
  //============= webhook text =============
  // event:
  // {
  //     "destination": "U1e7165f3c3db2ce3142eb75643c61ec6",
  //     "events": [
  //         {
  //             "type": "message",
  //             "message": {
  //                 "type": "text",
  //                 "id": "512335253806252212",
  //                 "quoteToken": "-xNx9ZChBm3zj_V29PHxPqaTXrAktk37CxS7lup28l9Z93hhBB5DPFt_TDIZSrRxkZUD_AjV8Sreyw7lb3SNRsuwzhEQJEBh2NC3f4Tddxu4BakhV_Ni4W1imb0s0LcMNbkn-xxV6G6zJZCe5cSCNg",
  //                 "text": "Hi"
  //             },
  //             "webhookEventId": "01J06HSP0XFRZEMNF23YQVATH9",
  //             "deliveryContext": {
  //                 "isRedelivery": false
  //             },
  //             "timestamp": 1718206912151,
  //             "source": {
  //                 "type": "user",
  //                 "userId": "U9acc24aec8497b5e7159c861f9079b71"
  //             },
  //             "replyToken": "9e113d72de604ef8ae4a11b9579bfbfe",
  //             "mode": "active"
  //         }
  //     ]
  // }
  //============= webhook image =============
  // event:
  // {
  //     "destination": "U1e7165f3c3db2ce3142eb75643c61ec6",
  //     "events": [
  //         {
  //             "type": "message",
  //             "message": {
  //                 "type": "image",
  //                 "id": "512335452397633621",
  //                 "quoteToken": "TAn18IYmEkMwiDao0o2i6LUoSvMDpwP43qia-pr47XsL1C3W5dAuxRdH1upexdGQgw8u5tQyPF3JEwKz-rMXE-K2znl6TG010IPJdaq7ynWlAzVevpkaj4OheiQjn2x2he6CFscjUEIRApm2CjDxgQ",
  //                 "contentProvider": {
  //                     "type": "line"
  //                 }
  //             },
  //             "webhookEventId": "01J06HXA0PDB9GG18KB68CH51M",
  //             "deliveryContext": {
  //                 "isRedelivery": false
  //             },
  //             "timestamp": 1718207031184,
  //             "source": {
  //                 "type": "user",
  //                 "userId": "U9acc24aec8497b5e7159c861f9079b71"
  //             },
  //             "replyToken": "945058e8208c4c19aaa0ef014d2f39cc",
  //             "mode": "active"
  //         }
  //     ]
  // }
  //============================================
  // context:
  // {
  //     "callbackWaitsForEmptyEventLoop": true,
  //     "functionVersion": "$LATEST",
  //     "functionName": "myLambda",
  //     "memoryLimitInMB": "128",
  //     "logGroupName": "/aws/lambda/myLambda",
  //     "logStreamName": "2024/06/12/[$LATEST]35e9060352fb481ba2c6b74ac5a5cca1",
  //     "invokedFunctionArn": "arn:aws:lambda:ap-southeast-2:339713146144:function:myLambda",
  //     "awsRequestId": "fc953efe-b09d-4eeb-b452-9262703c750f"
  // }

  if (event.events.length == 0) {
    console.log("Line webhook Verify return statusCode 200");
    return { statusCode: 200, body: "" };
  }

  if (event.destination) {
    console.log("Destination User ID: " + event.destination);
  }
  if (!Array.isArray(event.events)) {
    return { statusCode: 500 };
  }

  try {
    const result = await Promise.all(event.events.map(handleEvent));
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500 };
  }
};
