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

// customer detail routes
router.get('/customer/:_id', (req, res) => {
  const _id = req.params._id;

  // query customer
  Customer.findOne({_id: _id}, {})
    .then(customer => {
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

module.exports = router;