const axios = require('axios');

module.exports = function checkEmailValidity(email) {

  console.log(email)
  return new Promise(async (resolve,reject) => {
    try {
      
       
        const options = {
          method: 'GET',
          url: 'https://api.dev.me/v1-get-email-details',
          params: {email: email,verifySmtp: true,verifyMx:true},
          headers: {Accept: 'application/json', 'x-api-key': '6591adae2ea845ff0fe1b95a-3b86b0d26e89'}
        };
        
        axios.request(options).then(function (response) {
          // console.log(response.data);
          return resolve(response.data);
        }).catch(function (error) {
          console.log(error);
          return resolve(false)
        });
    } catch (error) {
      console.error("Error occurred:", error);
      return resolve(false);
    }
  })
  
};
