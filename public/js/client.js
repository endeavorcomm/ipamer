document.addEventListener('DOMContentLoaded', function() {
  var fabs = document.querySelectorAll('.fixed-action-btn');
  M.FloatingActionButton.init(fabs, {
    hoverEnabled: false
  });

  // initialize site autocomplete field
  var siteAuto = document.getElementById('site');
  M.Autocomplete.init(siteAuto);

  // initialize mobile-nav trigger
  var mobileNav = document.querySelectorAll('.sidenav');
  M.Sidenav.init(mobileNav);

  // create ajax request and get a list of site names
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://localhost/getSites', true);
  xhr.send();
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // convert response string into an object
        var response = JSON.parse(xhr.responseText);

        // manipulate object data into usable format for autocomplete
        var sites = {};
        for (var i=0; i<response.length; i++) {
          // take site name and convert it to a key, with null as the value
          sites[response[i].name] = null;
        }

        // update autocomplete data
        // TODO only load for add prefix screen
        var siteAuto = document.getElementById('site');
        let instance = M.Autocomplete.getInstance(siteAuto);
        instance.updateData(sites);
      } else {
        console.log('Error with ajax request');
      }
    }
  }

  const info_msg = document.getElementById('info_msg');
  const form_prefix = document.getElementById('prefix');
  const form_name = document.getElementById('name');
  const form_gateway = document.getElementById('gateway');
  const form_subnet = document.getElementById('subnet');
  const success_msg = document.getElementById('success_msg');
  const error_msg = document.getElementById('error_msg');
  document.getElementById('addSite').addEventListener('click', () => {
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