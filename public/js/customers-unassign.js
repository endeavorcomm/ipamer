document.addEventListener('DOMContentLoaded', function() {

  // initialize tooltips
  var tooltips = document.querySelectorAll('.tooltipped');
  M.Tooltip.init(tooltips);

  // add event listener to address-unassign close button
  const unassignCustomerClose = document.getElementById('unassignCustomerClose');
  unassignCustomerClose.addEventListener('click', function(e) {
    document.getElementById('unassign-address').style.display = 'none';
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
});