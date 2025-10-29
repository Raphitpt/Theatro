require('dotenv').config()
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const authRouter = require('./routes/auth');
const eventRouter = require('./routes/event');
const showRouter = require('./routes/show');
const workshopRouter = require('./routes/workshop');
const applicationRouter = require('./routes/application');
const memberRouter = require('./routes/member')
const { connect } = require('mongoose');

connect(process.env.MONGO_DB_URL)
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch((error) => {
    console.log("Connexion à MongoDB échouée !");
    console.log("Erreur:", error.message);
    console.log("URL utilisée:", process.env.MONGO_DB_URL?.substring(0, 30) + "...");
  })


const app = express();

// Configuration CORS
app.use(cors({
  origin: 'http://localhost:5173', // URL du frontend Vite
  credentials: true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(authRouter);
app.use(eventRouter);
app.use(showRouter);
app.use(workshopRouter);
app.use(applicationRouter);
app.use(memberRouter);

module.exports = app;
