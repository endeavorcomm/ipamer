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
  res.send('Welcome to the ipamx API');
});

// addresses route
// ## all
router.get('/addresses', (req, res) => {
  Address.getAddresses( (err, addresses) => {
    if(err) throw err;
    res.json(addresses);
  });
});

// customers routes
// ## all
router.get('/customers', (req, res) => {
  Customer.getCustomers( (err, customers) => {
    if(err) throw err;
    res.json(customers);
  });
});
// ## one
router.get('/customers/:_id', (req, res) => {
  Customer.getCustomerById(req.params._id, (err, book) => {
    if(err) throw err;
    res.json(book);
  });
});
router.post('/customers', (req, res) => {
  let customer = req.body;
  Customer.addCustomer(customer, (err, customer) => {
    if(err) throw err;
    res.json(customer);
  });
});
router.put('/customers/:_id', (req, res) => {
  let id = req.params._id;
  let customer = req.body;
  let options = {
    useFindAndModify: false,
    new: true,

  }

  Customer.updateCustomer(id, customer, options, (err, customer) => {
    if(err) throw err;
    res.json(customer);
  });
});

router.delete('/customers/:_id', (req, res) => {
  let id = req.params._id;

  Customer.deleteCustomer(id, (err, customer) => {
    if(err) throw err;
    res.json(customer);
  });
});

// prefixes route
// ## all
router.get('/prefixes', (req, res) => {
  Prefix.getPrefixes( (err, prefixes) => {
    if(err) throw err;
    res.json(prefixes);
  });
});

// sites route
// ## all
router.get('/sites', (req, res) => {
  Site.getSites( (err, sites) => {
    if(err) throw err;
    res.json(sites);
  });
});

module.exports = router;