document.addEventListener('DOMContentLoaded', function() {

  // initialize tooltips
  var tooltips = document.querySelectorAll('.tooltipped');
  M.Tooltip.init(tooltips);

  // initialize address-assign IP field autocomplete
  var ipAuto = document.getElementById('customer-address');
  M.Autocomplete.init(ipAuto);

  // add event listener to assign address close button
  const assignIPClose = document.getElementById('assignIPClose');
  assignIPClose.addEventListener('click', function(e) {
    document.getElementById('assign-address').style.display = 'none';
  });

  // add event listener to address-unassign close button
  const unassignCustomerClose = document.getElementById('unassignCustomerClose');
  unassignCustomerClose.addEventListener('click', function(e) {
    document.getElementById('unassign-address').style.display = 'none';
  });

  // add event listenters to assign address button
  document.getElementById('assignCustomerBtn').addEventListener('click', function(e){
    const customerName = document.querySelector('.customerName').innerHTML;
    document.getElementById('customer').value = customerName;

    // show the popup box
    document.getElementById('assign-address').style.display = 'block';

    e.preventDefault();
  });

  // add event listenters to address action icons
  const unassignEls = document.querySelectorAll('.unassignIP');
  unassignEls.forEach(function (edit) {
    edit.addEventListener('click', function(e){
      // TODO get ip address for popupbox header with event bubbling to parent
      const id = e.target.id;
      const uncustomerName = document.querySelector('.customerName').innerHTML;

      document.getElementById('unaddressID').value = id;
      document.getElementById('uncustomer').value = uncustomerName;
      //document.getElementById('unassignIPHeader').textContent = `Unassign Customer from IP`;
      document.getElementById('unassign-address').style.display = 'block';

      e.preventDefault();
    });
  });

  // create ajax request and get a list of IPs when assigning to a customer
  var xhrIP = new XMLHttpRequest();
  xhrIP.open('GET', 'http://localhost/getAvailAddresses', true);
  xhrIP.send();
  xhrIP.onreadystatechange = () => {
    if (xhrIP.readyState === 4) {
      if (xhrIP.status === 200) {
        // convert response string into an object
        var responseIP = JSON.parse(xhrIP.responseText);

        // manipulate object data into usable format for autocomplete
        var ips = {};
        for (var i=0; i<responseIP.length; i++) {
          // take IP address and convert it to a key, with null as the value
          ips[responseIP[i].ip] = null;
        }

        // update autocomplete data
        let ipInstance = M.Autocomplete.getInstance(ipAuto);
        ipInstance.updateData(ips);
      } else {
        console.log('Error with ajax request');
      }
    }
  }
});