import express from 'express';
import bodyParser from 'body-parser';
import { body, validationResult} from 'express-validator';
import xss from 'xss';
import sqlite3 from 'sqlite3';
import fileURLToPath from 'url';
import {dirname, join} from 'path'

//enable verbose mode in DB
const dbVerbose = sqlite3.verbose()

//Initialize the DB
const db = new dbVerbose.Database('./user_form.db', (err)=> {
  if(err){
    console.log('Error opening DB:', err.message);
  }else{
    console.log("Connected to DB")
    db.run(
      `CREATE TABLE IF NOT EXISTS message(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      submission_date TEXT DEFAULT CURRENT_TIMESTAMP
      )`, (createErr) => {
        if (createErr){
          console.log('Error creating table', createErr.message)
        }else{
          console.log('Message table is ready')
        }
      })
  }
})


const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//setting EJS and template engine and pointing to views folder
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'))


// to parse JSON from request body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}));

//post method on 'submit route to handle form data from frontend and perform i/p validation and sanitization
//Assumption: Body will have following fields: name, phone, email, message
app.post('/submit',
  body('name')
  .trim()
  .notEmpty().withMessage('Name is required')
  .isLength({min: 3, max: 50}).withMessage('Name must be between 3 and 50 characters')
  .matches(/^[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*$/).withMessage('Name can only contain letters and space'),


  body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Please enter a valid email address'),


  body('phone')
  .optional({checkFalsy: true})
  .trim()
  .matches(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/).withMessage('Please enter a valid phone number'),

  body('message')
  .trim()
  .notEmpty().withMessage('Message is required')
  .isLength({min: 10, max: 500}).withMessage('message must be between 10 and 500 characters'),

  (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      console.log("Validation errors: ", errors.array())
      return (res.status(400)).json({
        success: false,
        message: 'Input validation failed',
        errors: errors.array()
      })
    }

    //sanitize the input
    const name = xss(req.body.name)
    const email = xss(req.body.email)
    const phone = xss(req.body.phone)
    const message = xss(req.body.message)


    //perform DB insert
    const sqlInsertQuery = `INSERT INTO message(name, email, phone, message) VALUES(?,?,?,?)`
    db.run(sqlInsertQuery, [name, email,phone, message], function(err){
      if(err){
        console.log('Database insertion failed:', err.message);
        return res.status(500).json({message: 'Internal server error, cannot save message'})
      }
      // console.log('A new entry is saved')
      // res.status(201).json({message:"message saved successfully"})
    })

    res.status(200).json({
      success:true,
      message: "Your message is received",
      data: { /* this should contain the details of new entry in DB*/}
    })
  }




)