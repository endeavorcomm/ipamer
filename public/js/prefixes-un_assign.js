document.addEventListener('DOMContentLoaded', function() {

  // initialize tooltips
  var tooltips = document.querySelectorAll('.tooltipped');
  M.Tooltip.init(tooltips);

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

  // add event listener to unassign prefix close button
  const unassignPrefixClose = document.getElementById('unassignPrefixClose');
  unassignPrefixClose.addEventListener('click', function(e) {
    document.getElementById('unassign-prefix').style.display = 'none';
  });

  const unassignEls = document.querySelectorAll('.unassignPrefix');
  unassignEls.forEach(function (edit) {
    edit.addEventListener('click', function(e){
      // TODO get ip address for popupbox header with event bubbling to parent
      const id = e.target.id;

      document.getElementById('unprefixID').value = id;
      const prefixName = document.getElementById(`name-${id}`).innerHTML;
      document.getElementById('unprefixName').value = prefixName;
      //document.getElementById('unassignIPHeader').textContent = `Unassign Customer from IP`;
      document.getElementById('unassign-prefix').style.display = 'block';

      e.preventDefault();
    });
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