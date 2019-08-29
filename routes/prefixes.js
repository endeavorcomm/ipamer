const express = require('express');
const router = express.Router();
const ip = require('ip');

// load prefix model
Prefix = require('../models/Prefix');

// load site model
Site = require('../models/Site');

// load address model
Address = require('../models/Address');

// add prefix route
router.get('/add', (req, res) => {
  res.render('prefixes/add');
});

// prefix status route
router.get('/status', (req, res) => {
  // query prefixes
  Prefix.find({}, {}).sort({name: 1})
    .then(prefixes => {
      res.render('prefixes/status', {
        prefix: prefixes
      });
    });
});

// prefix detail route
router.get('/prefix/:_id', (req, res) => {
  const _id = req.params._id;

  // query prefix
  Prefix.find({_id: _id}, {})
    .then(prefix => {
      // query addresses in prefix
      Address.find({type: 'Unicast', prefix: prefix[0].prefix}, {}).sort({ip: 1}).collation({locale: "en_US", numericOrdering: true})
      .then(addresses => {
        res.render('prefixes/prefix', {
          id: prefix[0]._id,
          name: prefix[0].name,
          prefix: prefix[0].prefix,
          gateway: prefix[0].gateway,
          subnet: prefix[0].subnet,
          description: prefix[0].description,
          system: prefix[0].system,
          site: prefix[0].site,
          address: addresses
        });
      });
    });
});

// process prefix assign form
router.post('/assign', (req, res) => {
  const site = req.body.site;
  const newPrefix = req.body.prefix;

  // build redirect url from headers
  const reqLocation = req.headers.referer;
  const reqHost = req.headers.host;
  const reqHeader = reqLocation.split(`http://${reqHost}`);
  const reqURL = reqHeader[1];

  // lookup prefix id, based on prefix
  Prefix.findOne({prefix: newPrefix}, {})
    .then(prefixFound => {
      let prefix = {id: prefixFound._id.toString(), prefix: prefixFound.prefix};

      // update site with new prefix
      Site.updateOne({name: site}, {$push: {prefixes: prefix}}, (err, record) => {
        if (err) {
          throw err;
        } else {
          // site updated with Prefix!
        }
      });

      // update prefix with site
      Prefix.updateOne({_id: prefixFound._id.toString()}, {site: site}, (err, record) => {
        if (err) {
          throw err;
        } else {
          // prefix updated with site!
          res.redirect(reqURL);
        }
      });
    });
});

// process prefix unassign form
router.post('/unassign', (req, res) => {
  const site = req.body.unsite;
  const prefixID = req.body.unprefixID;
  const prefixName = req.body.unprefixName;
  const removePrefix = {id: prefixID, prefix: prefixName};

  // build redirect url from headers
  const reqLocation = req.headers.referer;
  const reqHost = req.headers.host;
  const reqHeader = reqLocation.split(`http://${reqHost}`);
  const reqURL = reqHeader[1];

  // remove prefix from site
  Site.updateOne({name: site}, {$pull: {prefixes: removePrefix}}, (err, record) => {
    if (err) {
      throw err;
    } else {
      // prefix removed from site!
    }
  });

  // remove site from prefix
  Prefix.updateOne({_id: prefixID}, {site: ''}, (err, record) => {
    if (err) {
      throw err;
    } else {
      // site removed from prefix!
      res.redirect(reqURL);
    }
  });
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
  const gatewayIsValid = validateGateway(gateway, prefix);
  const typeIsValid = validateType();
  const siteIsValid = validateSite();

  if (cidrSubnetMatches && prefixIsValid && gatewayIsValid && typeIsValid && siteIsValid) {  
    createPrefix();
  }

  function getNetworkAddress(prefix) {
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

  function validateGateway(gateway, prefix) {
    let gatewayValid = false;
    let gatewayMember = false;

    if ( !(v4GateRE.test(gateway) || v6GateRE.test(gateway)) ) {
      // gateway is invalid, don't change value of gatewayValid
    } else {
      // gateway is valid IP address, continue testing
      gatewayValid = true;

      // validate that gateway address is a member of chosen prefix
      if (ip.cidrSubnet(prefix).contains(gateway)) {
        // gateway ip address is part of prefix
        gatewayMember = true;
      }
    }
    if (!gatewayValid) {
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
    } else if (!gatewayMember) {
      // gateway not member of prefix
      let message = 'Gateway IP is not a member of Prefix';
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
      prefix: prefix,
      gateway: gateway,
      subnet: subnet,
      description: req.body.description,
      system: req.body.system,
      site: req.body.site
    });

    newPrefix.save()
      .then(prefix => {
        // define default customer address info
        const addressDefault = {id: '', name: ''};
        const addressNetwork = {id: 'Network', name: 'Reserved'};
        const addressBroadcast = {id: 'Broadcast', name: 'Reserved'};
        const addressGateway = {id: 'Gateway', name: 'Reserved'};

        // check if site was assigned
        if (site !== "") {
          let prefixDetails = {id: prefix._id.toString(), prefix: prefix.prefix};
          // assign prefix to site
          Site.updateOne({name: site}, {$push: {prefixes: prefixDetails}}, (err, record) => {
            if (err) {
              throw err;
            } else {
              // site updated with prefix!
            }
          });
        }
        
        // check if we should create addresses
        if (createAddresses !== undefined) {
          // yes, create addresses

          // check if prefix is IPv6 or IPv4
          const v6 = req.body.prefix.includes("::");
          const v4 = req.body.prefix.includes(".");
          if (v6) {
            // do not create addresses for IPv6
            // TODO toaster notification for non-creation??
            // TODO create network and broadcast addresses
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
            let netOctets = getNetworkAddress(initPrefix);

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
                      customer: addressNetwork,
                      prefix: req.body.prefix,
                      gateway: req.body.gateway,
                      subnet: sMask,
                      site: req.body.site,
                      status: 'Active',
                      description: 'Network IP'

                    });
                    newAddress.save();
                  } else if (n == octetFourLength1) {
                    // address is last in list, so it is the broadcast address
                    let newAddress = new Address({
                      ip: ip1,
                      type: 'Broadcast',
                      customer: addressBroadcast,
                      prefix: req.body.prefix,
                      gateway: req.body.gateway,
                      subnet: sMask,
                      site: req.body.site,
                      status: 'Active',
                      description: 'Broadcast IP'
                    });
                    newAddress.save();
                  } else {
                    // address is normal
                    if (ip1 == req.body.gateway) {
                      // create gateway address
                      let newAddress = new Address({
                        ip: ip1,
                        type: 'Unicast',
                        customer: addressGateway,
                        prefix: req.body.prefix,
                        gateway: 'Self',
                        subnet: sMask,
                        site: req.body.site,
                        status: 'Active',
                        description: 'Gateway IP'
                      });
                      newAddress.save();
                    } else {
                      let newAddress = new Address({
                        ip: ip1,
                        type: 'Unicast',
                        customer: addressDefault,
                        prefix: req.body.prefix,
                        gateway: req.body.gateway,
                        subnet: sMask,
                        site: req.body.site,
                        status: 'Available',
                        description: ''
                      });
                      newAddress.save();
                    }
                  }
                }
                // send success message
                req.flash('success_msg', `Prefix ${prefix.prefix} and IP Addresses added!`);
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
                      // address is first in list, so it is the network address
                      let newAddress = new Address({
                        ip: ip2,
                        type: 'Network',
                        customer: addressNetwork,
                        prefix: req.body.prefix,
                        gateway: req.body.gateway,
                        subnet: sMask,
                        site: req.body.site,
                        status: 'Active',
                        description: 'Network IP'
                      });
                      newAddress.save();
                    } else if (n == octetThreeLength2 && nn == octetFourLength2) {
                      // address is last in list, so it is the broadcast address
                      let newAddress = new Address({
                        ip: ip2,
                        type: 'Broadcast',
                        customer: addressBroadcast,
                        prefix: req.body.prefix,
                        gateway: req.body.gateway,
                        subnet: sMask,
                        site: req.body.site,
                        status: 'Active',
                        description: 'Broadcast IP'
                      });
                      newAddress.save();
                    } else {
                      // address is normal
                      if (ip2 == req.body.gateway) {
                        // create gateway address
                        let newAddress = new Address({
                          ip: ip2,
                          type: 'Unicast',
                          customer: addressGateway,
                          prefix: req.body.prefix,
                          gateway: 'Self',
                          subnet: sMask,
                          site: req.body.site,
                          status: 'Active',
                          description: 'Gateway IP'
                        });
                        newAddress.save();
                      } else {
                        let newAddress = new Address({
                          ip: ip2,
                          type: 'Unicast',
                          customer: addressDefault,
                          prefix: req.body.prefix,
                          gateway: req.body.gateway,
                          subnet: sMask,
                          site: req.body.site,
                          status: 'Available',
                          description: ''
                        });
                        newAddress.save();
                      }
                    }
                  }
                }
                // send success message
                req.flash('success_msg', `Prefix ${prefix.prefix} and IP Addresses added!`);
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
                        // address is first in list, so it is the network address
                        let newAddress = new Address({
                          ip: ip3,
                          type: 'Network',
                          customer: addressNetwork,
                          prefix: req.body.prefix,
                          gateway: req.body.gateway,
                          subnet: sMask,
                          site: req.body.site,
                          status: 'Active',
                          description: 'Network IP'
                        });
                        newAddress.save();
                      }
                      if (n == octetTwoLength3 && nn == octetThreeLength3 && nnn == octetFourLength3) {
                        // address is last in list, so it is the broadcast address
                        let newAddress = new Address({
                          ip: ip3,
                          type: 'Broadcast',
                          customer: addressBroadcast,
                          prefix: req.body.prefix,
                          gateway: req.body.gateway,
                          subnet: sMask,
                          site: req.body.site,
                          status: 'Active',
                          description: 'Broadcast IP'
                        });
                        newAddress.save();
                      } else {
                        // address is normal
                        if (ip3 == req.body.gateway) {
                          // create gateway address
                          let newAddress = new Address({
                            ip: ip3,
                            type: 'Unicast',
                            customer: addressGateway,
                            prefix: req.body.prefix,
                            gateway: 'Self',
                            subnet: sMask,
                            site: req.body.site,
                            status: 'Active',
                            description: 'Gateway IP'
                          });
                          newAddress.save();
                        } else {
                          let newAddress = new Address({
                            ip: ip3,
                            type: 'Unicast',
                            customer: addressDefault,
                            prefix: req.body.prefix,
                            gateway: req.body.gateway,
                            subnet: sMask,
                            site: req.body.site,
                            status: 'Available',
                            description: ''
                          });
                          newAddress.save();
                        }
                      }
                    }
                  }
                }
                // send success message
                req.flash('success_msg', `Prefix ${prefix.prefix} and IP Addresses added!`);
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
                          // address is first in list, so it is the network address
                          let newAddress = new Address({
                            ip: ip4,
                            type: 'Network',
                            customer: addressNetwork,
                            prefix: req.body.prefix,
                            gateway: req.body.gateway,
                            subnet: sMask,
                            site: req.body.site,
                            status: 'Active',
                            description: 'Network IP'
                          });
                          newAddress.save();
                        } else if (n == octetOneLength4 && nn == octetTwoLength4 && nnn == octetThreeLength4 && nnnn == octetFourLength4) {
                          // address is last in list, so it is the broadcast address
                          let newAddress = new Address({
                            ip: ip4,
                            type: 'Broadcast',
                            customer: addressBroadcast,
                            prefix: req.body.prefix,
                            gateway: req.body.gateway,
                            subnet: sMask,
                            site: req.body.site,
                            status: 'Active',
                            description: 'Broadcast IP'
                          });
                          newAddress.save();
                        } else {
                          // address is normal
                          if (ip4 == req.body.gateway) {
                            // create gateway address
                            let newAddress = new Address({
                              ip: ip4,
                              type: 'Unicast',
                              customer: addressGateway,
                              prefix: req.body.prefix,
                              gateway: 'Self',
                              subnet: sMask,
                              site: req.body.site,
                              status: 'Active',
                              description: 'Gateway IP'
                            });
                            newAddress.save();
                          } else {
                            let newAddress = new Address({
                              ip: ip4,
                              type: 'Unicast',
                              customer: addressDefault,
                              prefix: req.body.prefix,
                              gateway: req.body.gateway,
                              subnet: sMask,
                              site: req.body.site,
                              status: 'Available',
                              description: ''
                            });
                            newAddress.save();
                          }
                        }
                      }
                    }
                  }
                }
                // send success message
                req.flash('success_msg', `Prefix ${prefix.prefix} and IP Addresses added!`);
                res.redirect('/prefixes/add');
                break;
            }
          }
        } else {
          // IP address creation not requested, but create Network and Broadcast address

          // check if prefix is IPv6 or IPv4
          const v6 = req.body.prefix.includes("::");
          const v4 = req.body.prefix.includes(".");
          if (v6) {
            // do not create addresses for IPv6
            // TODO toaster notification for non-creation??
          } else if (v4) {
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

            // get network and broadcast address from prefix
            const subnetInfo = ip.cidrSubnet(req.body.prefix);
            const networkAddress = subnetInfo.networkAddress;
            const broadcastAddress = subnetInfo.broadcastAddress;

            let nAddress = new Address({
              ip: networkAddress,
              type: 'Network',
              customer: addressNetwork,
              prefix: req.body.prefix,
              gateway: req.body.gateway,
              subnet: sMask,
              site: req.body.site,
              status: 'Active',
              description: 'Network IP'
            });

            let bAddress = new Address({
              ip: broadcastAddress,
              type: 'Broadcast',
              customer: addressBroadcast,
              prefix: req.body.prefix,
              gateway: req.body.gateway,
              subnet: sMask,
              site: req.body.site,
              status: 'Active',
              description: 'Broadcast IP'
            });

            if (nAddress.save() && bAddress.save()) {
              // send success message
              req.flash('success_msg', `Prefix ${prefix.prefix} added!`);
              res.redirect('/prefixes/add');
            } else {
              // failed to add network and or broadcast address
              req.flash('error_msg', `Failed to add prefix. Error is ${err}`);
              res.render('prefixes/add');
            }
          }
        }
      })
      .catch(err => {
        req.flash('error_msg', `Failed to add prefix. Error is ${err}`);
        res.render('prefixes/add');
        return;
      });
  }
});

module.exports = router;