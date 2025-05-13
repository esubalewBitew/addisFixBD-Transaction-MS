const AWS = require('aws-sdk');
var _CONFIG = require("../config");
exports.uploadFile = (file, imgName, mimetype) => {

  const s3 = new AWS.S3({
    accessKeyId: _CONFIG._VALS.ACCESS_KEY_ID,
    secretAccessKey: _CONFIG._VALS.SECRET_ACCESS_KEY,
    region: 'us-east-1'
  });

  // Setting up S3 upload parameters
  const bucket = _CONFIG._VALS.bucketNAME; //process.env.S3BUCKET_NAME;

  const params = {
    Bucket: bucket,
    Key: imgName, // File name you want to save as in S3
    ContentType: mimetype,
    Body: file
  };


  return new Promise((resolve, reject) => {

    // Uploading files to the bucket
    s3.upload(params, function(err, data) {
      if (err) {
        reject({
          success: false,
          status: 400,
          message: err
        })
      }

      if (data) {
        return resolve({
          name: data.Key,
          imageLink: data.Location
        })
      } else {
        return reject({
          success: false,
          status: 400,
          message: "Unable to upload profile photo"
        })
      }

    });
  })

};
