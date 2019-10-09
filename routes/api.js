const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

Address = require('../models/Address');
Customer = require('../models/Customer');
Prefix = require('../models/Prefix');
Site = require('../models/Site');

// default route
router.get('/', (req, res) => {
  res.render('api');
});

// addresses route
router.get('/addresses', (req, res) => {
  Address.getAddresses( (err, addresses) => {
    if(err) throw err;
    res.status(200).json(addresses);
  });
});

// customers routes
router.get('/customers', (req, res) => {
  Customer.getCustomers( (err, customers) => {
    if(err) throw err;
    res.status(200).json(customers);
  });
});

// get single customer
router.get('/customers/:name', (req, res) => {
  Customer.getCustomerByName(req.params.name, (err, customer) => {
    if(err) throw err;
    res.status(200).json(customer);
  });
});

// prefixes route
router.get('/prefixes', (req, res) => {
  Prefix.getPrefixes( (err, prefixes) => {
    if(err) throw err;
    res.status(200).json(prefixes);
  });
});

// sites route
router.get('/sites', (req, res) => {
  Site.getSites( (err, sites) => {
    if(err) throw err;
    res.status(200).json(sites);
  });
});

module.exports = router;