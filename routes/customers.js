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
  Customer.find({}, {name: 2, description: 3, addresses: 1, _id: 0}).sort({name: 1})
    .then(customers => {
      res.render('customers/status', {
        customer: customers
      });
    });
})

// process address creation form
router.post('/add', (req, res) => {
  const name = req.body.name;
  const description = req.body.description;
  const address = req.body.address;

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
          address: req.body.address,
          description: req.body.description
        });
        return false;
      } else {
        // customer doesn't exist, continue validations

        // define regular expressions for validating gateways
        const v4AddrRE = /((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])(\/([1-9]|[1-2][0-9]|3[0-1]))?$/;
        const v6AddrRE = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|[fF][eE]80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::([fF]{4}(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

        if (address !== "") {
          // IP address defined in form
          const addressIsValid = validateAddress(address);
          if (addressIsValid) { 
            // check if address exists and is available
            Address.find({ip: address}, {ip: 1, customer: 5, _id: 0})
              .then(addressesFound => {
                if (addressesFound && addressesFound.length) {
                  let IPAvailable;
                  addressesFound.forEach( address => {
                    if (address.customer == '') {
                      IPAvailable = true;
                    }
                  });
                  if (IPAvailable) {
                    // at least one matching IP without a customer assigned
                    createCustomer(name, description, address);
                  } else {
                    // no matching IP available
                    return false;
                  }
                } else {
                  // IP doesn't exist
                  // invalid address given
                  let message = 'Address doesn\'t exist. Please create one first.';
                  // send response
                  res.render('customers/add', {
                    error_msg: message,
                    name: req.body.name,
                    address: req.body.address,
                    description: req.body.description
                  });
                  return false;
                }
              });
          }
        } else {
          createCustomer(name, description);
        }

        function validateAddress(address) {
          if ( !(v4AddrRE.test(address) || v6AddrRE.test(address)) ) {
            // invalid address given
            let message = 'Not a valid IPv4 or IPv6 Address.';
            // send response
            res.render('customers/add', {
              error_msg: message,
              name: req.body.name,
              address: req.body.address,
              description: req.body.description
            });
            return false;
          } else {
            // address is valid IP address
            return true;
          }
        }
      }
    });

    function createCustomer(name, description, address) {
      const newCustomer = new Customer({
        name: name,
        description: description,
        addresses: address
      });

      newCustomer.save()
        .then(customer => {
          if (address !== undefined) {
            // assign customer to IP address
            Address.updateOne({ip: address, customer: ""}, {customer: name}, (err, record) => {
              if (err) {
                throw err;
              } else {
                // IP address updated with customer name!
                res.render('customers/add', {
                  success_msg: `Customer ${name} created!`
                });
              }
            });
            return true;
          } else {
            // customer created!
            res.render('customers/add', {
              success_msg: `Customer ${name} created!`
            });
            return true;
          }
        })
        .catch(err => {
          req.flash('error_msg', `Failed to create customer. Error is ${err}`);
          res.render('customers/add');
          return;
        });
    }

});

module.exports = router;