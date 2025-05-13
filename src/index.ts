// src/index.ts
import express, { Request, Response,NextFunction } from 'express';
// import {authenticate} from './middlewares/authMiddleware'
// const authenticate = require("./lib/authenticate");
import { generateToken } from './utils/jwt';
import  authenticate  from './lib/authenticate';
const cors = require("cors");

// import Route from './routes/index.js';

//import Route from './routes/index.ts';
import Router from './routes/index';



const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb" }));

// Function to validate the database connection
async function validateDBConnection() {
    try {
      // Execute a simple query to check the connectivity
      //const result = await prismaRead.$queryRaw`SELECT 1`;
  
      // If the query executes successfully, the database connection is valid
      console.log('Database connection is valid');
  
    } catch (error) {
      // If an error occurs, the database connection is not valid
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



// app.post('/login', (req: Request, res: Response) => {
//     const user = { id: 1, name: 'John Doe' };
//     const token = generateToken(user);
//     res.json({ token });
//   });

//   app.get('/profile', authenticate, (req: any, res: Response) => {
//     res.json({ message: 'Welcome to your profile!', user: req.user });
//   });
  

// app.get('/', (req: Request, res: Response) => {
//   res.send('Hello from Express + TypeScript!');
// });

// app.get('/login', (req: Request, res: Response) => {
//     res.send('Hello Welcome to Addis Fix Route')
//   });

  //Free From Guard route
  app.use(
    authenticate().unless({
      path: [
        "/addisfix/auth/healthcheck",
        "/addisfix/auth/login",
       // "/v1.0/addisfix/auth/devicecheck",
        // "/v1.0/addisfix/auth/phonenumbercheck",
        // "/v1.0/addisfix/auth/phonenumbercheck_v2",
        // "/v1.0/addisfix/otp/app/request/merchant/pinops",
        // "/v1.0/addisfix/otp/app/request/pinops",
        // "/v1.0/addisfix/otp/dash/request/pinops",
        // "/v1.0/addisfix/otp/dash/request/dashops",
        // "/v1.0/addisfix/otp/app/request/agentops",
        // "/v1.0/addisfix/otp/dash/request/ldapops",
        // "/v1.0/addisfix/otp/app/request/presignup",
        // "/v1.0/addisfix/otp/app/request/virtualpresignup",
        // "/v1.0/addisfix/otp/app/confirm/presignup",
        // "/v1.0/addisfix/otp/app/confirm/virtualpresignup",
        // "/v1.0/addisfix/auth/app/prepinops",
        // "/v1.0/addisfix/auth/app/prepinops_v2",
        // "/v1.0/addisfix/otp/app/confirm/merchant/pinops",
        // "/v1.0/addisfix/otp/app/confirm/pinops",
        // // "/v1.0/addisfix/otp/dash/confirm/dashops",
        // // "/v1.0/addisfix/auth/app/pinops/merchant/pinlogin",
        // "/v1.0/addisfix/auth/app/pinops/pinlogin",
        // "/v1.0/addisfix/location/regions",
        // "/v1.0/addisfix/auth/signup/selfmember",
        // "/v1.0/top-hit-counts",
        // "/v1.0/addisfix/auth/app/kyc/sdktoken",
        // "/v1.0/addisfix/auth/app/kyc/check/document",
        // "/v1.0/addisfix/auth/app/kyc/check/identity",
        // "/v1.0/addisfix/auth/app/kyc/images/download",
        // "/v1.0/addisfix/auth/merechant/phonenumbercheck_v2",
        // "/v1.0/addisfix/otp/app/request/pinops_v2",
        // "/v1.0/addisfix/otp/app/confirm/pinops_v2",
      ],
    })
  );

  Router(app);
  
  /**
   * API Routes
   */
 // Route(app);



app.use((req:Request,res:Response, next: NextFunction)=>{
   res.status(404).send('Route not found');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
