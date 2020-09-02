const express = require('express');
const router = express.Router();
const fetch = require('node-fetch')
const NETBOX_API_KEY = process.env.NETBOX_API_KEY
const NETBOX_HOST = process.env.NETBOX_HOST

// add customer route
router.get('/add', (req, res) => {
  res.render('customers/add');
});

// customer status route
router.get('/status', (req, res) => {
  // query customers
  (async () => {
    let url
    const limit = req.query.limit ? req.query.limit : false
    const offset = req.query.offset ? req.query.offset : false
    if (limit && offset) {
      url = `${NETBOX_HOST}/api/tenancy/tenants/?limit=${limit}&offset=${offset}`
    } else {
      url = `${NETBOX_HOST}/api/tenancy/tenants/`
    }
    const response = await fetch(url, {
      headers: {'Authorization': `Token ${NETBOX_API_KEY}`}
    })
    
    const tenants = await response.json()
    res.render('customers/status', {
      customer: tenants
    })
  })();
});

// customer detail route
router.get('/customer/:id', (req, res) => {
  (async () => {
    let url
    const id = req.params.id;
    const limit = req.query.limit ? req.query.limit : false
    const offset = req.query.offset ? req.query.offset : false
    if (limit && offset) {
      url = `${NETBOX_HOST}/api/ipam/ip-addresses/?tenant_id=${id}&limit=${limit}&offset=${offset}`
    } else {
      url = `${NETBOX_HOST}/api/ipam/ip-addresses/?tenant_id=${id}`
    }
    const addressFetch = await fetch(url, {
      headers: {'Authorization': `Token ${NETBOX_API_KEY}`}
    })
    
    const addresses = await addressFetch.json()

    const customerFetch = await fetch(`${NETBOX_HOST}/api/tenancy/tenants/${id}`, {
      headers: {'Authorization': `Token ${NETBOX_API_KEY}`}
    })
    
    const customer = await customerFetch.json()

    res.render('customers/customer', {
      addresses,
      customer
    })
  })();
});

// process customer creation form
router.post('/add', (req, res) => {
  (async () => {
    const name = req.body.name;
    const description = req.body.description;
    const lowerName = name.toLowerCase();
    const slug = lowerName.replace(' ', '-');
    const data = {
      name,
      slug,
      description
    }

    const response = await fetch(`${NETBOX_HOST}/api/tenancy/tenants/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${NETBOX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const customer = await response.json()
    if (customer.name[0] === 'tenant with this name already exists.') {
      req.flash('error_msg', 'Customer already exists.');
      res.redirect('/customers/add');
    } else {
      res.redirect(`customer/${customer.id}`)
    }
  })();
});

// process customer edit form
router.post('/edit', (req, res) => {
  (async () => {
    // build redirect url from headers
    const reqLocation = req.headers.referer;
    const reqHost = req.headers.host;
    const reqHeader = reqLocation.split(`${reqHost}/`);
    const reqURL = reqHeader[1];

    const id = req.body.customerID;
    let name
    let description

    if (req.body.customerName !== '') {
      name = req.body.customerName;
    }
    
    if (req.body.customerDescription !== '') {
      description = req.body.customerDescription;
    }

    const data = {
      name,
      description
    }

    const response = await fetch(`${NETBOX_HOST}/api/tenancy/tenants/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Token ${NETBOX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const customer = await response.json()
    if (customer.id) {
      res.redirect(`customer/${customer.id}`)
    } else {
      req.flash('error_msg', 'Customer already exists.');
      res.redirect(reqURL);
    }
  })();
});

// process customer delete form
router.post('/delete', (req, res) => {
  (async () => {
    const id = req.body.customerId;

    // get all IPs assigned to customer
    const getTenantIps = await fetch(`${NETBOX_HOST}/api/ipam/ip-addresses/?tenant_id=${id}`, {
      headers: {
        'Authorization': `Token ${NETBOX_API_KEY}`
      }
    })

    const ipResponse = await getTenantIps.json()
    const ips = ipResponse.results
    
    const deleteIps = async (ips) => {
      const results = []
      for (const ip of ips) {
        const response = await fetch(`${NETBOX_HOST}/api/ipam/ip-addresses/${ip.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${NETBOX_API_KEY}`
          }
        })
        results.push(response.status)
      }
      return results
    }
    const ipsDeleted = await deleteIps(ips)
    if (ipsDeleted.includes(!204)) {
      res.cookie('IPAMerStatus', 'Error deleting customer IPs.');
      res.redirect(req.headers.referer);
    } else {
      const response = await fetch(`${NETBOX_HOST}/api/tenancy/tenants/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${NETBOX_API_KEY}`
        }
      })

      if (response.status === 204) {
        //set cookie for toast
        res.cookie('IPAMerStatus', 'Customer Deleted');
        res.redirect('/');
      } else {
        const err = await response.json()
        console.log(err)
        res.cookie('IPAMerStatus', 'Error deleting customer.');
        res.redirect(req.headers.referer);
      }
    }
  })();
});

module.exports = router;