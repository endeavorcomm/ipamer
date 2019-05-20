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
});