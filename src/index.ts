import express, { Request, Response,NextFunction } from 'express';
// import {authenticate} from './middlewares/authMiddleware'
// const authenticate = require("./lib/authenticate");
import { generateToken } from './utils/jwt';
import  authenticate  from './lib/authenticate';
import config from './config';
import cors from 'cors';

import mongoDB from "./mongoDB/mongoDB";

global._CONFIG = config;

import Router from './routes/index';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb" }));

mongoDB.connect();

// Function to validate the database connection
async function validateDBConnection() {
    try {
  
      // If the query executes successfully, the database connection is valid
      console.log('Database connection is valid');
  
    } catch (error) {
      console.error('Database connection validation failed:', error);
    }
  }
  
  app.use(cors());
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Accept, Content-Type, access-control-allow-origin, x-api-applicationid, authorization"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "OPITIONS, GET, PUT, PATCH, POST, DELETE"
    );
    next();
  });


  //Free From Guard route
  app.use(
    authenticate().unless({
      path: [
         "/addisfix/services/healthcheck",
         "/addisfix/services/create-service",
         "/addisfix/services/get-services",
         "/addisfix/services/update-services",
         "/addisfix/services/delete-services"
      ],
    })
  );

  Router(app);

app.use((req:Request,res:Response, next: NextFunction)=>{
   res.status(404).send('Route not found');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
