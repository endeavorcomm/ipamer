const express = require('express');
const router = express.Router();
const ip = require('ip');
const fetch = require('node-fetch');

// add address route
router.get('/assign', (req, res) => {
  (async () => {
    const siteResponse = await fetch(`https://netbox.weendeavor.com/api/dcim/sites/`, {
      headers: {
        'Authorization': `Token ${process.env.NETBOX_API_KEY}`,
        'Accept': 'application/json'
      }
    })

    const siteJson = await siteResponse.json()

    // manipulate object data into usable format for autocomplete
    let sites = [];
    for (var i=0; i<siteJson.count; i++) {
      sites.push(siteJson.results[i].name)
    }

    let selectedCustomer
    if (req.query.name) {
      // customer name was included in url, prepopulate customer value of form with this data
      selectedCustomer = req.query.name
    }

    const customerResponse = await fetch(`https://netbox.weendeavor.com/api/tenancy/tenants/?limit=0`, {
      headers: {
        'Authorization': `Token ${process.env.NETBOX_API_KEY}`,
        'Accept': 'application/json'
      }
    })

    const customerJson = await customerResponse.json()

    let customerData = {};
    // manipulate object data into usable format for autocomplete
    for (let i=0; i<customerJson.count; i++) {
      customerData[customerJson.results[i].name] = null;
    }

    const customers = JSON.stringify(customerData)

    res.render('addresses/assign', {
      sites,
      customers,
      selectedCustomer
    });
  })();
});

// address detail route
router.get('/address/:id', (req, res) => {
  (async () => {
    const id = req.params.id;

    // get address info
    const response = await fetch(`https://netbox.weendeavor.com/api/ipam/ip-addresses/${id}`, {
      headers: {
        'Authorization': `Token ${process.env.NETBOX_API_KEY}`
      }
    })

    const address = await response.json()
    const realAddress = address.address

    // separate ip from cidr notation
    const splitAddress = realAddress.split('/')
    
    // calculate network address
    const addressInfo = await ip.cidrSubnet(realAddress)
    const prefix = `${addressInfo.networkAddress}/${splitAddress[1]}`

    // get gateway and subnet info
    const getGateway = await fetch(`https://netbox.weendeavor.com/api/ipam/prefixes?prefix=${prefix}`, {
      headers: {
        'Authorization': `Token ${process.env.NETBOX_API_KEY}`
      }
    })

    const getGatewayResponse = await getGateway.json()
    const gateway = getGatewayResponse.results[0].custom_fields.gateway
    const subnet = getGatewayResponse.results[0].custom_fields.subnet

    res.render('addresses/address', {
      address,
      subnet,
      gateway
    });
  })();
});

router.post('/assign', (req, res) => {
  async function assignIP(addressCount, customerId, site) {
    let ipsNeeded = parseInt(addressCount)
    const prefixResponse = await fetch(`https://netbox.weendeavor.com/api/ipam/prefixes/?site=${site}&tag=static`, {
      headers: {
        'Authorization': `Token ${process.env.NETBOX_API_KEY}`,
        'Accept': 'application/json'
      }
    })

    const prefixJson = await prefixResponse.json()
    const numPrefixes = prefixJson.count

    // find one or more prefixes with enough available IPs to fulfill request
    let availableResponse
    let availableJson
    let availableIPs = 0
    let prefixesUsed = 0

    for (let i=0; i < numPrefixes; i++) {
      // find out how many IPs are available, and number of prefixes used to fulfill request
      availableResponse = await fetch(`https://netbox.weendeavor.com/api/ipam/prefixes/${prefixJson.results[i].id}/available-ips`, {
        headers: {
          'Authorization': `Token ${process.env.NETBOX_API_KEY}`,
          'Accept': 'application/json'
        }
      })

      availableJson = await availableResponse.json()
      availableIPs += availableJson.length
      prefixesUsed += 1
    }
    if (ipsNeeded <= availableIPs) {
      // there are enough IPs to fulfill request, get available IPs and assign
        for (let i=0; i < prefixesUsed ; i++) {
          availableResponse = await fetch(`https://netbox.weendeavor.com/api/ipam/prefixes/${prefixJson.results[i].id}/available-ips`, {
            headers: {
              'Authorization': `Token ${process.env.NETBOX_API_KEY}`,
              'Accept': 'application/json'
            }
          })

          availableJson = await availableResponse.json()
          let ipsAvailableInPrefix = availableJson.length
          let iterations = (ipsNeeded > ipsAvailableInPrefix) ? ipsAvailableInPrefix : ipsNeeded
          for (let j=0; j < iterations; j++) {
            let vrf = (prefixJson.results[i].vrf === null) ? null : prefixJson.results[i].vrf.id
            const data = {
              address: availableJson[j].address,
              tenant: customerId,
              vrf
            }
      
            await fetch('https://netbox.weendeavor.com/api/ipam/ip-addresses/', {
              method: 'POST',
              headers: {
                'Authorization': `Token ${process.env.NETBOX_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data)
            })
    
          }

          // subtract iterations (number of IPs we just created/assigned) from ipsNeeded to see how many more we need to create with additional prefixes
          ipsNeeded -= iterations
        }
      return true
    } else {
      // not enough IPs available
      return false
    }
  }

  (async () => {
    const address_count = req.body.addressCount;
    const name = req.body.customer;
    const site = req.body.site.toLowerCase();

    const customerResponse = await fetch(`https://netbox.weendeavor.com/api/tenancy/tenants/?name=${name}`, {
      headers: {
        'Authorization': `Token ${process.env.NETBOX_API_KEY}`,
        'Accept': 'application/json'
      }
    })

    const customerJson = await customerResponse.json()

    if (customerJson.count === 0) {
      // customer does not exist, create
      const lowerName = name.toLowerCase();
      const slug = lowerName.replace(' ', '-');
      const data = {
        name,
        slug
      }

      const response = await fetch('https://netbox.weendeavor.com/api/tenancy/tenants/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.NETBOX_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const customer = await response.json()

      const assigned = await assignIP(address_count, customer.id, site)
      if (assigned) {
        res.cookie('IPAMerStatus', 'IP Assigned!');
        res.redirect(`/customers/customer/${customer.id}`)
      } else {
        res.cookie('IPAMerStatus', 'Not Enough IPs Available');
        res.redirect('/addresses/assign');
      }
    } else {
      // customer exists, find an available IP and assign
      const assigned = await assignIP(address_count, customerJson.results[0].id, site)
      if (assigned) {
        res.cookie('IPAMerStatus', 'IP Assigned!');
        res.redirect(`/customers/customer/${customerJson.results[0].id}`);
      } else {
        res.cookie('IPAMerStatus', 'Not Enough IPs Available');
        res.redirect('/addresses/assign');
      }
    }
  })();
});

router.post('/', (req, res) => {
  (async () => {
    const id = req.body.unaddressID;

    // build redirect url from headers
    const reqLocation = req.headers.referer;
    const reqHost = req.headers.host;
    const reqHeader = reqLocation.split(`http://${reqHost}`);
    const reqURL = reqHeader[1];
    
    // delete address from netbox
    const response = await fetch(`https://netbox.weendeavor.com/api/ipam/ip-addresses/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${process.env.NETBOX_API_KEY}`
      }
    })

    if (response.status === 204) {
      // set cookie for toast
      res.cookie('IPAMerStatus', 'Address Unassigned');
      res.redirect(reqURL);
    } else {
      console.log(response)
    }
  })();
});

// process address edit form
router.post('/edit', (req, res) => {
  (async () => {
    const addressID = req.body.addressID;
    const address = req.body.address;
    const description = req.body.addressDescription;

    // build redirect url from headers
    const reqLocation = req.headers.referer;
    const reqHost = req.headers.host;
    const reqHeader = reqLocation.split(`http://${reqHost}`);
    const reqURL = reqHeader[1];

    // TODO send request to netbox
    const data = {
      address,
      description
    }

    const response = await fetch(`https://netbox.weendeavor.com/api/ipam/ip-addresses/${addressID}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Token ${process.env.NETBOX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const changed = await response.json()
    if (changed.id) {
      // set cookie for toast
      res.cookie('IPAMerStatus', 'Address Updated');
      res.redirect(reqURL);
    } else {
      console.log(response)
    }
  })();
});

module.exports = router;