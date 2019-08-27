document.addEventListener('DOMContentLoaded', function() {

  // initialize prefix-assign prefix field autocomplete
  var prefixAuto = document.getElementById('site-prefix');
  M.Autocomplete.init(prefixAuto);

  // add event listener to assign prefix close button
  const assignPrefixClose = document.getElementById('assignPrefixClose');
  assignPrefixClose.addEventListener('click', function(e) {
    document.getElementById('assign-prefix').style.display = 'none';
  });

  // add event listenters to assign prefix button
  document.getElementById('assignPrefixBtn').addEventListener('click', function(e){
    const siteName = document.querySelector('.siteName').innerHTML;
    document.getElementById('site').value = siteName;

    // show the popup box
    document.getElementById('assign-prefix').style.display = 'block';

    e.preventDefault();
  });

  // create ajax request and get a list of prefixes when assigning to a site
  var xhrPrefix = new XMLHttpRequest();
  xhrPrefix.open('GET', 'http://localhost/getAvailPrefixes', true);
  xhrPrefix.send();
  xhrPrefix.onreadystatechange = () => {
    if (xhrPrefix.readyState === 4) {
      if (xhrPrefix.status === 200) {
        // convert response string into an object
        var responsePrefix = JSON.parse(xhrPrefix.responseText);

        // manipulate object data into usable format for autocomplete
        var prefixes = {};
        for (var i=0; i<responsePrefix.length; i++) {
          // take IP address and convert it to a key, with null as the value
          prefixes[responsePrefix[i].prefix] = null;
        }

        // update autocomplete data
        let prefixInstance = M.Autocomplete.getInstance(prefixAuto);
        prefixInstance.updateData(prefixes);
      } else {
        console.log('Error with ajax request');
      }
    }
  }
});