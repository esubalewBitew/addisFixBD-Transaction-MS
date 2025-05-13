const { Kafka } = require('kafkajs');
const config = require('../config');

const kafka = new Kafka({
  clientId: 'teletv',
  brokers: config._VALS.KAFKA_BROKERS
});

const topicName = 'teletv';

const producer = kafka.producer();

const processProducer = async () => {
  await producer.connect();
};

const produceMovieStat = async (message) => {
  console.log({ message, topic: topicName })
  await producer.send({
    topic: 'movie.stats',
    messages: [
      { value: JSON.stringify(message) }
    ]
  })
}

const produceProducerStat = async (message) => {
  console.log({ message, topic: topicName })
  await producer.send({
    topic: 'producer.stats',
    messages: [
      { value: JSON.stringify(message) }
    ]
  })
}

const produceAffiliateStat = async (message) => {
  console.log({ message, topic: topicName })
  await producer.send({
    topic: 'affiliate.stats',
    messages: [
      { value: JSON.stringify(message) }
    ]
  })
}

module.exports = { processProducer, produceMovieStat, produceProducerStat, produceAffiliateStat };
