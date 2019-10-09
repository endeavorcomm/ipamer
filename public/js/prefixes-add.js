document.addEventListener('DOMContentLoaded', function() {

  // initialize prefix-add site field autocomplete
  var siteAuto = document.getElementById('prefix-site');
  M.Autocomplete.init(siteAuto);

  // create ajax request and get a list of site names when adding a prefix
  var xhrSites = new XMLHttpRequest();
  xhrSites.open('GET', '/getSites', true);
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
  };

  // client-side message setup when adding a prefix
  const info_msg = document.getElementById('info_msg');
  const form_prefix = document.getElementById('prefix-prefix');
  const form_name = document.getElementById('prefix-name');
  const form_gateway = document.getElementById('prefix-gateway');
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
  });
});