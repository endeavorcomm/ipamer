document.addEventListener('DOMContentLoaded', function() {
  var fabs = document.querySelectorAll('.fixed-action-btn');
  M.FloatingActionButton.init(fabs, {
    hoverEnabled: false
  });

  // initialize mobile-nav trigger
  var mobileNav = document.querySelectorAll('.sidenav');
  M.Sidenav.init(mobileNav);

});