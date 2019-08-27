document.addEventListener('DOMContentLoaded', function() {
  // if this page loaded because of a form error, fill in values
  // get prefix field value, to evaluate
  var prefix = document.getElementById('address-prefix').value;
  if (prefix !== "") {
    // get any subnet and site value as well
    const addressSubnet = document.getElementById('address-subnet');
    const addressSite = document.getElementById('address-site');
    
    // if they don't exist, enable form fields
    if (addressSubnet == "") {
      addressSubnet.style.disabled = false;
    }
    // if (addressSite == "") {
    //   addressSite.style.disabled = false;
    // }
  }

  document.getElementById('address-customer').addEventListener('change', () => {
    // set focus on next field
    document.getElementById('address-description').focus();
  });

  document.getElementById('address-customer').addEventListener('blur', () => {
    // set focus on next field
    document.getElementById('address-description').focus();
  });

  // initialize address-add prefix field autocomplete
  var prefixAuto = document.getElementById('address-prefix');
  M.Autocomplete.init(prefixAuto);

  // create ajax request and get a list of prefix names when adding an IP address
  var xhrPrefixes = new XMLHttpRequest();
  xhrPrefixes.open('GET', 'http://localhost/getPrefixes', true);
  xhrPrefixes.send();
  xhrPrefixes.onreadystatechange = () => {
    if (xhrPrefixes.readyState === 4) {
      if (xhrPrefixes.status === 200) {
        // convert response string into an object
        var responsePrefixes = JSON.parse(xhrPrefixes.responseText);

        // manipulate object data into usable format for autocomplete
        var prefixes = {};
        for (var i=0; i<responsePrefixes.length; i++) {
          // take prefix string and convert it to a key, with null as the value
          prefixes[responsePrefixes[i].prefix] = null;
        }

        // update autocomplete data
        // TODO only load for add address screen
        let prefixInstance = M.Autocomplete.getInstance(prefixAuto);
        prefixInstance.updateData(prefixes);
      } else {
        console.log('Error with ajax request');
      }
    }
  }

  // initialize address-add customer field autocomplete
  var customerAuto = document.getElementById('address-customer');
  M.Autocomplete.init(customerAuto);

  // create ajax request and get a list of customer names when adding an IP address
  var xhrCustomer = new XMLHttpRequest();
  xhrCustomer.open('GET', 'http://localhost/getCustomers', true);
  xhrCustomer.send();
  xhrCustomer.onreadystatechange = () => {
    if (xhrCustomer.readyState === 4) {
      if (xhrCustomer.status === 200) {
        // convert response string into an object
        var responseCustomers = JSON.parse(xhrCustomer.responseText);

        // manipulate object data into usable format for autocomplete
        var customers = {};
        for (var i=0; i<responseCustomers.length; i++) {
          // take customer string and convert it to a key, with null as the value
          customers[responseCustomers[i].name] = null;
        }

        // update autocomplete data
        let customerInstance = M.Autocomplete.getInstance(customerAuto);
        customerInstance.updateData(customers);
      } else {
        console.log('Error with ajax request');
      }
    }
  }

  // initialize address-add site field autocomplete
  var siteAuto = document.getElementById('address-site');
  M.Autocomplete.init(siteAuto);

  // create ajax request and get a list of customer names when adding an IP address
  var xhrSite = new XMLHttpRequest();
  xhrSite.open('GET', 'http://localhost/getSites', true);
  xhrSite.send();
  xhrSite.onreadystatechange = () => {
    if (xhrSite.readyState === 4) {
      if (xhrSite.status === 200) {
        // convert response string into an object
        var responseSites = JSON.parse(xhrSite.responseText);

        // manipulate object data into usable format for autocomplete
        var sites = {};
        for (var i=0; i<responseSites.length; i++) {
          // take site string and convert it to a key, with null as the value
          sites[responseSites[i].name] = null;
        }

        // update autocomplete data
        let siteInstance = M.Autocomplete.getInstance(siteAuto);
        siteInstance.updateData(sites);
      } else {
        console.log('Error with ajax request');
      }
    }
  }

  document.getElementById('address-prefix').addEventListener('change', () => {
    // when Prefix/CIDR field is changed, fill in Subnet, Gateway and Site if available

    // get prefix field value
    var prefix = document.getElementById('address-prefix').value;
    checkPrefix(prefix);
  });

  function checkPrefix(prefix) {
    // define regular expressions for validating prefix
    const v4PreRE = /((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])(\/([1-9]|[1-2][0-9]|3[0-1]))?$/;
    const v6PreRE = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|[fF][eE]80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::([fF]{4}(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

    const prefixIsValid = validatePrefix(prefix);

    function validatePrefix(prefix) {
      if ( !(v4PreRE.test(prefix) || v6PreRE.test(prefix)) ) {
        // invalid prefix given
        return false;
      } else {
        // prefix is valid IPv4 or IPv6
        return true;
      }
    }

    const addressSubnet = document.getElementById('address-subnet');
    const addressGateway = document.getElementById('address-gateway');
    const addressSite = document.getElementById('address-site');
    const infoMessage = document.getElementById('info_msg');

    if (prefixIsValid) {
      if (prefix !== "") {
        // prefix field value is not empty, see if prefix exists in database
        const makeRequest = function (method, url) {
          let xhr = new XMLHttpRequest();

          return new Promise(function (resolve, reject) {
            xhr.onreadystatechange = () => {
              if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                  resolve(xhr.responseText);
                } else {
                  reject({
                    status: request.status,
                    statusText: request.statusText
                  });
                }
              } else {
                return;
              }
            }
            xhr.open(method || 'GET', url, true);
            xhr.send();
          });
        }

        makeRequest('GET', `http://localhost/findPrefix?prefix=${prefix}`)
          .then(responsePrefix => {
            if (responsePrefix !== "") {
              // prefix exists
              responsePrefix = JSON.parse(responsePrefix);
              const prefixSubnet = responsePrefix.subnet;
              const prefixGateway = responsePrefix.gateway;
              const prefixSite = responsePrefix.site;
      
              // assign the found prefix values to input field values
              addressSubnet.value = prefixSubnet;
              addressGateway.value = prefixGateway;
              addressSite.value = prefixSite;
      
              if (prefixSubnet == "") {
                // prefix subnet field is empty in database, enable form Subnet field for assignment, if desired
                addressSubnet.disabled = false;
              } else {
                // prefix subnet field is not empty in database, disable form Subnet field
                addressSubnet.disabled = true;
              }
          
              // if (prefixSite == "") {
              //   // prefix site field is empty in database, enable form Site field for assignment, if desired
              //   addressSite.disabled = false;
              // } else {
              //   // prefix subnet field is not empty in database, disable form Site field
              //   addressSite.disabled = true;
              // }
      
              // show updated form field values
              M.updateTextFields();
      
              // set focus on next field
              document.getElementById('address-address').focus();
            } else {
              const infoMessage = document.getElementById('info_msg');
              // prefix is invalid or doesn't exist, send alert
              infoMessage.textContent = "Invalid Prefix in promise then";
              infoMessage.style.display = "block";
      
              // clear alert after 2 seconds
              setTimeout( () => {
                infoMessage.style.display = "none";
              }, 2000);
      
              // set focus on next field
              document.getElementById('address-prefix').focus();
            }
          });
      } else {
        // prefix doesn't exist, send alert
        infoMessage.textContent = "Prefix Required";
        infoMessage.style.display = "block";

        // clear alert after 2 seconds
        setTimeout( () => {
          infoMessage.style.display = "none";
        }, 2000);
        // set focus on next field
        document.getElementById('address-prefix').focus();
      }
    }
  }
});