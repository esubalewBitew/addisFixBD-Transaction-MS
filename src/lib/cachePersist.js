var Redis = require('ioredis')
const redis = new Redis()

const DeviceDal = require('../dal/device');
const prepareForBulkWrite = (devicePayload) => {

	let bulkData = []

	devicePayload.map(_payload => {

	  let $set = {}

	  if (_payload?.deviceID) $set.deviceID = _payload?.deviceID
      if (_payload?.watchedHour) $set.watchedHour = _payload?.watchedHour
      if (_payload?.deviceID) $set.lastStoppedAt = _payload?.lastStoppedAt

	  bulkData.push({
		updateOne: {
		  filter: {
			deviceID: _payload.deviceID,
		  },
		  update: {
			 $set
		  },
		  upsert: true
		}
	  })
	})

	return bulkData
}

module.exports = function cachePersist() {

    redis.keys('*', async function (err, keys) {
        if(err) {
            console.log('ERROR: ', err)
            return
        } else {

            const steamCacheOnly = keys.filter(key => key.includes('STREAM'))

            // const values = await redis.keys(steamCacheOnly);
            const values = []

            console.log({values})
            if(values){

                const items = values.map(_values => JSON.parse(_values));

                let bulkTransactionStatData = prepareForBulkWrite(items)

                DeviceDal.bulkWriteToDevices(bulkTransactionStatData, (err, info) => {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    // console.log("bulk write response " , info)
                })
            }

        }
    });
}
