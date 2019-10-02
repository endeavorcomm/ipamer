const express = require('express');
const router = express.Router();

// load customer model
Customer = require('../models/Customer');

// load address model
Address = require('../models/Address');

// add customer route
router.get('/add', (req, res) => {
  res.render('customers/add');
});

// customer status route
router.get('/status', (req, res) => {
  // query customers
  Customer.find({}, {}).sort({name: 1})
    .then(customers => {
      res.render('customers/status', {
        customer: customers
      });
    });
})

// customer detail route
router.get('/customer/:_id', (req, res) => {
  const _id = req.params._id;

  // sort ip addresses by number, not string
  function compare(a,b) {
    const ipA = a.ip;
    const ipB = b.ip;
    return ipA.localeCompare(ipB, 'en', {numeric: true});
  }

  Customer.findOne({_id: _id}, {})
    .then(customer => {
      customer.addresses.sort(compare);
      res.render('customers/customer', {
        customer: customer
      });
    });
});

// process address creation form
router.post('/add', (req, res) => {
  const name = req.body.name;
  const description = req.body.description;

  // check if customer already exists
  Customer.findOne({name: name}, {name: 1, _id: 0})
    .then(customerFound => {
      if (customerFound) {
        // customer exists, send alert
        let message = 'Customer Already Exists';
        // send response
        res.render('customers/add', {
          error_msg: message,
          name: req.body.name,
          description: req.body.description
        });
        return false;
      } else {
        // customer doesn't exist, continue validations
        createCustomer(name, description);
      }
    });

    function createCustomer(name, description) {
      const newCustomer = new Customer({
        name: name,
        description: description
      });

      newCustomer.save()
        .then(customer => {
          // customer created!
          res.render('customers/add', {
            success_msg: `Customer ${name} created!`
          });
          return true;
        })
        .catch(err => {
          req.flash('error_msg', `Failed to create customer. Error is ${err}`);
          res.render('customers/add');
          return;
        });
    }

});

// process customer delete form
router.post('/delete', (req, res) => {
  const customerName = req.body.customerName;

  // build redirect url from headers
  const reqHost = req.headers.host;
  const reqURL = `http://${reqHost}/customers/status`;
  
  // get customer ID and addresses from customer name
  Customer.findOne({name: customerName}, {})
    .then(customerFound => {
      let customerID = String(customerFound._id);
      const customer = {id: customerID, name: customerFound.name};
      // unassign all addresses from the customer
      Address.find({customer: customer}, {})
        .then(addressesFound => {
          addressesFound.forEach((address) => {
            // remove customer from address, reset status and clear description
            const clearCustomer = {id: '', name: ''};
            Address.updateOne({_id: address._id}, {customer: clearCustomer, status: 'Available', description: ''}, (err, record) => {
              if (err) {
                throw err;
              } else {
                // customer removed from address!
              }
            });
          });
        });

      //remove customer
      Customer.deleteOne({_id: customerFound._id}, (err) => {
        if (err) {
          throw err;
        } else {
          // customer deleted!
          res.redirect(reqURL);
        }
      });
    });
});

module.exports = router;