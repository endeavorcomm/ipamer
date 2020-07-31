document.addEventListener('DOMContentLoaded', function() {
  var fabs = document.querySelectorAll('.fixed-action-btn');
  M.FloatingActionButton.init(fabs, {
    hoverEnabled: false
  });

  // initialize mobile-nav trigger
  var mobileNav = document.querySelectorAll('.sidenav');
  M.Sidenav.init(mobileNav);

  // give search field focus on page load
  document.getElementById('search').focus();

  // check for cookies
  let theCookies = document.cookie.split(';');
  theCookies.forEach(cookie => {
    let parseCookie = cookie.split('=');
    if (parseCookie[0] == 'IPAMerStatus') {
      // replace all %20s in string with a space
      parseCookie[1] = parseCookie[1].replace(/%20/g, ' ');
      M.toast({html: `${parseCookie[1]}`});
      // expire cookie
      document.cookie = "IPAMerStatus=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  });

  // add event listener to pagination buttons
  const paginationEls = document.querySelectorAll('.pagination');
  paginationEls.forEach( element => {
    element.addEventListener('click', function(e) {
      const from = window.location.href
      const referrer = from.split('/')
      e.preventDefault()
      let url = e.target.id;
      if (url === '') {
        url = e.target.parentElement.id;
      }
      const params = url.split('/')
      window.location.href = `http://localhost:8080/${referrer[3]}/status/${params[6]}`
    });
  })
});