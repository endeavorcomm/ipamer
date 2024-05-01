const express = require('express');
require('dotenv').config();
const exphbs = require('express-handlebars');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const NETBOX_API_KEY = process.env.NETBOX_API_KEY
const NETBOX_HOST = process.env.NETBOX_HOST
const NODE_PORT = process.env.NODE_PORT || 8080
const ip = require('ip')

// link to static public files
app.use(express.static(path.join(__dirname, 'public')));

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
  secret: 'endeavor',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
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
  res.render('index.handlebars');
});

app.get('/search', (req, res) => {
  (async () => {
    let url
    let cidr
    let api_path = '/api/tenancy/tenants'
    const limit = req.query.limit ? req.query.limit : false
    const offset = req.query.offset ? req.query.offset : false
    const name = req.query.name__ic ? req.query.name__ic : false

    /* Check if searching for an IP. */
    const ip_regex =  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const is_ip = ip_regex.test(name)

    if (is_ip) {
      api_path = '/api/ipam/ip-addresses'

      /* Check if IP falls within a used prefix. */
      try {
        const prefix_res = await fetch(`${NETBOX_HOST}/api/ipam/prefixes?limit=0&family_label__ic=IPv4`, {
          headers: {
            'Authorization': `Token ${NETBOX_API_KEY}`,
            'Accept': 'application/json'
          }
        })

        if (prefix_res.status !== 200) throw new Error(`Error getting prefixes from Netbox: ${prefix_res.status}, ${prefix_res.statusText}`)

        const prefixes = await prefix_res.json()
        
        prefixes.results.forEach((p) => {
          if(p.family.value === 4 && ip.cidrSubnet(p.prefix).contains(name)) {
            /* Get number of bits for IP. */
            cidr = p.prefix.split('/')[1]
            return
          }
        })
      } catch (error) {
        throw new Error(error.message)
      } finally {
        if (!cidr) {
          res.render('search', { sites: {} })
        }
      }
    }

    const term = is_ip ? `${name}/${cidr}` : name
    
    if (limit && offset && name) {
      url = `${NETBOX_HOST}${api_path}/?limit=${limit}&${is_ip ? 'address' : 'name__ic'}=${term}&offset=${offset}`
    } else if (limit && offset) {
      url = `${NETBOX_HOST}${api_path}/?limit=${limit}&offset=${offset}`
    } else if (name) {
      url = `${NETBOX_HOST}${api_path}/?${is_ip ? 'address' : 'name__ic'}=${term}`
    } else {
      url = `${NETBOX_HOST}${api_path}/`
    }
    const response = await fetch(url, {
      headers: {'Authorization': `Token ${NETBOX_API_KEY}`}
    })
    
    const sites = await response.json()
    res.render('search', {
      sites
    })
  })();
});

// load routes
const addresses = require('./routes/addresses');
const customers = require('./routes/customers');

// use routers
app.use('/addresses', addresses);
app.use('/customers', customers);

server.listen(NODE_PORT, () => {
  console.log(`Server Listening on Port ${NODE_PORT}...`);
});