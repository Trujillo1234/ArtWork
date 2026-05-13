const megaMenuOne = `
<div class="mega-menu-nav-wrapper">
        <mega-menu-placeholder> </mega-menu-placeholder>
</div>
<div class="mega-menu-content-wrapper">
        <div class="text">
          <h2>Home</h2>
          <p>Home</p>
        </div>
        <div class="image-wrapper">
        <img id="img" alt="home" src=''>
        </div>
</div>`;
const megaMenuTwo = `
<div class="mega-menu-nav-wrapper">
        <mega-menu-placeholder> </mega-menu-placeholder>
</div>
<div class="mega-menu-content-wrapper">
        <div class="text">
          <h2>About</h2>
          <p>About</p>
        </div>
        <div class="image-wrapper">
        <img id="img" alt="about" src='/pics/megaMenu/About.jpg'>
        </div>
</div>`;
const megaMenuThree = `
<div class="mega-menu-nav-wrapper">
        <mega-menu-placeholder> </mega-menu-placeholder>
</div>
<div class="mega-menu-content-wrapper">
        <div class="text">
          <h2>Admissions</h2>
          <p>Admissions</p>
        </div>
        <div class="image-wrapper">
        <img id="img" alt="admissions" src='/pics/megaMenu/Admissions.jpg'>
        </div>
</div>`;
const megaMenuFour = `
<div class="mega-menu-nav-wrapper">
        <mega-menu-placeholder> </mega-menu-placeholder>
</div>
<div class="mega-menu-content-wrapper">
        <div class="text">
          <h2>Student Life</h2>
          <p>Student Life</p>
        </div>
        <div class="image-wrapper">
        <img id="img" alt="student life" src='/pics/megaMenu/Student_Life.jpg'>
        </div>
</div>`;
const megaMenuFive = `
<div class="mega-menu-nav-wrapper">
        <mega-menu-placeholder> </mega-menu-placeholder>
</div>
<div class="mega-menu-content-wrapper">
        <div class="text">
          <h2>Resources</h2>
          <p>Resources</p>
        </div>
        <div class="image-wrapper">
        <img id="img" alt="resources" src='/pics/megaMenu/Resources.jpg'>
        </div>
</div>`;
const megaMenuSix = `
<div class="mega-menu-nav-wrapper">
        <mega-menu-placeholder> </mega-menu-placeholder>
</div>
<div class="mega-menu-content-wrapper">
        <div class="text">
          <h2>Academics</h2>
          <p>Academics</p>
        </div>
        <div class="image-wrapper">
        <img id="img" alt="academics" src='/pics/megaMenu/Academics.jpg'>
        </div>
</div>`;
const megaMenuSeven = `
<div class="mega-menu-nav-wrapper">
        <mega-menu-placeholder> </mega-menu-placeholder>
</div>
<div class="mega-menu-content-wrapper">
        <div class="text">
          <h2>Contact</h2>
          <p>Contact</p>
        </div>
        <div class="image-wrapper">
        <img id="img" alt="contact" src='/pics/megaMenu/Contact.jpg'>
        </div>
</div>`;

const megaMenuConfig = {
  content: {
    1: megaMenuOne,
    2: megaMenuTwo,
    3: megaMenuThree,
    4: megaMenuFour,
    5: megaMenuFive,
    6: megaMenuSix,
    7: megaMenuSeven,
  },
};

$(window).bind('load resize scroll', function (e) {
  var y = $(window).scrollTop();

  $('#slide-1')
    .filter(function () {
      return $(this).offset().top < y + $(window).height() && $(this).offset().top + $(this).height() > y;
    })
    .css('background-position', '50% ' + parseInt(-y / 8 + 200) + 'px');
});

function resizeCardSlider() {
  if (window.innerWidth > 1150) {
    return;
  } else if (window.innerWidth <= 1150) {
    let columnGap = [];
    let slider = document.querySelectorAll('.en-card-slider-inner-container');
    if (!slider) return;
    for (let i = 0; i < slider.length; i++) {
      columnGap = slider[i].style.getPropertyValue('column-gap').replace('px', '');
      slider[i].style.removeProperty('column-gap');
      slider[i].style.setProperty('column-gap', Number(columnGap) + 2 + 'px', 'important');
    }
  }
}
let _debounce = function (ms, fn) {
  let timer;
  return function () {
    clearTimeout(timer);
    let args = Array.prototype.slice.call(arguments);
    args.unshift(this);
    timer = setTimeout(fn.bind.apply(fn, args), ms);
  };
};
document.addEventListener('DOMContentLoaded', () => {
  const observer = new ResizeObserver(_debounce(500, () => resizeCardSlider()));
  let slider = document.querySelector('body');
  observer.observe(slider);
  // login popup
  const loginHomePage = document.querySelector('.click-login');
  const formLogin = document.querySelector('.login-form-home');
  const closeBtnLogin = document.getElementById('close-btn-popup');
  loginHomePage.addEventListener('click', () => {
    formLogin.classList.toggle('active');
  });
  closeBtnLogin.addEventListener('click', () => {
    formLogin.classList.remove('active');
  });
  
  if (document.querySelector('.news-box')) {
    document.querySelector('.en-news-show-all a').innerText = 'show all news';
  }
});
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth',
    });
  });
});
