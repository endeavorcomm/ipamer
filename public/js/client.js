document.addEventListener('DOMContentLoaded', function() {
  var fabs = document.querySelectorAll('.fixed-action-btn');
  M.FloatingActionButton.init(fabs, {
    hoverEnabled: false
  });

  // initialize prefix-add site field autocomplete
  var siteAuto = document.getElementById('prefix-site');
  M.Autocomplete.init(siteAuto);

  // initialize address-add prefix field autocomplete
  var prefixAuto = document.getElementById('address-prefix');
  M.Autocomplete.init(prefixAuto);

  // initialize mobile-nav trigger
  var mobileNav = document.querySelectorAll('.sidenav');
  M.Sidenav.init(mobileNav);

  // create ajax request and get a list of site names when adding a prefix
  var xhrSites = new XMLHttpRequest();
  xhrSites.open('GET', 'http://localhost/getSites', true);
  xhrSites.send();
  xhrSites.onreadystatechange = () => {
    if (xhrSites.readyState === 4) {
      if (xhrSites.status === 200) {
        // convert response string into an object
        var responseSites = JSON.parse(xhrSites.responseText);

        // manipulate object data into usable format for autocomplete
        var sites = {};
        for (var i=0; i<responseSites.length; i++) {
          // take site name and convert it to a key, with null as the value
          sites[responseSites[i].name] = null;
        }

        // update autocomplete data
        // TODO only load for add prefix screen
        var siteAuto = document.getElementById('prefix-site');
        let siteInstance = M.Autocomplete.getInstance(siteAuto);
        siteInstance.updateData(sites);
      } else {
        console.log('Error with ajax request');
      }
    }
  }

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

  // client-side message setup when adding a site
  const info_msg = document.getElementById('info_msg');
  const form_prefix = document.getElementById('prefix-prefix');
  const form_name = document.getElementById('prefix-name');
  const form_gateway = document.getElementById('prefix-gateway');
  const form_subnet = document.getElementById('prefix-subnet');
  const success_msg = document.getElementById('success_msg');
  const error_msg = document.getElementById('error_msg');
  document.getElementById('addPrefix').addEventListener('click', () => {
    if (form_prefix.value !== '' && form_name.value !== '' && form_gateway.value !== '') {
      if (success_msg) {
        success_msg.style.display = 'none';
        success_msg.innerHTML = '';
      }
      if (error_msg) {
        error_msg.style.display = 'none';
        error_msg.innerHTML = '';
      }
      info_msg.innerHTML = 'Creating ...';
      info_msg.style.display = 'block';
    }
  })
});