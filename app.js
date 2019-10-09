const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(session);

// link to static public files
app.use(express.static(path.join(__dirname, 'public')));

// connect to mongoose
mongoose.connect('mongodb://localhost/ipamer', {
  useNewUrlParser: true
})
.then(() => {
  console.log('Mongo DB Connected!');
})
.catch(err => console.log('Mongo DB Connection Error: ', err));

const store = new MongoDBStore({
  uri: 'mongodb://localhost/ipamer',
  collection: 'sessions'
});

// load customer model
require('./models/Customer');
const Customer = mongoose.model('customers');

// load prefix model
require('./models/Prefix');
const Prefix = mongoose.model('prefixes');

// load site model
require('./models/Site');
const Site = mongoose.model('sites');

// load address model
require('./models/Address');
const Address = mongoose.model('addresses');

// MongoDBStore Middleware
store.on('error', function(error) {
  console.log(error);
});

// Handlebars Middleware
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

// Express-Session Middleware
app.use(session({
  secret: 'secret',
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

app.post('/search', (req, res) => {
  const reqLocation = req.headers.referer;
  const reqHost = req.headers.host;
  const reqHeader = reqLocation.split(`http://${reqHost}`);

  const searchParam = req.body.search;
  let search = new RegExp(searchParam,'i');
  Customer.find({name: search}, 'addresses name description').sort({name: 1})
    .then(results => {
      res.render('search', {
        result: results,
        host: reqHeader
      });
    });
});

app.get('/findPrefix', (req, res) => {
  const prefix = req.query.prefix;
  Prefix.findOne({prefix: prefix}, {prefix: 3, gateway: 4, subnet: 5, site: 8, _id: 0})
  .then(prefix => {
    res.send(prefix);
  });
});

app.get('/findAddress', (req, res) => {
  const _id = req.query.id;
  Address.findOne({_id: _id}, {ip: 1, _id: 0})
  .then(address => {
    res.send(address);
  });
});

app.get('/getCustomers', (req, res) => {
  Customer.find({}, {name: 1, _id: 0})
  .then(customers => {
    res.send(customers);
  });
});

app.get('/getPrefixes', (req, res) => {
  Prefix.find({}, {prefix: 3, _id: 0})
  .then(prefixes => {
    res.send(prefixes);
  });
});

app.get('/getSites', (req, res) => {
  Site.find({}, {name: 1, _id: 0})
  .then(sites => {
    res.send(sites);
  });
});

app.get('/getAvailAddresses', (req, res) => {
  Address.find({status: 'Available'}, {ip: 2, prefix: 5, _id: 0})
  .then(addresses => {
    res.send(addresses);
  });
});

app.get('/getAvailPrefixes', (req, res) => {
  Prefix.find({site: ''}, {prefix: 3, _id: 0})
  .then(prefixes => {
    res.send(prefixes);
  });
});

// load routes
const addresses = require('./routes/addresses');
const api = require('./routes/api');
const customers = require('./routes/customers');
const prefixes = require('./routes/prefixes');
const sites = require('./routes/sites');

// use routers
app.use('/addresses', addresses);
app.use('/api', api);
app.use('/customers', customers);
app.use('/prefixes', prefixes);
app.use('/sites', sites);

server.listen(80, () => {
  console.log('Server Listening on Port 80...');
});