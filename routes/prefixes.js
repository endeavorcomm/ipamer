const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// load prefix model
require('../models/Prefix');
const Prefix = mongoose.model('prefixes');

// load site model
require('../models/Site');
const Site = mongoose.model('sites');

// load address model
require('../models/Address');
const Address = mongoose.model('addresses');

// add prefix route
router.get('/add', (req, res) => {
  res.render('prefixes/add');
});

// process prefix creation form
router.post('/add', (req, res) => {
  const prefix = req.body.prefix;
  const type = req.body.type;
  const createAddresses = req.body.createAddresses;
  const site = req.body.site;
  const subnet = req.body.subnet;
  const gateway = req.body.gateway;

  // define regular expressions for validating prefixes
  const v4PreRE = /((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])(\/([1-9]|[1-2][0-9]|3[0-1]))?$/;
  const v6PreRE = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|[fF][eE]80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::([fF]{4}(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

  // define regular expressions for validating gateways
  const v4GateRE = /((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])(\/([1-9]|[1-2][0-9]|3[0-1]))?$/;
  const v6GateRE = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|[fF][eE]80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::([fF]{4}(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;
  
  // ##### BEGIN PREFIX FORM PROCESSING #####
  const cidrSubnetMatches = validateCIDRMatches(subnet);
  const prefixIsValid = validatePrefix(prefix);
  const gatewayIsValid = validateGateway(gateway);
  const typeIsValid = validateType();
  const siteIsValid = validateSite();

  if (cidrSubnetMatches && prefixIsValid && gatewayIsValid && typeIsValid && siteIsValid) { createPrefix(); }

  function getNetwork(prefix) {
    // replace CIDR / with . to prepare for array
    let modPrefix = prefix.replace("/", ".");

    // create netblock array
    let netOctets = modPrefix.split(".");

    // remove CIDR statement from netblock array
    netOctets.splice(4,1);

    return netOctets;
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

  function convertCIDRToSubnet(cidr) {
    const fullOctet = parseInt(cidr / 8);
    const remOctet = cidr % 8;
    let subnetMask = '';
    let rem = '0';
    switch(remOctet) {
      case 1:
        rem = '128';
        break;
      case 2:
        rem = '192';
        break;
      case 3:
        rem = '224';
        break;
      case 4:
        rem = '240';
        break;
      case 5:
        rem = '248';
        break;
      case 6:
        rem = '252';
        break;
      case 7:
        rem = '254';
        break;
      default:
        break;
    }
    switch(fullOctet) {
      case 0:
        subnetMask = `${rem}.0.0.0`;
        break;
      case 1:
        subnetMask = `255.${rem}.0.0`;
        break;
      case 2:
        subnetMask = `255.255.${rem}.0`;
        break;
      case 3:
        subnetMask = `255.255.255.${rem}`;
        break;
      default:
        break;
    }
    
    return subnetMask;
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
        if (type == 'static') {
          // send response and set checked for static radio button
          res.render('prefixes/add', {
            error_msg: message,
            name: req.body.name,
            static: req.body.type,
            createAddresses: req.body.createAddresses,
            prefix: req.body.prefix,
            gateway: req.body.gateway,
            subnet: req.body.subnet,
            description: req.body.description,
            system: req.body.system,
            site: req.body.site
          });
          return false;
        } else {
          // send response and set checked for dhcp radio button
          res.render('prefixes/add', {
            error_msg: message,
            name: req.body.name,
            dhcp: req.body.type,
            createAddresses: req.body.createAddresses,
            prefix: req.body.prefix,
            gateway: req.body.gateway,
            subnet: req.body.subnet,
            description: req.body.description,
            system: req.body.system,
            site: req.body.site
          });
          return false;
        }
      } else {
        // cidr and bits match, continue validations
        return true;
      }
    } else {
      // subnet not defined, continue validations
      return true;
    }
  }

  function validatePrefix(prefix) {
    if ( !(v4PreRE.test(prefix) || v6PreRE.test(prefix)) ) {
      // invalid prefix given
      let message = 'Not a valid IPv4 or IPv6 Prefix';
      if (type == 'static') {
        // send response and set checked for static radio button
        res.render('prefixes/add', {
          error_msg: message,
          name: req.body.name,
          static: req.body.type,
          createAddresses: req.body.createAddresses,
          prefix: req.body.prefix,
          gateway: req.body.gateway,
          subnet: req.body.subnet,
          description: req.body.description,
          system: req.body.system,
          site: req.body.site
        });
        return false;
      } else {
        // send response and set checked for dhcp radio button
        res.render('prefixes/add', {
          error_msg: message,
          name: req.body.name,
          dhcp: req.body.type,
          createAddresses: req.body.createAddresses,
          prefix: req.body.prefix,
          gateway: req.body.gateway,
          subnet: req.body.subnet,
          description: req.body.description,
          system: req.body.system,
          site: req.body.site
        });
        return false;
      }
    } else {
      // prefix is valid IPv4 or IPv6
      return true;
    }
  }

  function validateGateway(gateway) {
    // TODO validate that gateway address is a member of prefix

    if ( !(v4GateRE.test(gateway) || v6GateRE.test(gateway)) ) {
      // invalid gateway given
      let message = 'Not a valid IPv4 or IPv6 Gateway';
      if (type == 'static') {
        // send response and set checked for static radio button
        res.render('prefixes/add', {
          error_msg: message,
          name: req.body.name,
          static: req.body.type,
          createAddresses: req.body.createAddresses,
          prefix: req.body.prefix,
          gateway: req.body.gateway,
          subnet: req.body.subnet,
          description: req.body.description,
          system: req.body.system,
          site: req.body.site
        });
        return false;
      } else {
        // send response and set checked for dhcp radio button
        res.render('prefixes/add', {
          error_msg: message,
          name: req.body.name,
          dhcp: req.body.type,
          createAddresses: req.body.createAddresses,
          prefix: req.body.prefix,
          gateway: req.body.gateway,
          subnet: req.body.subnet,
          description: req.body.description,
          system: req.body.system,
          site: req.body.site
        });
        return false;
      }
    } else {
      // gateway is valid IPv4 or IPv6 address
      return true;
    }
  }

  function validateType() {
    if (type == null) {
      // Type wasn't choosen
      let message = 'Please choose a Type';
      res.render('prefixes/add', {
        error_msg: message,
        name: req.body.name,
        createAddresses: req.body.createAddresses,
        prefix: req.body.prefix,
        gateway: req.body.gateway,
        subnet: req.body.subnet,
        description: req.body.description,
        system: req.body.system,
        site: req.body.site
      });
      return false;
    } else {
      // type defined, continue
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
          if (type == 'static') {
            // send response and set checked for static radio button
            res.render('prefixes/add', {
              error_msg: message,
              name: req.body.name,
              static: req.body.type,
              createAddresses: req.body.createAddresses,
              prefix: req.body.prefix,
              gateway: req.body.gateway,
              subnet: req.body.subnet,
              description: req.body.description,
              system: req.body.system,
              site: req.body.site
            });
            return false;
          } else {
            // send response and set checked for dhcp radio button
            res.render('prefixes/add', {
              error_msg: message,
              name: req.body.name,
              dhcp: req.body.type,
              createAddresses: req.body.createAddresses,
              prefix: req.body.prefix,
              gateway: req.body.gateway,
              subnet: req.body.subnet,
              description: req.body.description,
              system: req.body.system,
              site: req.body.site
            });
            return false;
          }
        }
      });
      return siteExists;
    } else {
      // site not defined in form, continue
      return true;
    }
  } 

  function createPrefix() {
    const newPrefix = new Prefix({
      name: req.body.name,
      type: req.body.type,
      prefix: req.body.prefix,
      gateway: req.body.gateway,
      subnet: req.body.subnet,
      description: req.body.description,
      system: req.body.system,
      site: req.body.site
    });

    newPrefix.save()
      .then(prefix => {
        // send success message
        if (createAddresses == undefined) {
          req.flash('success_msg', `Prefix ${prefix.prefix} added!`);
          res.redirect('/prefixes/add');
        }
      })
      .then( () => {
        // check if we should create addresses
        if (createAddresses !== undefined) {
          // yes, create addresses

          // check if prefix is IPv6 or IPv4
          const v6 = req.body.prefix.includes("::");
          const v4 = req.body.prefix.includes(".");
          if (v6) {
            // do not create addresses for IPv6
            // TODO toaster notification for non-creation
          } else if (v4) {
            // create addresses for IPV4

            // get CIDR from prefix and convert to subnet mask
            const prefixCIDR = getCIDR(req.body.prefix);
            let sMask = convertCIDRToSubnet(prefixCIDR);

            // create subnet array
            let subnetArray = sMask.split(".");

            // create array of non-255 subnet mask values
            let maskArray = [];
            subnetArray.forEach((maskOctet) => {
              if (maskOctet !== '255') {
                maskArray.push(maskOctet);
              }
            })

            // get network address from prefix
            let initPrefix = req.body.prefix;
            let netOctets = getNetwork(initPrefix);

            switch(maskArray.length) {
              case 1:
                // octet four is non-255
                let octetFourLength1 = 256 - parseInt(maskArray[0]) - 1;
                for (n = 0; n <= octetFourLength1; n++) {
                  let octetFourValue1 = parseInt(netOctets[3]) + n;
                  let ip1 = `${netOctets[0]}.${netOctets[1]}.${netOctets[2]}.${octetFourValue1}`;
                  // add IP address into database
                  if (n == 0) {
                    // address is first in list, so it is the network address
                    let newAddress = new Address({
                      ip: ip1,
                      type: 'Network',
                      prefix: req.body.prefix,
                      gateway: req.body.gateway,
                      customer: '',
                      subnet: sMask,
                      site: req.body.site
                    });
                    newAddress.save();
                  } else if (n == octetFourLength1) {
                    // address is last in list, so it is the broadcast address
                    let newAddress = new Address({
                      ip: ip1,
                      type: 'Broadcast',
                      prefix: req.body.prefix,
                      gateway: req.body.gateway,
                      customer: '',
                      subnet: sMask,
                      site: req.body.site
                    });
                    newAddress.save();
                  } else {
                    // address is normal
                    let newAddress = new Address({
                      ip: ip1,
                      type: 'Unicast',
                      prefix: req.body.prefix,
                      gateway: req.body.gateway,
                      customer: '',
                      subnet: sMask,
                      site: req.body.site
                    });
                    newAddress.save();
                  }
                }
                // TODO toaster notification for IP address creation
                // send success message
                req.flash('success_msg', `Prefix and IP Addresses added!`);
                res.redirect('/prefixes/add');
                break;
              case 2:
                // octet three and four is non-255
                let octetThreeLength2 = 256 - parseInt(maskArray[0]) - 1;
                let octetFourLength2 = 256 - parseInt(maskArray[1]) - 1;
                for (n = 0; n <= octetThreeLength2; n++) {
                  let octetThreeValue2 = parseInt(netOctets[2]) + n;
                  for (nn = 0; nn <= octetFourLength2; nn++) {
                    let octetFourValue2 = parseInt(netOctets[3]) + nn;
                    let ip2 = `${netOctets[0]}.${netOctets[1]}.${octetThreeValue2}.${octetFourValue2}`;
                    // add IP address into database
                    if (n == 0 && nn == 0) {
                      new Address({
                        ip: ip2,
                        type: 'Network',
                        prefix: req.body.prefix,
                        gateway: req.body.gateway,
                        customer: '',
                        subnet: sMask,
                        site: req.body.site
                      });
                    } else if (n == octetThreeLength2 && nn == octetFourLength2) {
                      new Address({
                        ip: ip2,
                        type: 'Broadcast',
                        prefix: req.body.prefix,
                        gateway: req.body.gateway,
                        customer: '',
                        subnet: sMask,
                        site: req.body.site
                      });
                    } else {
                      new Address({
                        ip: ip2,
                        type: 'Unicast',
                        prefix: req.body.prefix,
                        gateway: req.body.gateway,
                        customer: '',
                        subnet: sMask,
                        site: req.body.site
                      });
                    }
                  }
                }
                // TODO toaster notification for IP address creation
                // send success message
                req.flash('success_msg', `Prefix and IP Addresses added!`);
                res.redirect('/prefixes/add');
                break;
              case 3:
                // octet two, three and four is non-255
                let octetTwoLength3 = 256 - parseInt(maskArray[0]) - 1;
                let octetThreeLength3 = 256 - parseInt(maskArray[1]) - 1;
                let octetFourLength3 = 256 - parseInt(maskArray[2]) - 1;
                for (n = 0; n <= octetTwoLength3; n++) {
                  let octetTwoValue3 = parseInt(netOctets[1]) + n;
                  for (nn = 0; nn <= octetThreeLength3; nn++) {
                    let octetThreeValue3 = parseInt(netOctets[2]) + nn;
                    for (nnn = 0; nnn <= octetFourLength3; nnn++) {
                      let octetFourValue3 = parseInt(netOctets[3]) + nnn;
                      let ip3 = `${netOctets[0]}.${octetTwoValue3}.${octetThreeValue3}.${octetFourValue3}`;
                      // add IP address into database
                      if (n == 0 && nn == 0 && nnn == 0) {
                        new Address({
                          ip: ip3,
                          type: 'Network',
                          prefix: req.body.prefix,
                          gateway: req.body.gateway,
                          customer: '',
                          subnet: sMask,
                          site: req.body.site
                        });
                      }
                      if (n == octetTwoLength3 && nn == octetThreeLength3 && nnn == octetFourLength3) {
                        new Address({
                          ip: ip3,
                          type: 'Broadcast',
                          prefix: req.body.prefix,
                          gateway: req.body.gateway,
                          customer: '',
                          subnet: sMask,
                          site: req.body.site
                        });
                      } else {
                        new Address({
                          ip: ip3,
                          type: 'Unicast',
                          prefix: req.body.prefix,
                          gateway: req.body.gateway,
                          customer: '',
                          subnet: sMask,
                          site: req.body.site
                        });
                      }
                    }
                  }
                }
                // send success message
                req.flash('success_msg', `Prefix and IP Addresses added!`);
                res.redirect('/prefixes/add');
                break;
              case 4:
                // all octets are non-255
                console.log('All octets are non-255');
                let octetOneLength4 = 256 - parseInt(maskArray[0]) - 1;
                let octetTwoLength4 = 256 - parseInt(maskArray[1]) - 1;
                let octetThreeLength4 = 256 - parseInt(maskArray[2]) - 1;
                let octetFourLength4 = 256 - parseInt(maskArray[3]) - 1;
                for (n = 0; n <= octetOneLength4; n++) {
                  let octetOneValue4 = parseInt(netOctets[0]) + n;
                  for (nn = 0; nn <= octetTwoLength4; nn++) {
                    let octetTwoValue4 = parseInt(netOctets[1]) + nn;
                    for (nnn = 0; nnn <= octetThreeLength4; nnn++) {
                      let octetThreeValue4 = parseInt(netOctets[2]) + nnn;
                      for (nnnn = 0; nnnn <= octetFourLength4; nnnn++) {
                        let octetFourValue4 = parseInt(netOctets[3]) + nnnn;
                        let ip4 = `${octetOneValue4}.${octetTwoValue4}.${octetThreeValue4}.${octetFourValue4}`;
                        // add IP address into database
                        if (n == 0 && nn == 0 && nnn == 0 && nnnn == 0) {
                          new Address({
                            ip: ip4,
                            type: 'Network',
                            prefix: req.body.prefix,
                            gateway: req.body.gateway,
                            customer: '',
                            subnet: sMask,
                            site: req.body.site
                          });
                        } else if (n == octetOneLength4 && nn == octetTwoLength4 && nnn == octetThreeLength4 && nnnn == octetFourLength4) {
                          new Address({
                            ip: ip4,
                            type: 'Broadcast',
                            prefix: req.body.prefix,
                            gateway: req.body.gateway,
                            customer: '',
                            subnet: sMask,
                            site: req.body.site
                          });
                        } else {
                          new Address({
                            ip: ip4,
                            type: 'Unicast',
                            prefix: req.body.prefix,
                            gateway: req.body.gateway,
                            customer: '',
                            subnet: sMask,
                            site: req.body.site
                          });
                        }
                      }
                    }
                  }
                }
                // TODO toaster notification for IP address creation
                // send success message
                req.flash('success_msg', `Prefix and IP Addresses added!`);
                res.redirect('/prefixes/add');
                break;
            }
          }
        } else {
          // IP address creation not requested
        }
      })
      .catch(err => {
        req.flash('error_msg', `Failed to add prefix. Error is ${err}`);
        res.render('/prefixes/add');
        return;
      });
  }
});

module.exports = router;