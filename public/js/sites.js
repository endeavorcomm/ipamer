document.addEventListener('DOMContentLoaded', function() {

  // initialize tooltips
  var tooltips = document.querySelectorAll('.tooltipped');
  M.Tooltip.init(tooltips);

  // initialize prefix-assign prefix field autocomplete
  var prefixAuto = document.getElementById('site-prefix');
  M.Autocomplete.init(prefixAuto);

  // add event listener to assign prefix cancel button
  const assignPrefixCancel = document.getElementById('assignPrefixCancel');
  assignPrefixCancel.addEventListener('click', function(e) {
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

  // add event listener to unassign prefix cancel button
  const unassignPrefixCancel = document.getElementById('unassignPrefixCancel');
  unassignPrefixCancel.addEventListener('click', function(e) {
    document.getElementById('unassign-prefix').style.display = 'none';
  });

  // add event listeners to unassign prefix button
  const unassignEls = document.querySelectorAll('.unassignPrefix');
  unassignEls.forEach(function (edit) {
    edit.addEventListener('click', function(e){
      const id = e.target.id;
      document.getElementById('unprefixID').value = id;
      const prefixName = document.getElementById(`name-${id}`).innerHTML;
      document.getElementById('unprefixName').value = prefixName;
      document.getElementById('unassign-prefix').style.display = 'block';

      e.preventDefault();
    });
  });

  // add event listenter to edit site button
  document.getElementById('editSiteBtn').addEventListener('click', function(e){

    // show the popup box
    document.getElementById('edit-site').style.display = 'block';

    e.preventDefault();
  });

  // add event listener to edit site cancel button
  const editSiteCancel = document.getElementById('editSiteCancel');
  editSiteCancel.addEventListener('click', function(e) {
    document.getElementById('edit-site').style.display = 'none';
  });

  // add event listenter to delete site button
  document.getElementById('deleteSiteBtn').addEventListener('click', function(e){

    // show the popup box
    document.getElementById('delete-site').style.display = 'block';

    e.preventDefault();
  });

  // add event listener to delete site cancel button
  const deleteSiteCancel = document.getElementById('deleteSiteCancel');
  deleteSiteCancel.addEventListener('click', function(e) {
    document.getElementById('delete-site').style.display = 'none';
  });

  // create ajax request and get a list of prefixes when assigning to a site
  var xhrPrefix = new XMLHttpRequest();
  xhrPrefix.open('GET', '/getAvailPrefixes', true);
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