require('dotenv').config()
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs')


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


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
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
app.use(limiter);

// Swagger UI - Documentation OpenAPI
const swaggerDocument = YAML.load(path.join(__dirname, 'docs/open-api.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Theatro API Documentation',
  customfavIcon: '/favicon.ico',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai'
    }
  }
}));

app.use(authRouter);
app.use(eventRouter);
app.use(showRouter);
app.use(workshopRouter);
app.use(applicationRouter);
app.use(memberRouter);

module.exports = app;
