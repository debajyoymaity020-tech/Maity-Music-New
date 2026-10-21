/* =========================================================
   Maity Music - Back To Top Button
   Sudhu Mobile & Tablet (screen <= 1024px) e dekhabe
   ========================================================= */
(function () {
    'use strict';

    var MAX_WIDTH = 1024;   // ei width ba tar kom hole button kaj korbe
    var SHOW_AFTER = 300;   // koto px niche gele button dekhabe

    // ---------- CSS (JS-er bhitorei, alada CSS lagbe na) ----------
    var style = document.createElement('style');
    style.textContent =
        '#backToTop{' +
            'position:fixed;' +
            'right:16px;' +
            'bottom:calc(20px + env(safe-area-inset-bottom, 0px));' +
            'width:48px;height:48px;' +
            'border-radius:50%;' +
            'border:1px solid #1ed760;' +
            'background:#000;' +
            'color:#1ed760;' +
            'font-size:22px;' +
            'line-height:1;' +
            'display:flex;align-items:center;justify-content:center;' +
            'cursor:pointer;' +
            'z-index:9999;' +
            'box-shadow:0 0 10px rgba(30,215,96,.6),0 0 22px rgba(30,215,96,.25);' +
            'opacity:0;' +
            'visibility:hidden;' +
            'transform:translateY(20px);' +
            'transition:opacity .3s ease,transform .3s ease,visibility .3s;' +
            '-webkit-tap-highlight-color:transparent;' +
            'padding:0;' +
        '}' +
        '#backToTop.show{opacity:1;visibility:visible;transform:translateY(0);}' +
        '#backToTop:active{background:#1ed760;color:#000;}' +
        '#backToTop svg{width:22px;height:22px;pointer-events:none;}';
    document.head.appendChild(style);

    // ---------- Button ----------
    var btn = document.createElement('button');
    btn.id = 'backToTop';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.title = 'Back to top';
    btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(btn);

    // ---------- Logic ----------
    var ticking = false;

    function isSmallScreen() {
        return window.matchMedia('(max-width:' + MAX_WIDTH + 'px)').matches;
    }

    function update() {
        var y = window.pageYOffset || document.documentElement.scrollTop || 0;
        if (isSmallScreen() && y > SHOW_AFTER) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    update();
})();