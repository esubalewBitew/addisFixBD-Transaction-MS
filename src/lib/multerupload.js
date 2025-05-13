const multer = require("multer");
const aws = require("aws-sdk");
const _CONFIG = require("../config");

//filter images mime type
const filterFile = (req, res, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //console.log(file)
    cb(null, "");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

exports.upload = multer({ dest: "uploads/", storage: storage });

aws.config.update({
  secretAccessKey: _CONFIG._VALS.SECRET_ACCESS_KEY,
  accessKeyId: _CONFIG._VALS.ACCESS_KEY_ID,
  region: _CONFIG.AWS_LOCAL_CONFIG._region,
  correctClockSkew: true,
});
