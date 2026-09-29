// Builds the four screen interfaces from content.js.
// main.js decides where they sit (pinned over the 3D screen, or full-window on phones).
import { profile, skills, experience, projects, research, contact, training } from './content.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICONS = {
  github: '<path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.7 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/>',
  linkedin: '<path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.6c0-1.34-.03-3.06-1.86-3.06-1.87 0-2.15 1.46-2.15 2.96V21H9V9Z"/>',
  x: '<path fill="currentColor" d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.9-6.4L6.3 22H3.2l7.3-8.3L1 2h6.3l4.4 5.9L18.9 2Zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20Z"/>',
  mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

function codeBars(seed) {
  const cols = ['var(--pink)', 'var(--cyan)', 'var(--lime)', 'var(--amber)', 'var(--violet)', '#6d7390'];
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const row = (indent) => `<div class="bars-row" style="padding-left:${indent}em">${[0, 1, 2].map(() =>
    `<i style="width:${(2 + rnd() * 7).toFixed(1)}em;background:${cols[(rnd() * cols.length) | 0]}"></i>`).join('')}</div>`;
  return `<div class="bars" aria-hidden="true">${row(0)}${row(1.2)}</div>`;
}

/** Can / bottle / carton as inline SVG, tinted per project. */
export function itemSVG(p) {
  const c = p.color;
  let body;
  if (p.kind === 'bottle') {
    body = `<rect x="34" y="8" width="12" height="8" rx="2" fill="#222"/><rect x="35" y="14" width="10" height="20" rx="3" fill="${c}"/>
      <rect x="25" y="30" width="30" height="62" rx="10" fill="${c}"/><rect x="25" y="52" width="30" height="20" fill="#fff" opacity=".92"/>`;
  } else if (p.kind === 'carton') {
    body = `<path d="M24 34 40 14 56 34Z" fill="${c}"/><rect x="24" y="34" width="32" height="58" fill="${c}"/>
      <rect x="24" y="52" width="32" height="20" fill="#fff" opacity=".92"/>`;
  } else {
    body = `<rect x="25" y="14" width="30" height="6" rx="3" fill="#d7dbe4"/><rect x="24" y="18" width="32" height="74" rx="6" fill="${c}"/>
      <rect x="24" y="50" width="32" height="20" fill="#fff" opacity=".92"/>`;
  }
  return `<svg viewBox="0 0 80 100" class="item" aria-hidden="true">
    <ellipse cx="40" cy="94" rx="20" ry="4" fill="rgba(0,0,0,.2)"/>${body}
    <rect x="29" y="24" width="4" height="60" rx="2" fill="#fff" opacity=".35"/></svg>`;
}

// ---------------------------------------------------------------------------

function aboutPanel() {
  return `
  <section class="panel p-about" data-screen="about" aria-label="About me">
    <button class="back" data-back type="button">← Back</button>
    <nav class="tabs" role="tablist" aria-label="About">
      <button role="tab" data-tab="about" aria-selected="true">About</button>
      <button role="tab" data-tab="skills" aria-selected="false">Skills</button>
      <button role="tab" data-tab="experience" aria-selected="false">Experience</button>
    </nav>
    <div class="scroll">
      <div class="tab" data-pane="about">
        ${codeBars(3)}
        <h1>${esc(profile.intro)}</h1>
        ${codeBars(11)}
        ${profile.bio.map((p) => `<p>${esc(p)}</p>`).join('')}
        ${codeBars(7)}
        <ul class="socials">${profile.socials.map((s) =>
          `<li><a href="${esc(s.href)}" target="_blank" rel="noopener" aria-label="${esc(s.label)}">${icon(s.icon)}</a></li>`).join('')}
          <li><a class="resume" href="${esc(profile.resume)}" target="_blank" rel="noopener">Resume ↓</a></li></ul>
      </div>
      <div class="tab" data-pane="skills" hidden>
        ${codeBars(5)}
        <h1>Skills</h1>
        <div class="skills">${skills.map((g) => `
          <div class="skill" style="--c:${g.color}">
            <h2><i></i>${esc(g.group)}</h2>
            <ul>${g.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>
          </div>`).join('')}
        </div>
      </div>
      <div class="tab" data-pane="experience" hidden>
        ${codeBars(8)}
        <h1>Experience</h1>
        <ol class="timeline">${experience.map((e) => `
          <li><span class="when">${esc(e.when)}</span>
            <div><h2>${esc(e.title)}${e.where ? ` <em>· ${esc(e.where)}</em>` : ''}</h2>${e.text ? `<p>${esc(e.text)}</p>` : ''}</div></li>`).join('')}
        </ol>
      </div>
    </div>
  </section>`;
}

function projectsPanel() {
  return `
  <section class="panel p-vend" data-screen="projects" aria-label="Projects">
    <div class="vend-grid" data-view="grid">
      ${projects.map((p, i) => `
        <button type="button" class="slot" data-project="${i}" style="--c:${p.color}">
          ${itemSVG(p)}
          <span class="slot-name">${esc(p.name)}</span>
          <span class="slot-code">${esc(p.code)}</span>
        </button>`).join('')}
      <button type="button" class="vend-back" data-back><span>Go back</span><b>‹</b></button>
      <div class="vend-msg"><span>Pick a project to get started…</span></div>
    </div>
    <div class="vend-detail" data-view="detail" hidden></div>
  </section>`;
}

function projectDetail(p) {
  return `
    <div class="detail-art" style="--c:${p.color}">${itemSVG(p)}<span class="slot-code">${esc(p.code)}</span></div>
    <div class="detail-body">
      <h1>${esc(p.name)}</h1>
      <p class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</p>
      <p>${esc(p.text)}</p>
      <div class="detail-actions">
        <a class="btn" href="${esc(p.link)}" target="_blank" rel="noopener">View project ↗</a>
        <button type="button" class="btn ghost" data-grid>‹ All projects</button>
      </div>
    </div>`;
}

function researchPanel() {
  return `
  <section class="panel p-tv" data-screen="research" aria-label="Research">
    <div class="scroll">
      <p class="tv-prompt">$ ls ~/writeups</p>
      <h1>RESEARCH</h1>
      ${research.map((g) => `
      <h2 class="tv-group">## ${esc(g.group)}</h2>
      <ol class="tv-list">${g.items.map((r) => `
        <li>${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">` : '<div class="tv-row">'}
          <span class="tv-date">${esc(r.date)}</span>
          <span class="tv-title">${esc(r.title)}</span>
          <span class="tv-text">${esc(r.text)}</span>${r.link ? '</a>' : '</div>'}</li>`).join('')}
      </ol>`).join('')}
      <button class="tv-back" data-back type="button">[esc] cd ..</button>
    </div>
  </section>`;
}

function trainingPanel() {
  return `
  <section class="panel p-board" data-screen="training" aria-label="Training">
    <button class="back" data-back type="button">← Back</button>
    <div class="scroll">
      <h1>Training</h1>
      <p class="board-sub">Sessions I run and teach</p>
      <ol class="board-list">${training.map((t, i) => `
        <li style="--ink:${['#2b2bd6', '#0f7a5c', '#b3261e', '#e0268f'][i % 4]}">
          <h2>${t.link ? `<a href="${esc(t.link)}" target="_blank" rel="noopener">${esc(t.title)}</a>` : esc(t.title)}</h2>
          <p class="board-meta">${[t.where, t.when].filter(Boolean).map(esc).join(' · ')}</p>
          <p>${esc(t.text)}</p>
        </li>`).join('')}
      </ol>
    </div>
  </section>`;
}

function contactPanel() {
  return `
  <section class="panel p-arcade" data-screen="contact" aria-label="Contact">
    <div class="arcade-hud"><span>1UP<b>0000</b></span><span>HI-SCORE<b>1337</b></span><span>CREDIT<b>01</b></span></div>
    <h1>CONTACT</h1>
    <p class="arcade-sub">SELECT A CHANNEL</p>
    <ul class="arcade-menu">${contact.map((c) => `
      <li>${c.href ? `<a href="${esc(c.href)}" target="_blank" rel="noopener">` : '<span tabindex="0">'}
        <em>${esc(c.label)}</em><span>${esc(c.value)}</span>${c.href ? '</a>' : '</span>'}</li>`).join('')}
      <li><button type="button" data-back><em>EXIT</em><span>back to the street</span></button></li>
    </ul>
    <p class="arcade-foot">© ${new Date().getFullYear()} ${esc(profile.name.toUpperCase())}</p>
  </section>`;
}

// ---------------------------------------------------------------------------

export function mountUI(root, { onBack }) {
  root.innerHTML = aboutPanel() + projectsPanel() + researchPanel() + trainingPanel() + contactPanel();
  const panels = [...root.querySelectorAll('.panel')];

  root.addEventListener('click', (e) => {
    const back = e.target.closest('[data-back]');
    if (back) { onBack(); return; }

    const tab = e.target.closest('[data-tab]');
    if (tab) {
      const panel = tab.closest('.panel');
      panel.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === tab)));
      panel.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== tab.dataset.tab; });
      panel.querySelector('.scroll').scrollTop = 0;
      return;
    }

    const slot = e.target.closest('[data-project]');
    if (slot) {
      const panel = slot.closest('.panel');
      slot.classList.add('dispense');
      setTimeout(() => {
        slot.classList.remove('dispense');
        const d = panel.querySelector('[data-view="detail"]');
        d.innerHTML = projectDetail(projects[+slot.dataset.project]);
        panel.querySelector('[data-view="grid"]').hidden = true;
        d.hidden = false;
        d.querySelector('[data-grid]').focus({ preventScroll: true });
      }, 380);
      return;
    }

    if (e.target.closest('[data-grid]')) {
      const panel = e.target.closest('.panel');
      panel.querySelector('[data-view="detail"]').hidden = true;
      panel.querySelector('[data-view="grid"]').hidden = false;
    }
  });

  // Hovering a vending slot updates the message box.
  const msg = root.querySelector('.vend-msg span');
  root.querySelectorAll('.slot').forEach((s) => {
    const p = projects[+s.dataset.project];
    const show = () => { msg.textContent = `${p.code} · ${p.name}`; };
    s.addEventListener('pointerenter', show);
    s.addEventListener('focus', show);
  });

  return {
    show(id) {
      panels.forEach((p) => p.classList.toggle('active', p.dataset.screen === id));
      const panel = panels.find((p) => p.dataset.screen === id);
      if (!panel) return;
      // Reset to the first view each time a screen is opened.
      const grid = panel.querySelector('[data-view="grid"]');
      if (grid) { grid.hidden = false; panel.querySelector('[data-view="detail"]').hidden = true; msg.textContent = 'Pick a project to get started…'; }
      const firstTab = panel.querySelector('[data-tab]');
      if (firstTab) firstTab.click();
      const sc = panel.querySelector('.scroll'); if (sc) sc.scrollTop = 0;
    },
    focus(id) {
      const panel = panels.find((p) => p.dataset.screen === id);
      const target = panel && panel.querySelector('button, a');
      if (target) target.focus({ preventScroll: true });
    },
  };
}
