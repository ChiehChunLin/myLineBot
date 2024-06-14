"use strict";

const dotenv = require("dotenv").config();
const fs = require("fs");
const path = require("path");
const util = require("util");
const line = require("@line/bot-sdk");
const { pipeline } = require("stream");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const funcDB = {
  SET_IMAGE: "setImage",
  SET_TEXT: "setText"
};
const lambdaClient = new LambdaClient({
  region: process.env.AWS_LAMBDA_REGION
});

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
  httpConfig: {
    timeout: 30000 // 设置超时时间为30秒
  }
});
const blobClient = new line.messagingApi.MessagingApiBlobClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

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
      await saveContentToS3(message.id, downloadPath);
    }
    return replyText(replyToken, "images are saved.");
  } catch (err) {
    console.log(err.message);
    return replyText(replyToken, "images fail to save.");
  }
}
async function handleVideo(message, replyToken) {
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
      await saveContentToS3(message.id, downloadPath);

      return replyText(replyToken, "videos are saved.");
    }
  } catch (err) {
    console.log(err.message);
    return replyText(replyToken, "videos fail to save.");
  }
}
async function saveContentToS3(messageId, downloadPath) {
  const stream = await blobClient.getMessageContent(messageId);
  const filepath = new Date().toISOString().slice(0, 10);
  const filename = messageId;
  const fullname = `${filepath}/${filename}`;
  const awsResult = await putStreamImageS3(
    stream,
    fullname,
    path.extname(downloadPath)
  );
  if (awsResult.$metadata.httpStatusCode !== 200) {
    console.log("S3 result: %j", awsResult);
    throw new Error("image upload to S3 failed!");
  }
  const result = await invokeLambdaDB(
    funcDB.SET_IMAGE,
    1,
    1,
    filepath,
    filename
  );
  if (result.statusCode != 200) {
    console.log("LambdaDB result: %j", result);
    throw new Error("Insert to DB failed!");
  }
}
//===========================================
//=========   AWS Lambda Function   =========
//===========================================
async function invokeLambdaDB(funcDB, user_id, baby_id, date, content) {
  const payloadData = {
    funcDB,
    user_id,
    baby_id,
    date,
    content
  };
  const params = {
    FunctionName: process.env.AWS_LAMBDA_INVOKE_FUNCTION_NAME,
    InvocationType: "RequestResponse",
    Payload: JSON.stringify(payloadData)
  };
  const command = new InvokeCommand(params);
  const response = await lambdaClient.send(command);
  return JSON.parse(new TextDecoder().decode(response.Payload));
}
//===========================================
//=========   AWS S3 Function   =============
//===========================================
async function putStreamImageS3(fileStream, filename, filetype) {
  try {
    const params = {
      Bucket: bucketName,
      Key: filename,
      Body: fileStream,
      ContentType: filetype
    };
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: params
    });

    parallelUploads3.on("httpUploadProgress", (progress) => {
      // console.log(progress);
    });

    const data = await parallelUploads3.done();
    return data;
  } catch (e) {
    console.log(e);
  }
}

exports.handler = async (event) => {
  {
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
  }
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
