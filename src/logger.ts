import winston from 'winston';
import 'winston-daily-rotate-file';

import moment from 'moment';

import axios from "axios";

const transport = new winston.transports.File({
    filename: 'logs/authservices.log',
    maxsize: 10000000,
    maxFiles: 10
});

const consoleTransport = new winston.transports.Console();

interface CustomLogger extends winston.Logger {
    logInfo: (message: string, logToConsole?: boolean) => void;
    logError: (message: string, logToConsole?: boolean) => void;
    logAXIOS: (message: string, level: string) => void;
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        transport,
        // new winston.transports.Console()
    ]
}) as CustomLogger

logger.logInfo = function (message: string): void {
    this.info(message);
};

logger.logError = function (message: string): void {
    this.error(message)
};

logger.logAXIOS = function (message: string, level: string): void {    
    try {
        this.log(level, message);
        // axios.post(
        //     // 'http://172.24.15.4:19993/v1.0/chatbirrapi/log/kafka/test', 
        //     `http://${global._CONFIG._VALS.IP}:19993/v1.0/chatbirrapi/log/kafka/test`, 
        //     {
        //         "clientid":"sudperapp-clientid",
        //         "topic":"activitylog",
        //         "message":`${moment().format('YYYY-MM-DD hh:mm:ss')} ${level}: ${message}`
        //     }, {
        //     headers: {
        //     "Content-Type": `application/json`,
        //     },
        //     timeout: 60000,
        // });
    } catch (error:any) {
        console.log('error making log call', error.message)
    }
};

export default logger