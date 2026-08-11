import { Kafka } from "kafkajs";
import { type Types } from "mongoose";

let kafka: Kafka;
let producer: ReturnType<Kafka["producer"]>;

export interface ISMS {
  recipient: string;
  messageBody: string;
}

export interface IEmail {
  recipients: string[] | null;
  type: "otp" | "message" | "transaction" | "request";
  otpcode?: string;
  customerName?: string;
  messageBody?: string;
  transactionDetails?: {
    senderName: string;
    receiverName: string;
    receiverAccount: string;
    transactionType?: string;
    date: string | Date;
    amount: string;
    senderAccount?: string;
  };
  link?: string;
  subject?: string;
  receiver: string;
}

export interface IInApp {
  userID: Types.ObjectId;
  notificationType: string;
  notificationBody: string;
  notificationParts?: object;
}

export const kafkaProducer = async (
  topic: "sendSMS" | "sendEmail" | "sendInApp",
  message: ISMS | IEmail | IInApp
) => {
  const kafkaAddress = global?._CONFIG?._VALS?.KAFKA_ADDRESS;
  if (!kafkaAddress) {
    throw new Error("Kafka address is undefined.");
  }

  if (!kafka) {
    kafka = new Kafka({
      clientId: "addisfix-notification",
      brokers: [kafkaAddress],
    });

    producer = kafka.producer({
      allowAutoTopicCreation: true,

      retry: {
        initialRetryTime: 100,
        retries: 8,
      },

      maxInFlightRequests: 1,

      metadataMaxAge: 30000,
    });

    await producer.connect();
    console.log("Producer connected to Kafka");
  }

  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });

  console.log(`Message sent to topic "${topic}":`, message);
};

export default kafkaProducer;
