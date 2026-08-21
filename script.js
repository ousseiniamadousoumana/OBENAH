// Mobile menu toggle
(function(){
  var openBtn = document.querySelector('.menu-btn');
  var closeBtn = document.querySelector('.mobile-close');
  var menu = document.querySelector('.mobile-menu');
  var overlay = document.querySelector('.mobile-overlay');

  function openMenu(){
    menu.classList.add('open');
    overlay.classList.add('open');
    openBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu(){
    menu.classList.remove('open');
    overlay.classList.remove('open');
    openBtn.setAttribute('aria-expanded', 'false');
  }
  if(openBtn){ openBtn.addEventListener('click', openMenu); }
  if(closeBtn){ closeBtn.addEventListener('click', closeMenu); }
  if(overlay){ overlay.addEventListener('click', closeMenu); }
  document.querySelectorAll('.mobile-menu a').forEach(function(a){
    a.addEventListener('click', closeMenu);
  });
})();

// Reveal on scroll
(function(){
  var items = document.querySelectorAll('.reveal');
  if(!items.length) return;
  if(!('IntersectionObserver' in window)){
    items.forEach(function(el){ el.classList.add('visible'); });
    return;
  }
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:0.12});
  items.forEach(function(el){ observer.observe(el); });
})();

// FAQ accordion (contact page)
document.querySelectorAll('.faq-item h3').forEach(function(h3){
  h3.addEventListener('click', function(){
    h3.parentElement.classList.toggle('open');
  });
});
