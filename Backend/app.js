import express from 'express';
import bodyParser from 'body-parser';
import { body, validationResult} from 'express-validator';
import xss from 'xss';

const app = express();
const port = 3000;

// to parse JSON from request body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}));

//post method on 'submit route to handle form data from frontend and perform i/p validation and sanitization
//Assumption: Body will have following fields: name, phone, email, message
app.post('/submit',
  body('name')
)