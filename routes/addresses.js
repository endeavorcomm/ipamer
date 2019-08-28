const express = require('express');
const router = express.Router();
const ip = require('ip');

// load prefix model
Prefix = require('../models/Prefix');

// load site model
Site = require('../models/Site');

// load address model
Address = require('../models/Address');

// load customer model
Customer = require('../models/Customer');

// add prefix route
router.get('/add', (req, res) => {
  res.render('addresses/add');
});

// address status route
router.get('/status', (req, res) => {
  // TODO finish pagination work
  // get count of addresses for pagination
  // Address.countDocuments({type: 'Unicast'}, (err, count) => {
  //   if (err) throw err;
  //   const numResults = count;
  //   // get estimated number of pages for pagination
  //   const est = numResults / 30;
  //   // round up to the nearest integer
  //   const pages = Math.ceil(est);
  // });
  
  // query addresses
  Address.find({type: 'Unicast'}, {}).sort({ip: 1})
    .then(addresses => {
      res.render('addresses/status', {
        address: addresses
      });
    });
});

// address detail route
router.get('/address/:_id', (req, res) => {
  const _id = req.params._id;

  // query prefix
  Address.findOne({_id: _id}, {})
    .then(address => {
      res.render('addresses/address', {
        address: address
      });
    });
});

router.post('/assign', (req, res) => {
  const customer_name = req.body.customer;
  const address_ip = (req.body.address) ? req.body.address : '';
  const address_id = (req.body.addressID) ? req.body.addressID : '';

  // build redirect url from headers
  const reqLocation = req.headers.referer;
  const reqHost = req.headers.host;
  const reqHeader = reqLocation.split(`http://${reqHost}`);
  const reqURL = reqHeader[1];

  if (address_id != '') {
    // request came from prefix details page assignment
    // get customer info for IP assignment
    Customer.findOne({name: customer_name}, {})
      .then(customerFound => {
        if (customerFound == null) {
          // customer doesn't exist
          // set cookie for toast
          res.cookie('iPAMxStatus', 'Create Customer First');
          // send response
          res.redirect(reqURL);
        } else {
          const customer = {id: customerFound._id, name: customerFound.name};
          if (customer_name == 'Reserved') {
            // assign customer to IP address, and assign description
            Address.updateOne({_id: address_id}, {customer: customer, status: 'Active', description: 'Gateway IP'}, (err, record) => {
              if (err) {
                throw err;
              } else {
                // customer assigned to IP address!
              }
            });
          } else {
            // assign customer to IP address
            Address.updateOne({_id: address_id}, {customer: customer, status: 'Active'}, (err, record) => {
              if (err) {
                throw err;
              } else {
                // customer assigned to IP address!
              }
            });
          }
          // get IP address from _id
          Address.findOne({_id: address_id}, {ip: 2})
          .then(ipFound => {
            // assign IP address to customer
            let address = {id: address_id, ip: ipFound.ip};
            Customer.updateOne({name: customer_name}, {$push: {addresses: address}}, (err, record) => {
              if (err) {
                throw err;
              } else {
                // customer updated with IP address!
                res.redirect(reqURL);
              }
            });
          });
        }
      });
  } else {
    // request came from individual customer page Assign Address button
    // need to get address_id from address
    Address.findOne({ip: address_ip}, {})
    .then(ipFound => {
      if (ipFound == null) {
        // IP address doesn't exist
        // set cookie for toast
        res.cookie('iPAMxStatus', 'Create IP Address First');
        // send response
        res.redirect(reqURL);
      } else {
        // get customer info for IP assignment
        Customer.findOne({name: customer_name}, {})
        .then(customerFound => {
          const customer = {id: customerFound._id, name: customerFound.name};

          let address = {id: ipFound._id.toString(), ip: address_ip};
          const address_id = ipFound._id;

          // assign ip address to customer
          Customer.updateOne({name: customer_name}, {$push: {addresses: address}}, (err, record) => {
            if (err) {
              throw err;
            } else {
              // customer updated with IP address!
            }
          });
      
          if (customer_name == 'Reserved') {
            // assign customer to IP address, and assign description
            Address.updateOne({_id: address_id}, {customer: customer, status: 'Active', description: 'Gateway IP'}, (err, record) => {
              if (err) {
                throw err;
              } else {
                // customer assigned to IP address!
                res.redirect(reqURL);
              }
            });
          } else {
            // assign customer to IP address without description
            Address.updateOne({_id: address_id}, {customer: customer, status: 'Active'}, (err, record) => {
              if (err) {
                throw err;
              } else {
                // customer assigned to IP address!
                res.redirect(reqURL);
              }
            });
          }          
        });
      }
    });
  }
});

router.post('/unassign', (req, res) => {
  const unassignFromCustomer = req.body.uncustomer;
  const address_id = req.body.unaddressID;

  // build redirect url from headers
  const reqLocation = req.headers.referer;
  const reqHost = req.headers.host;
  const reqHeader = reqLocation.split(`http://${reqHost}`);
  const reqURL = reqHeader[1];
  
  // unassign customer from IP address
  const clearCustomer = {id: '', name: ''};
  Address.updateOne({_id: address_id}, {customer: clearCustomer, status: 'Available', description: ''}, (err, record) => {
    if (err) {
      throw err;
    } else {
      // customer unassigned from IP address!
    }
  });
  
  // get IP address from _id
  Customer.findOne({name: unassignFromCustomer}, {addresses: 1})
  .then(addressesFound => {
    // find address in array with ip id that we want to unassign
    addressesFound.addresses.forEach(address => {
      if (address.id == address_id) {
        // unassign IP address from customer
        Customer.updateOne({name: unassignFromCustomer}, {$pull: {addresses: address}}, (err, record) => {
          if (err) {
            throw err;
          } else {
            // customer updated with IP address!
            res.redirect(reqURL);
          }
        });
      }
    });
  });
});

// process address creation form
router.post('/add', (req, res) => {
  const prefix = req.body.prefix;
  const address = req.body.address;
  const customer = req.body.customer;
  let customerIsValid = true;

  // validate prefix
  const prefixIsValid = validatePrefix(prefix);

  if (prefixIsValid) {

  // get values for site, subnet and gateway from database, because if the form fields are disabled, they won't be submitted in the post
  Prefix.findOne({prefix: prefix}, {gateway: 4, subnet: 5, site: 8})
    .then(prefixFound => {
      let gateway = prefixFound.gateway;
      let subnet = prefixFound.subnet;
      let site = prefixFound.site;
      
      // get these manually typed in values from the form, if they were submitted
      if (req.body.site) {
        site = req.body.site;
      }
      if (req.body.subnet) {
        subnet = req.body.subnet;
      }

      // define regular expressions for validating gateways
      const v4AddrRE = /((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])(\/([1-9]|[1-2][0-9]|3[0-1]))?$/;
      const v6AddrRE = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|[fF][eE]80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::([fF]{4}(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

      // ##### BEGIN ADDRESS FORM PROCESSING #####
      const addressIsValid = validateAddress(address, prefix);
      const siteIsValid = validateSite();
      if (customer !== "") {
        customerIsValid = validateCustomer(customer);
      }
      const cidrSubnetMatches = validateCIDRMatches(subnet);

      if (addressIsValid && siteIsValid && customerIsValid && cidrSubnetMatches) {  
        createAddress(gateway, subnet, site);
      }

      function validateCustomer(customer) {
        // TODO check if customer exists, if not send error
        const customerExists = Customer.findOne({name: customer}, {_id: 0})
          .then((customerFound) => {
            if (customerFound) {
              return true;
            } else {
              let message = 'Customer doesn\'t exist';
              // send response
              res.render('addresses/add', {
                error_msg: message,
                prefix: req.body.prefix,
                address: req.body.address,
                customer: req.body.customer,
                gateway: gateway,
                subnet: subnet,
                site: site,
                description: req.body.description
              });
              return false;
            }
          });
        return customerExists;
      }

      function validateAddress(address, prefix) {
        let addressValid = false;
        let addressMember = false;
        let addressDuplicate = false;
      
        if ( !(v4AddrRE.test(address) || v6AddrRE.test(address)) ) {
          // address is invalid, keep addressValid = false
        } else {
          // address is valid IP address, continue testing
          addressValid = true;
      
          // validate that ip address is a member of chosen prefix
          if (ip.cidrSubnet(prefix).contains(address)) {
            // ip address is part of prefix
            addressMember = true;
          } else {
            // address is not a member of prefix, keep addressMember = false
          }

          // check if IP already exists
          Address.findOne({ip: address}, {})
            .then(addressFound => {
              if (addressFound != null) {
                // address exists!
                addressDuplicate = true;
              }
            });
        }
        if (!addressValid) {
          // invalid address given
          let message = 'Not a valid IPv4 or IPv6 Address';
          // send response
          res.render('addresses/add', {
            error_msg: message,
            prefix: req.body.prefix,
            address: req.body.address,
            customer: req.body.customer,
            gateway: gateway,
            subnet: subnet,
            site: site,
            description: req.body.description
          });
          return false;
        } else if (!addressMember) {
          // ip address not member of prefix
          let message = 'IP Address is not a member of Prefix';
          // send response
          res.render('addresses/add', {
            error_msg: message,
            prefix: req.body.prefix,
            address: req.body.address,
            customer: req.body.customer,
            gateway: gateway,
            subnet: subnet,
            site: site,
            description: req.body.description
          });
          return false;
        } else if (addressDuplicate) {
          // ip address is a duplicate
          let message = 'IP Address already exists';
          // send response
          res.render('addresses/add', {
            error_msg: message,
            prefix: req.body.prefix,
            address: req.body.address,
            customer: req.body.customer,
            gateway: gateway,
            subnet: subnet,
            site: site,
            description: req.body.description
          });
          return false;
        } else {
          // address is valid and a part of the prefix
          return true;
        }
      }

      function validateSite() {
        if (site !== null) {
          // Check if typed in site matches an existing site
          const siteExists = Site.findOne({name: new RegExp('\\b' + site + '\\b', 'i')})
          .then(site => {
            if(site !== null) {
              // site exists
              return true;
            } else {
              // doesn't match existing site
              let message = 'Site Doesn\'t Exist. Please select an available site or create a new one';
              // send response
              res.render('addresses/add', {
                error_msg: message,
                prefix: req.body.prefix,
                address: req.body.address,
                customer: req.body.customer,
                gateway: gateway,
                subnet: subnet,
                site: site,
                description: req.body.description
              });
              return false;
            }
          });
          return siteExists;
        } else {
          // site not defined in form, continue
          return true;
        }
      }

      function getCIDR(prefix) {
        // replace CIDR / with . to prepare for array
        let modPrefix = prefix.replace("/", ".");

        // create netblock array
        let cidr = modPrefix.split(".");

        // get CIDR from netblock array
        cidr.splice(0,4);

        return cidr;
      }

      function validateCIDRMatches(subnet) {
        // if subnet is filled in, validate that it matches CIDR in prefix
        if (subnet !== '') {
          // subnet was defined in form

          const cidr = parseInt(getCIDR(req.body.prefix));
          const sub = subnet;
          // create subnet array
          let subnetArray = sub.split(".");

          // calculate number of bits that subnet represents
          let bits = 0;
          subnetArray.forEach((mask) => {
            mask = parseInt(mask);
            switch(mask) {
              case 255:
                bits += 8;
                break;
              case 254:
                bits += 7;
                break;
              case 252:
                bits += 6;
                break;
              case 248:
                bits += 5;
                break;
              case 240:
                bits += 4;
                break;
              case 224:
                bits += 3;
                break;
              case 192:
                bits += 2;
                break;
              case 128:
                bits += 1;
                break;
              default:
                  break;
            }
            return bits;
          });

          if (cidr !== bits) {
            // don't match, send error
            let message = 'CIDR and subnet don\'t match';
            // send response
            res.render('addresses/add', {
              error_msg: message,
              prefix: req.body.prefix,
              address: req.body.address,
              customer: req.body.customer,
              gateway: gateway,
              subnet: subnet,
              site: site,
              description: req.body.description
            });
            return false;
          } else {
            // cidr and bits match, continue validations
            return true;
          }
        } else {
          // subnet not defined, continue validations
          return true;
        }
      }

      function createAddress(gateway, subnet, site) {
        let status = 'Available';
        let customer = {id: '', name: ''};

        // if customer is being assigned
        if (req.body.customer !== "") {
          status = 'Active';
          Customer.findOne({name: req.body.customer}, {})
            .then(customerFound => {
              customer = {id: customerFound._id.toString(), name: customerFound.name};
              const newAddress = new Address({
                ip: req.body.address,
                type: 'Unicast',
                customer: customer,
                prefix: req.body.prefix,
                gateway: gateway,
                subnet: subnet,
                site: site,
                status: status,
                description: req.body.description
              });
      
              newAddress.save()
                .then(savedAddress => {
                  if (customer.id !== "") {
                    let addressCreated = {id: savedAddress._id.toString(), ip: savedAddress.ip};
                    // assign IP address to customer
                    Customer.updateOne({name: customer.name}, {$push: {addresses: addressCreated}}, (err, record) => {
                      if (err) {
                        throw err;
                      } else {
                        // customer updated with IP address!
                        res.render('addresses/add', {
                          success_msg: `Address ${savedAddress.ip} created and assigned!`
                        });
                      }
                    });
                  } else {
                    // send success message
                    res.render('addresses/add', {
                      success_msg: `Address ${savedAddress.ip} added!`
                    });
                  }
                })
                .catch(err => {
                  res.render('addresses/add', {
                    error_msg: `Failed to add address. Error is ${err}`
                  });
                });
            });
        } else {
          // no customer being assigned, just create address
          const newAddress = new Address({
            ip: req.body.address,
            type: 'Unicast',
            customer: customer,
            prefix: req.body.prefix,
            gateway: gateway,
            subnet: subnet,
            site: site,
            status: status,
            description: req.body.description
          });
  
          newAddress.save()
            .then(savedAddress => {
              if (customer.id !== "") {
                let addressCreated = {id: savedAddress._id, ip: savedAddress.ip};
                // assign IP address to customer
                Customer.updateOne({name: customer.name}, {$push: {addresses: addressCreated}}, (err, record) => {
                  if (err) {
                    throw err;
                  } else {
                    // customer updated with IP address!
                    res.render('addresses/add', {
                      success_msg: `Address ${savedAddress.ip} created and assigned!`
                    });
                  }
                });
              } else {
                // send success message
                res.render('addresses/add', {
                  success_msg: `Address ${savedAddress.ip} added!`
                });
              }
            })
            .catch(err => {
              res.render('addresses/add', {
                error_msg: `Failed to add address. Error is ${err}`
              });
            });
        }
        
        
      }
    });
  }

  function validatePrefix(prefix) {
    // define regular expressions for validating prefixes
    const v4PreRE = /((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])(\/([1-9]|[1-2][0-9]|3[0-1]))?$/;
    const v6PreRE = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|[fF][eE]80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::([fF]{4}(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

    if ( !(v4PreRE.test(prefix) || v6PreRE.test(prefix)) ) {
      // invalid prefix given
      let message = 'Not a valid IPv4 or IPv6 Prefix';
        // send response and set checked for dhcp radio button
        res.render('addresses/add', {
          error_msg: message,
          prefix: req.body.prefix,
          address: req.body.address,
          customer: req.body.customer,
          gateway: gateway,
          subnet: subnet,
          site: site,
          description: req.body.description
        });
        return false;
    } else {
      // prefix is valid IPv4 or IPv6
      return true;
    }
  }
});

module.exports = router;