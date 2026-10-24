// ================= PROFILE MENU =================
const profileBtn  = document.getElementById('profileBtn');
const profileMenu = document.getElementById('profileMenu');
const myProfile   = document.getElementById('myProfile');

profileBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    const open = profileMenu.classList.toggle('show');
    profileBtn.setAttribute('aria-expanded', open);
});
document.addEventListener('click', function (e) {
    if (!myProfile.contains(e.target)) {
        profileMenu.classList.remove('show');
        profileBtn.setAttribute('aria-expanded', false);
    }
});
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') profileMenu.classList.remove('show');
});

// ================= BHOJPURI BUTTON =================


// ================= PLAYER ELEMENTS =================
const audio   = document.getElementById('main-audio');
const pImg    = document.getElementById('player-img');
const pTitle  = document.getElementById('player-title');
const pArtist = document.getElementById('player-artist');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');

// ================= CANVAS VIDEO ELEMENTS =================
const canvasPanel  = document.getElementById('canvas-panel');
const cVideo       = document.getElementById('canvas-video');
const canvasTitle  = document.getElementById('canvas-title');
const canvasArtist = document.getElementById('canvas-artist');

const songs = document.querySelectorAll('.ps [class^="ps-all"]');
let currentIndex = -1;

// ================= SAFE PATH (space, bracket, bangla sob encode) =================
function safe(path) {
    return path.split('/').map(encodeURIComponent).join('/');
}

// ================= DYNAMIC TIME (audio file theke) =================
function fmt(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
}

songs.forEach(function (song) {
    const src  = song.dataset.audio;
    const time = song.querySelector('.time');
    if (!src || !time) return;

    const temp = new Audio();
    temp.preload = 'metadata';
    temp.src = safe(src);
    temp.addEventListener('loadedmetadata', function () {
        time.textContent = fmt(temp.duration);
    });
    temp.addEventListener('error', function () {
        console.error('AUDIO NOT FOUND:', temp.src);
        time.textContent = '--';
    });
});

// ================= CANVAS VIDEO =================
function loadCanvas(song) {
    const v = song.dataset.video;

    if (!v) {
        cVideo.pause();
        cVideo.removeAttribute('src');
        cVideo.load();
        canvasPanel.classList.remove('show');
        document.body.classList.remove('has-canvas');
        return;
    }

    cVideo.src = safe(v);
    cVideo.onerror = function () {
        console.error('VIDEO NOT FOUND:', cVideo.src);
    };
    canvasTitle.textContent  = song.querySelector('.des1').textContent;
    canvasArtist.textContent = song.querySelector('.des2').textContent;
    canvasPanel.classList.add('show');
    document.body.classList.add('has-canvas');
    cVideo.play().catch(function () {});
}

// gan bajle video bajbe, gan thamle video thambe
audio.addEventListener('play', function () {
    if (cVideo.getAttribute('src')) cVideo.play().catch(function () {});
});
audio.addEventListener('pause', function () {
    cVideo.pause();
});

// ================= MEDIA SESSION (lock screen controls + background play) =================
function updateMediaSession(song) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title:  song.querySelector('.des1').textContent.trim(),
        artist: song.querySelector('.des2').textContent.trim(),
        album:  'Maity Music',
        artwork: [{ src: song.querySelector('.image-in').src, sizes: '512x512' }]
    });
}

if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play',          function () { audio.play(); });
    navigator.mediaSession.setActionHandler('pause',         function () { audio.pause(); });
    navigator.mediaSession.setActionHandler('previoustrack', function () { changeSong(-1); });
    navigator.mediaSession.setActionHandler('nexttrack',     function () { changeSong(1); });
    try {
        navigator.mediaSession.setActionHandler('seekto', function (d) {
            if (d.seekTime != null) audio.currentTime = d.seekTime;
        });
    } catch (e) {}

    audio.addEventListener('play',  function () { navigator.mediaSession.playbackState = 'playing'; });
    audio.addEventListener('pause', function () { navigator.mediaSession.playbackState = 'paused'; });
    audio.addEventListener('timeupdate', function () {
        try {
            if (isFinite(audio.duration)) {
                navigator.mediaSession.setPositionState({
                    duration: audio.duration,
                    playbackRate: audio.playbackRate,
                    position: audio.currentTime
                });
            }
        } catch (e) {}
    });
}

// ================= PLAY SONG =================
function playSong(index) {
    const song = songs[index];
    const src = song.dataset.audio;
    if (!src) return;

    currentIndex = index;
    audio.src = safe(src);
    audio.onerror = function () {
        console.error('AUDIO NOT FOUND:', audio.src);
    };
    audio.play().catch(function () {});

    pImg.src = song.querySelector('.image-in').src;
    pTitle.innerHTML = song.querySelector('.des1').innerHTML;
    pArtist.textContent = song.querySelector('.des2').textContent;

    loadCanvas(song);
    updateMediaSession(song);
    updatePip();
}

songs.forEach(function (song, index) {
    const btn = song.querySelector('.play');
    btn.addEventListener('click', function () {
        if (!song.dataset.audio) return;
        if (index === currentIndex) {
            audio.paused ? audio.play() : audio.pause();
        } else {
            playSong(index);
        }
    });
});

// ================= NEXT / PREVIOUS =================
function changeSong(direction) {
    const total = songs.length;
    let i = currentIndex;
    for (let step = 0; step < total; step++) {
        i = (i + direction + total) % total;
        if (songs[i].dataset.audio) {
            playSong(i);
            return;
        }
    }
}
nextBtn.addEventListener('click', function () { changeSong(1); });
prevBtn.addEventListener('click', function () { changeSong(-1); });
audio.addEventListener('ended', function () { changeSong(1); });

// ================= ▶ / ⏸ ICON (SVG, sob device e same) =================
const ICON_PLAY  = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

function updateButtons() {
    songs.forEach(function (song, index) {
        const btn = song.querySelector('.play');
        btn.innerHTML = (index === currentIndex && !audio.paused) ? ICON_PAUSE : ICON_PLAY;
    });
}
audio.addEventListener('play', updateButtons);
audio.addEventListener('pause', updateButtons);
updateButtons(); // page load e sob ▶ ke SVG kore dibe

// ================= PICTURE IN PICTURE (Spotify style mini player) =================
const pipBtn  = document.getElementById('pipBtn');
const toastEl = document.getElementById('toast');

function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(function () { toastEl.classList.remove('show'); }, 2500);
}

const PIP_CSS = `
    *{ box-sizing:border-box; margin:0; padding:0; }
    body{ background:#121212; color:#fff; font-family:Arial,sans-serif; overflow:hidden; }
    .pw{ display:flex; flex-direction:column; height:100vh; padding:14px; gap:10px; }
    .cover{ flex:1; min-height:0; display:flex; align-items:center; justify-content:center; }
    .cover img{ max-width:100%; max-height:100%; aspect-ratio:1/1; object-fit:cover; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,.6); }
    .pt{ font-size:17px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pa{ font-size:13px; color:#b3b3b3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:-4px; }
    .bar{ display:flex; align-items:center; gap:8px; font-size:11px; color:#b3b3b3; }
    .bar input{ flex:1; accent-color:#1ed760; height:4px; cursor:pointer; }
    .ctrl{ display:flex; align-items:center; justify-content:center; gap:22px; }
    .ctrl button{ background:none; border:none; color:#fff; font-size:22px; cursor:pointer; transition:.15s; display:flex; align-items:center; justify-content:center; }
    .ctrl button:hover{ color:#1ed760; transform:scale(1.15); }
    .ctrl .pp{ width:46px; height:46px; border-radius:50%; background:#1ed760; color:#000; font-size:20px; }
    .ctrl .pp:hover{ color:#000; background:#3be477; }
`;

let pipWin = null;

function pipEl(id) { return pipWin.document.getElementById(id); }

function updatePip() {
    if (!pipWin) return;
    pipEl('pi-img').src = pImg.src;
    pipEl('pi-title').textContent  = pTitle.textContent;
    pipEl('pi-artist').textContent = pArtist.textContent;
    pipEl('pi-play').innerHTML     = audio.paused ? ICON_PLAY : ICON_PAUSE;
}

function updatePipTime() {
    if (!pipWin) return;
    const seek = pipEl('pi-seek');
    const dur = isFinite(audio.duration) ? audio.duration : 0;
    seek.max = dur;
    seek.value = audio.currentTime;
    pipEl('pi-cur').textContent = fmt(audio.currentTime);
    pipEl('pi-dur').textContent = fmt(dur);
}

async function openPip() {
    if (!('documentPictureInPicture' in window)) {
        showToast('Mini player works in Chrome or Edge (desktop)');
        return;
    }
    if (pipWin) { pipWin.close(); return; }

    try {
        pipWin = await documentPictureInPicture.requestWindow({ width: 320, height: 440 });
    } catch (err) {
        console.error('PiP error:', err);
        showToast('Could not start the mini player');
        return;
    }

    const d = pipWin.document;
    d.title = 'Maity Music';
    const style = d.createElement('style');
    style.textContent = PIP_CSS;
    d.head.appendChild(style);

    d.body.innerHTML =
        '<div class="pw">' +
            '<div class="cover"><img id="pi-img" alt=""></div>' +
            '<div class="pt" id="pi-title"></div>' +
            '<div class="pa" id="pi-artist"></div>' +
            '<div class="bar"><span id="pi-cur">0:00</span>' +
                '<input type="range" id="pi-seek" min="0" max="0" step="0.1" value="0">' +
                '<span id="pi-dur">0:00</span></div>' +
            '<div class="ctrl">' +
                '<button id="pi-prev" title="Previous"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg></button>' +
                '<button id="pi-play" class="pp" title="Play / Pause">' + ICON_PLAY + '</button>' +
                '<button id="pi-next" title="Next"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 5h2v14h-2zM4 5l11 7-11 7z"/></svg></button>' +
            '</div>' +
        '</div>';

    pipEl('pi-prev').addEventListener('click', function () { changeSong(-1); });
    pipEl('pi-next').addEventListener('click', function () { changeSong(1); });
    pipEl('pi-play').addEventListener('click', function () {
        audio.paused ? audio.play() : audio.pause();
    });
    pipEl('pi-seek').addEventListener('input', function (e) {
        audio.currentTime = e.target.value;
    });

    pipWin.addEventListener('pagehide', function () { pipWin = null; });

    updatePip();
    updatePipTime();
}

pipBtn.addEventListener('click', openPip);

audio.addEventListener('play', updatePip);
audio.addEventListener('pause', updatePip);
audio.addEventListener('timeupdate', updatePipTime);
audio.addEventListener('loadedmetadata', updatePipTime);

// ================= 5 DOT VISUALIZER =================
(() => {
  const dots = Array.from(document.querySelectorAll(".bit .dot"));
  if (!audio || !dots.length) return;

  const N = dots.length;
  const bit = dots[0].parentElement;

  const pos = new Array(N).fill(0);
  const vel = new Array(N).fill(0);
  const smooth = new Array(N).fill(0);

  // MOBILE FIX: touch device e AudioContext use korbo na.
  // AudioContext screen lock e suspend hoy, tai gan bondho hoye jay.
  // Mobile e gan sorasori <audio> diye cholbe, dot animation e fakeLevel kaj korbe.
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  const canAnalyse = !isTouch &&
                     location.protocol !== "file:" &&
                     (window.AudioContext || window.webkitAudioContext);

  let ctx, analyser, data;

  function setupAnalyser() {
    if (ctx || !canAnalyse) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.55;
    data = new Uint8Array(analyser.frequencyBinCount);
    const src = ctx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(ctx.destination);
  }

  audio.addEventListener("play", () => {
    setupAnalyser();
    if (ctx && ctx.state === "suspended") ctx.resume();
  });

  const edges = [];
  for (let i = 0; i <= N; i++) edges.push(40 * Math.pow(9000 / 40, i / N));

  function bandLevel(i) {
    const nyq = ctx.sampleRate / 2;
    const a = Math.max(1, Math.floor((edges[i] / nyq) * data.length));
    const b = Math.max(a + 1, Math.ceil((edges[i + 1] / nyq) * data.length));
    let sum = 0;
    for (let k = a; k < b; k++) sum += data[k];
    return sum / (b - a) / 255;
  }

  function fakeLevel(i, t) {
    const phase = t * 2.0;
    const f = phase - Math.floor(phase);
    const kick = Math.exp(-5 * f);
    const hat = Math.exp(-7 * (((phase * 2 + 0.5) % 1)));
    const wob = 0.5 + 0.5 * Math.sin(t * (3 + i * 1.7) + i * 2);
    if (i === 0) return kick;
    if (i === 1) return kick * 0.8 + 0.15 * wob;
    if (i === N - 1) return hat * 0.8 + 0.1 * wob;
    return 0.25 + 0.5 * wob * (0.5 + 0.5 * kick);
  }

  let last = performance.now(), t = 0;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    const playing = !audio.paused && !audio.ended;
    const live = playing && ctx && analyser;
    if (live) analyser.getByteFrequencyData(data);

    const base = dots[0].offsetWidth;
    const rise = Math.max(10, bit.clientHeight - base);

    for (let i = 0; i < N; i++) {
      let lv = 0;

      if (live) {
        lv = bandLevel(i);
        lv = Math.max(0, (lv - 0.28) / 0.72);
        lv = Math.pow(lv, 1.35);
        if (i < 2) lv = Math.min(1, lv * 1.25);
      } else if (playing) {
        lv = fakeLevel(i, t);
      }

      smooth[i] += (lv - smooth[i]) * (lv > smooth[i] ? 0.6 : 0.12);

      const idle = playing ? 0 : (Math.sin(t * 1.4 + i * 0.7) * 0.5 + 0.5) * 0.06;
      const target = (smooth[i] + idle) * rise;

      const force = (target - pos[i]) * 140 - vel[i] * 13;
      vel[i] += force * dt;
      pos[i] += vel[i] * dt;
      if (pos[i] < 0) { pos[i] = 0; vel[i] = 0; }

      dots[i].style.height = (base + pos[i]) + "px";
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

document.addEventListener('DOMContentLoaded', function () {
    let name = 'User';
    try { name = localStorage.getItem('maityCurrentUser') || 'User'; } catch (e) {}

    document.getElementById('name').textContent = name + ' 👋';
    document.querySelector('.pm-name').textContent = name;

    // Logout korle nam muche felo
    document.querySelector('.pm-logout').addEventListener('click', function () {
        localStorage.removeItem('maityCurrentUser');
    });
});


// =====================================================================
//  THEME TOGGLE (Dark / Light)  -- sudhu EKBAR thakbe
//  Default = dark. Page load-er flash atkate HTML <head>-e chhoto script ache.
// =====================================================================
(function () {
    if (window.__mmThemeInit) return;          // double-run guard
    window.__mmThemeInit = true;

    var toggle = document.getElementById('themeToggle');
    var row    = document.getElementById('themeRow');
    var text   = document.getElementById('themeText');
    var root   = document.documentElement;
    if (!toggle) return;

    function apply(isDark) {
        root.classList.toggle('light', !isDark);
        toggle.checked = isDark;
        if (text) text.textContent = isDark ? 'Dark Mode' : 'Light Mode';
        try { localStorage.setItem('mm-theme', isDark ? 'dark' : 'light'); } catch (e) {}
    }

    apply(!root.classList.contains('light'));

    toggle.addEventListener('change', function () { apply(toggle.checked); });

    // theme row-te click korle profile menu jeno bondho na hoy
    if (row) row.addEventListener('click', function (e) { e.stopPropagation(); });
})();


// =====================================================================
//  CUSTOM PLAYER UI (play/pause, seek bar, volume)  -- sudhu EKBAR thakbe
//  Asol gan chalano uporer code-ei hoy; eta sudhu UI-ke sync kore.
// =====================================================================
(function () {
    if (window.__mmPlayerUI) return;           // double-run guard
    window.__mmPlayerUI = true;

    var a    = document.getElementById('main-audio');
    var play = document.getElementById('plPlay');
    var seek = document.getElementById('seekBar');
    var cur  = document.getElementById('curTime');
    var dur  = document.getElementById('durTime');
    var vol  = document.getElementById('volBar');
    var vBtn = document.getElementById('volBtn');
    if (!a || !play || !seek) return;

    var seeking = false;

    function fmtT(s) {
        if (!isFinite(s) || s < 0) return '0:00';
        s = Math.floor(s);
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }
    function paint(el) {
        var p = (el.value - el.min) / (el.max - el.min) * 100;
        el.style.setProperty('--pct', p + '%');
    }
    function setIcon() {
        play.classList.toggle('playing', !a.paused && !a.ended);
    }

    // ---- play / pause ----
    play.addEventListener('click', function () {
        if (a.paused) { a.play().catch(function () {}); } else { a.pause(); }
    });
    a.addEventListener('play', setIcon);
    a.addEventListener('playing', setIcon);
    a.addEventListener('pause', setIcon);
    a.addEventListener('ended', setIcon);

    // ---- duration / current time ----
    function setDur() { dur.textContent = fmtT(a.duration); }
    a.addEventListener('loadedmetadata', setDur);
    a.addEventListener('durationchange', setDur);
    a.addEventListener('emptied', function () {
        seek.value = 0; paint(seek); cur.textContent = '0:00'; dur.textContent = '0:00';
    });

    a.addEventListener('timeupdate', function () {
        if (seeking || !a.duration) return;
        seek.value = (a.currentTime / a.duration) * 100;
        paint(seek);
        cur.textContent = fmtT(a.currentTime);
    });

    // ---- seek bar ----
    seek.addEventListener('input', function () {
        seeking = true;
        paint(seek);
        if (a.duration) cur.textContent = fmtT(seek.value / 100 * a.duration);
    });
    seek.addEventListener('change', function () {
        if (a.duration) a.currentTime = seek.value / 100 * a.duration;
        seeking = false;
    });

    // ---- volume ----
    if (vol && vBtn) {
        var volWrap = document.querySelector('.volume');
        var pop     = document.querySelector('.vol-pop');

        // mobile-e CSS .vol-pop ke "absolute" popup banay -> tokhon tap = slider khola (mute noy)
        var isMobile = function () {
            return !!pop && getComputedStyle(pop).position === 'absolute';
        };

        vol.addEventListener('input', function () {
            a.volume = parseFloat(vol.value);
            a.muted = a.volume === 0;
            paint(vol);
        });

        // mobile: icon-e tap = slider khule/bondho | desktop: mute/unmute
        vBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (isMobile()) { volWrap.classList.toggle('open'); }
            else { a.muted = !a.muted; }
        });

        // slider-er baire tap korle bondho
        document.addEventListener('click', function (e) {
            if (volWrap && !volWrap.contains(e.target)) volWrap.classList.remove('open');
        });

        a.addEventListener('volumechange', function () {
            var off = a.muted || a.volume === 0;
            vBtn.innerHTML = '<i class="bi ' + (off ? 'bi-volume-mute-fill' : 'bi-volume-up-fill') + '"></i>';
            if (!a.muted) { vol.value = a.volume; paint(vol); }
        });
        paint(vol);
    }

    paint(seek);
    setDur();
    setIcon();
})();


// =====================================================================
//  DYNAMIC SEARCH  -- keep this block at the very END of the file.
//  It reads the song list (.ps) on every search, so any new song added
//  to the HTML shows up automatically. Only songs that have a
//  data-audio file are searchable and playable.
// =====================================================================
(function () {
    var wrap   = document.getElementById('searchWrap');
    var input  = document.getElementById('site-search');
    var drop   = document.getElementById('searchDrop');
    var form   = document.getElementById('searchForm');
    var openB  = document.querySelector('.src-lite');
    var closeB = document.getElementById('srClose');
    if (!wrap || !input || !drop) return;

    //<pure>
    function norm(s) { return (s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }

    // "Arijit Singh, Chirantan Bhatt" -> separate artist names
    function splitArtists(s) {
        return (s || '').split(/,|&|\(|\)|\bfeaturing\b|\bfeat\.?\s|\sx\s/i)
            .map(function (a) { return a.trim(); })
            .filter(Boolean);
    }

    function runSearch(q, list) {
        q = norm(q);
        if (!q) return null;

        var groups = [], byKey = {};
        // artist groups start from 2 letters, so a single letter just lists matching song names
        if (q.length >= 2) list.forEach(function (s) {
            s.artists.forEach(function (a) {
                var key = norm(a);
                if (key.indexOf(q) === -1) return;
                var g = byKey[key];
                if (!g) { g = byKey[key] = { artist: a, items: [] }; groups.push(g); }
                if (g.items.indexOf(s) === -1) g.items.push(s);
            });
        });
        groups = groups.slice(0, 4);

        var used = {};
        groups.forEach(function (g) { g.items.forEach(function (s) { used[s.index] = true; }); });

        var byTitle = list.filter(function (s) {
            return !used[s.index] && norm(s.title).indexOf(q) !== -1;
        });
        return { songs: byTitle, groups: groups };
    }
    //</pure>

    function collect() {
        var out = [];
        songs.forEach(function (el, i) {
            if (!el.dataset.audio) return;                 // no audio file = not searchable
            var t  = el.querySelector('.des1');
            var a  = el.querySelector('.des2');
            var im = el.querySelector('.image-in');
            var artist = a ? a.textContent.trim() : '';
            out.push({
                index: i,
                title: t ? t.textContent.trim() : '',
                artist: artist,
                artists: splitArtists(artist),
                img: im ? im.src : ''
            });
        });
        return out;
    }

    function isPlaying(i) { return i === currentIndex && !audio.paused; }

    function toggleSong(i) {
        if (i === currentIndex) { audio.paused ? audio.play() : audio.pause(); }
        else { playSong(i); }
    }

    function makeRow(s) {
        var r = document.createElement('div');
        r.className = 'sd-row';
        var im = document.createElement('img');
        im.src = s.img; im.alt = '';
        var tx = document.createElement('div');
        tx.className = 'sd-text';
        var t = document.createElement('div');
        t.className = 'sd-title'; t.textContent = s.title;
        var a = document.createElement('div');
        a.className = 'sd-artist'; a.textContent = s.artist;
        tx.appendChild(t); tx.appendChild(a);
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'sd-play';
        b.setAttribute('aria-label', 'Play ' + s.title);
        b.dataset.index = s.index;
        b.innerHTML = isPlaying(s.index) ? ICON_PAUSE : ICON_PLAY;
        r.appendChild(im); r.appendChild(tx); r.appendChild(b);
        r.addEventListener('click', function () { toggleSong(s.index); });
        return r;
    }

    function makeHead(text) {
        var h = document.createElement('div');
        h.className = 'sd-head'; h.textContent = text;
        return h;
    }

    function hideDrop() { drop.classList.remove('show'); }

    function render() {
        var res = runSearch(input.value, collect());
        drop.textContent = '';
        if (!res) { hideDrop(); return; }

        if (!res.songs.length && !res.groups.length) {
            var n = document.createElement('div');
            n.className = 'sd-empty';
            n.textContent = 'No songs found for "' + input.value.trim() + '"';
            drop.appendChild(n);
        }
        if (res.songs.length) {
            drop.appendChild(makeHead('Songs'));
            res.songs.forEach(function (s) { drop.appendChild(makeRow(s)); });
        }
        res.groups.forEach(function (g) {
            drop.appendChild(makeHead('Search songs for ' + g.artist));
            g.items.forEach(function (s) { drop.appendChild(makeRow(s)); });
        });
        drop.classList.add('show');
    }

    function refreshIcons() {
        drop.querySelectorAll('.sd-play').forEach(function (b) {
            b.innerHTML = isPlaying(parseInt(b.dataset.index, 10)) ? ICON_PAUSE : ICON_PLAY;
        });
    }
    audio.addEventListener('play', refreshIcons);
    audio.addEventListener('pause', refreshIcons);

    input.addEventListener('input', render);
    input.addEventListener('focus', render);

    // Enter plays the first result
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        render();
        var first = drop.querySelector('.sd-row');
        if (first) first.click();
    });

    // click outside closes the dropdown
    document.addEventListener('click', function (e) {
        if (!wrap.contains(e.target) && !(openB && openB.contains(e.target))) hideDrop();
    });

    // phone / tablet: tap the search icon to open the search bar
    function closeBar() {
        wrap.classList.remove('open');
        hideDrop();
        input.blur();
    }
    if (openB) openB.addEventListener('click', function () {
        wrap.classList.add('open');
        input.focus();
        render();
    });
    if (closeB) closeB.addEventListener('click', closeBar);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeBar();
    });
})();