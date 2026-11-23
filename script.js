(() => {
  // Entrances: each part of a section rises once as it enters, staggered within its section.
  const parts = [...document.querySelectorAll('.reveal')];
  const groups = new Map();
  parts.forEach((el) => {
    const sec = el.closest('section, footer') || document.body;
    const n = groups.get(sec) || 0;
    el.style.setProperty('--d', `${Math.min(n, 6) * 80}ms`);
    groups.set(sec, n + 1);
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    parts.forEach((el) => io.observe(el));
  } else {
    parts.forEach((el) => el.classList.add('in'));
  }

  // The board: five projects, five opening moves (the Italian Game).
  const board = document.getElementById('board');
  const note = document.getElementById('board-note');
  const tabs = [...document.querySelectorAll('.tabs [role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const nextBtn = document.getElementById('next-move');
  const BASE = '<rect x="10" y="30" width="20" height="4.5"/>';
  const PIECE = {
    p: '<circle cx="20" cy="12" r="5.5"/><path d="M14 30c0-7 3-9 3.5-13h5c.5 4 3.5 6 3.5 13z"/>' + BASE,
    r: '<path d="M11 7h4v3h3V7h4v3h3V7h4v8l-3 3v9l3 3H11l3-3v-9l-3-3z"/>' + BASE,
    n: '<path d="M13 30c0-8 5-10 4-15l-5 3-2-3 7-8 2-3 2 3c6 2 9 8 9 23z"/>' + BASE,
    b: '<circle cx="20" cy="5.5" r="2.4"/><path d="M20 8c5 4 7 8 7 11s-2 5-3 6l2 5H14l2-5c-1-1-3-3-3-6s2-7 7-11z"/>' + BASE,
    q: '<path d="M8 11l5 10 3-13 4 13 4-13 3 13 5-10-3 19H11z"/><circle cx="8" cy="10" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="24" cy="7" r="2"/><circle cx="32" cy="10" r="2"/>' + BASE,
    k: '<path d="M18.5 2h3v3h3v3h-3v5h-3V8h-3V5h3z"/><path d="M20 13c8 0 10 5 10 8 0 4-3 6-4 9H14c-1-3-4-5-4-9 0-3 2-8 10-8z"/>' + BASE,
  };
  const START = [
    'rnbqkbnr', 'pppppppp', '........', '........',
    '........', '........', 'PPPPPPPP', 'RNBQKBNR',
  ];
  const MOVES = [['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6'], ['f1', 'c4']];
  const idx = (sq) => (8 - Number(sq[1])) * 8 + (sq.charCodeAt(0) - 97);

  function position(count) {
    const cells = START.join('').split('');
    for (let i = 0; i < count; i++) {
      const [from, to] = MOVES[i];
      cells[idx(to)] = cells[idx(from)];
      cells[idx(from)] = '.';
    }
    return cells;
  }

  function draw(active) {
    const cells = position(active + 1);
    const [from, to] = MOVES[active].map(idx);
    board.textContent = '';
    cells.forEach((c, i) => {
      const sq = document.createElement('div');
      const dark = (Math.floor(i / 8) + i) % 2 === 1;
      sq.className = 'sq' + (dark ? ' dark' : '') + (i === from ? ' from' : '') + (i === to ? ' to' : '');
      if (c !== '.') {
        if (c === c.toUpperCase()) sq.classList.add('w');
        sq.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true">' + PIECE[c.toLowerCase()] + '</svg>';
      }
      board.appendChild(sq);
    });
  }

  function select(i, focus) {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
    });
    draw(i);
    note.textContent = `${panels[i].dataset.move}. ${tabs[i].textContent} is on the board.`;
    board.setAttribute('aria-label', `A chessboard after ${i + 1} of five opening moves: ${panels[i].dataset.move}.`);
    if (focus) tabs[i].focus();
  }

  if (board && tabs.length) {
    let current = 0;
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { current = i; select(i); });
      t.addEventListener('keydown', (e) => {
        const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        current = (i + step + tabs.length) % tabs.length;
        select(current, true);
      });
    });
    nextBtn.addEventListener('click', () => { current = (current + 1) % tabs.length; select(current); });
    select(0);
  }

  // The giant word is fitted to its column, edge to edge.
  const word = document.getElementById('giant-word');
  if (word) {
    const fit = () => {
      const h = word.parentElement;
      h.style.fontSize = '';
      const size = parseFloat(getComputedStyle(h).fontSize);
      const ratio = h.clientWidth / word.getBoundingClientRect().width;
      if (ratio > 0 && isFinite(ratio)) h.style.fontSize = (size * ratio * 0.995) + 'px';
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    window.addEventListener('resize', fit);
  }

  document.querySelectorAll('#shelf li').forEach((li, i) => li.style.setProperty('--i', i));

  // The shelf: a spine can be picked by touch or keyboard as well as by pointing.
  const shelf = document.getElementById('shelf');
  if (shelf) {
    shelf.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      const was = li.classList.contains('on');
      shelf.querySelectorAll('.on').forEach((n) => n.classList.remove('on'));
      shelf.classList.toggle('pick', !was);
      if (!was) li.classList.add('on');
    });
  }
})();
