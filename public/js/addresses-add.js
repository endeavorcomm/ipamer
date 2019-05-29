document.addEventListener('DOMContentLoaded', function() {
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
        var prefixAuto = document.getElementById('address-prefix');
        let prefixInstance = M.Autocomplete.getInstance(prefixAuto);
        prefixInstance.updateData(prefixes);
      } else {
        console.log('Error with ajax request');
      }
    }
  }

  document.getElementById('address-prefix').addEventListener('blur', () => {
    const addressSubnet = document.getElementById('address-subnet');
    const addressGateway = document.getElementById('address-gateway');
    const addressSite = document.getElementById('address-site');

    var prefix = document.getElementById('address-prefix').value;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', `http://localhost/findPrefix?prefix=${prefix}`, true);
    xhr.send();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // convert response string into an object
          let responsePrefix = JSON.parse(xhr.responseText);
          const prefixSubnet = responsePrefix.subnet;
          const prefixGateway = responsePrefix.gateway;
          const prefixSite = responsePrefix.site;

          addressSubnet.value = prefixSubnet;
          addressGateway.value = prefixGateway;
          addressSite.value = prefixSite;

          M.updateTextFields();

        } else {
          console.log('Error with ajax request');
        }
      }
    }
  })
});