// Load Module Dependencies

var moment = require("moment-timezone");
moment.tz.setDefault("Africa/Addis_Ababa");

var UserDal = require("../dal/user");

module.exports = (_REQ, _USER) => {
  console.log("Updating User Session Timeout...");

  console.log("-- PATH:", _REQ.route.path);

  if (!_REQ.route.path.includes("extendsession")) {
    let defaultSettionMinute = 5;

    let userQuery = {
      _id: _USER._id,
    };

    let updateData = {
      sessionExpiresOn: moment()
        .add(defaultSettionMinute, "minutes")
        .toISOString(),
      lastModified: moment().toISOString(),
    };

    console.log("this user sesison update data: ", updateData);

    UserDal.update(userQuery, updateData, (err, user) => {
      if (err) {
        console.log("THIS ERROR ON UPDATE USER SESSION PERIOD: ", err.message);
      }

      if (!user || Object.keys(user).length === 0)
        console.log("USER SESSION PERIOD NOT UPDATED");
      else console.log("USER SESSION EXPIRES ON: ", user.sessionExpiresOn);

      return;
    });
  } else {
    console.log("EXTEND SESSION REQUEST...");
    console.log("HANDLED IN CONTROLLER");
  }
};
