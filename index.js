// Import necessary modules
var express = require('express');
var ejs = require('ejs');
const mysql = require('mysql');
var session = require('express-session')
var bodyParser = require('body-parser');
const path = require('path');



// Create the Express application
const app = express();
const port = 3000;

// Create a session
app.use(session({
    secret: 'somerandomstuff',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// Define the database connection
const db = mysql.createConnection ({
    host: 'localhost',
    user: 'appuser',
    password: 'app2027',
    database: 'PrayerTracker'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});
global.db = db;

// Middleware to parse request body
app.use(bodyParser.urlencoded({ extended: true }));

// Set the directory for EJS templates and use EJS as the view engine
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// Define  data
var prayerData = { name: "Prayer Tracker"};

// Require and use your routes
require("./routes/main")(app, prayerData);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
