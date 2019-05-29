const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const session = require('express-session');
const cookieParser = require('cookie-parser');
const serialize = require('serialize-javascript');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(session);

// link to static public files
app.use(express.static(path.join(__dirname, 'public')));

// connect to mongoose
mongoose.connect('mongodb://localhost/isp', {
  useNewUrlParser: true
})
.then(() => {
  console.log('Mongo DB Connected!');
})
.catch(err => console.log(err));

const store = new MongoDBStore({
  uri: 'mongodb://localhost/isp',
  collection: 'sessions'
});

// load site model
require('./models/Site');
const Site = mongoose.model('sites');

// load prefix model
require('./models/Prefix');
const Prefix = mongoose.model('prefixes');

// MongoDBStore Middleware
store.on('error', function(error) {
  console.log(error);
});

// Handlebars Middleware
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// BodyParser Middleware
const jsonParser = bodyParser.json()
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

// Express-Session Middleware
app.use(session({
  secret: 'k9vmg',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  resave: true,
  saveUninitialized: true
}));

// Cookie-Parser Middleware
app.use(cookieParser());

// Flash Middleware
app.use(flash());

// global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/getSites', (req, res) => {
  Site.find({}, {name: 1, _id: 0})
  .then(sites => {
    res.send(sites);
  });
});

app.get('/getPrefixes', (req, res) => {
  Prefix.find({}, {prefix: 3, _id: 0})
  .then(prefixes => {
    res.send(prefixes);
  });
});

// load routes
const sites = require('./routes/sites');
const prefixes = require('./routes/prefixes');
const addresses = require('./routes/addresses');

// use routers
app.use('/sites', sites);
app.use('/prefixes', prefixes);
app.use('/addresses', addresses);

server.listen(80, () => {
  console.log('Server Listening on Port 80...')
});