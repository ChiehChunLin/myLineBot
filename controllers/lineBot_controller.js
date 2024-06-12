const line = require("@line/bot-sdk");
const fs = require("fs");
const path = require("path");
const util = require("util");
const { pipeline } = require("stream");
const s3 = require("./awsS3_controller");
const { conn } = require("../database/connDB");
const imageDB = require("../database/imageDB");
const { getCryptoID } = require("../utils/cryptoGenerator");
const { getFormattedDate } = require("../utils/getFormattedDate");

const baseURL = process.env.LINE_CHANNEL_BASE_URL;
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
});
const blobClient = new line.messagingApi.MessagingApiBlobClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

const lineAuthCheck = line.middleware;
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
        path.dirname(__dirname),
        "downloaded",
        `${message.id}.jpg`
      );
      const previewPath = path.join(
        path.dirname(__dirname),
        "downloaded",
        `${message.id}-preview.jpg`
      );

      // await downloadContent(message.id, downloadPath);
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
        path.dirname(__dirname),
        "downloaded",
        `${message.id}.mp4`
      );
      const previewPath = path.join(
        path.dirname(__dirname),
        "downloaded",
        `${message.id}-preview.jpg`
      );

      // await downloadContent(message.id, downloadPath);
      await saveContentToS3(message.id, downloadPath);

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
  await pipelineAsync(stream, writable);
  await imageDB.setImage(conn, 1, 1, messageId, getFormattedDate());
}
async function saveContentToS3(messageId, downloadPath) {
  const stream = await blobClient.getMessageContent(messageId);
  const filepath = getFormattedDate();
  const filename = await getCryptoID();
  const fullname = `${filepath}/${filename}`;
  const awsResult = await s3.putStreamImageS3(
    stream,
    fullname,
    path.extname(downloadPath)
  );
  if (awsResult.$metadata.httpStatusCode !== 200) {
    throw new Error("image upload to S3 failed!");
  }
  await imageDB.setImage(conn, 1, 1, filename, filepath);
}
function getImageUrl(key) {
  return s3.getImageCDN(key);
}

module.exports = {
  config,
  lineAuthCheck,
  handleEvent,
  getImageUrl
};
