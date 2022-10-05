const AWS = require('aws-sdk');
const fs = require('fs');
const multiparty = require('multiparty');
const dotenv = require('dotenv');
const { genSessionId } = require('./genSessionId');

dotenv.config();

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
});

const s3 = new AWS.S3();

const uploadFile = (buffer, name) => {
    const params = {
      Body: buffer,
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${genSessionId()}`,
    };
    return s3.upload(params).promise();
};

exports.upload = uploadFile
  