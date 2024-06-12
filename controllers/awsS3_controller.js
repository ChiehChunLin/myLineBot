const fs = require("fs");
require("dotenv").config();
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: process.env.AWS_S3_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_ACCESS_SECRET_KEY
  }
});

const bucketName = process.env.AWS_S3_BUCKET_NAME;
const cdnURL = process.env.AWS_S3_CDN_URL;

function getImageCDN(key) {
  return cdnURL + key;
}

async function getImageS3(key) {
  try {
    const params = {
      Bucket: bucketName,
      Key: key
    };
    let command = new GetObjectCommand(params);
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (err) {
    console.error("Error getting image:", err);
    throw err;
  }
}
async function putImageS3(file) {
  const fileStream = fs.createReadStream(file.path);
  const params = {
    Bucket: bucketName,
    Key: file.filename, //s3 wil replace the same name object!
    Body: fileStream,
    ContentType: file.mimetype
  };

  const data = await s3Client.send(new PutObjectCommand(params));
  return data;
}
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

module.exports = {
  getImageCDN,
  getImageS3,
  putImageS3,
  putStreamImageS3
};