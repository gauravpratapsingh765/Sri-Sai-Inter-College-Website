/**
 * ============================================================
 *  SSIC DATABASE MODULE — Powered by Supabase (Free PostgreSQL)
 *  Sri Sai Inter College
 * ============================================================
 *
 *  SETUP — One time, 5 minutes:
 *  1. Go to https://supabase.com → Sign up free → New project
 *  2. Go to SQL Editor → paste & run the SQL below
 *  3. Go to Settings → API → copy URL + anon key
 *  4. Open admin.html → Database Setup → enter credentials → Save
 *  5. Done! All pages now save to real PostgreSQL.
 * ============================================================
 */

// Credentials are stored in localStorage and patched in at runtime
// via admin.html. Default values here are placeholders.
var SUPABASE_URL = localStorage.getItem('ssic_db_url') || 'YOUR_SUPABASE_URL_HERE';
var SUPABASE_KEY = localStorage.getItem('ssic_db_key') || 'YOUR_SUPABASE_ANON_KEY_HERE';

/**
 * ============================================================
 *  RUN THIS SQL IN SUPABASE SQL EDITOR:
 * ============================================================
 *
 * create table if not exists alumni (
 *   id bigint generated always as identity primary key,
 *   name text not null, role text not null, org text,
 *   batch text, location text, category text default 'other',
 *   branch text, quote text, photo text,
 *   created_at timestamptz default now()
 * );
 *
 * create table if not exists toppers (
 *   id bigint generated always as identity primary key,
 *   name text not null, score text not null, class text,
 *   year text, father text, subject text, quote text, photo text,
 *   created_at timestamptz default now()
 * );
 *
 * create table if not exists selections (
 *   id bigint generated always as identity primary key,
 *   name text not null, exam text not null, score text not null,
 *   batch text, inst text, father text, sub text, quote text, photo text,
 *   created_at timestamptz default now()
 * );
 *
 * create table if not exists team (
 *   id bigint generated always as identity primary key,
 *   name text not null, role text not null, dept text, qual text,
 *   exp text, bio text, type text not null, photo text,
 *   sort_order integer default 0,
 *   created_at timestamptz default now()
 * );
 *
 * create table if not exists notices (
 *   id bigint generated always as identity primary key,
 *   title text not null,
 *   body text,
 *   day text,
 *   month text,
 *   type text default 'notice',   -- 'notice' or 'calendar'
 *   badge text,                   -- optional label e.g. 'New'
 *   is_active boolean default true,
 *   sort_order integer default 0,
 *   created_at timestamptz default now()
 * );
 *
 * create table if not exists ticker (
 *   id bigint generated always as identity primary key,
 *   text text not null,
 *   is_active boolean default true,
 *   sort_order integer default 0,
 *   created_at timestamptz default now()
 * );
 *
 * -- Enable RLS + public access
 * do $$ begin
 *   for t in select unnest(array['alumni','toppers','selections','team','notices','ticker']) loop
 *     execute format('alter table %I enable row level security', t);
 *     execute format('create policy "Public" on %I for all using (true) with check (true)', t);
 *   end loop;
 * end $$;
 */

// ============================================================
// CORE FETCH HELPER
// ============================================================
async function sbFetch(table, method, body, id, filters) {
  const url_base = localStorage.getItem('ssic_db_url') || SUPABASE_URL;
  const key_base = localStorage.getItem('ssic_db_key') || SUPABASE_KEY;
  if (!url_base || url_base === 'YOUR_SUPABASE_URL_HERE') throw new Error('SETUP_REQUIRED');

  let url = `${url_base}/rest/v1/${table}`;
  const params = [];
  if (id) params.push(`id=eq.${id}`);
  if (filters) params.push(filters);
  if (params.length) url += '?' + params.join('&');

  const headers = {
    'apikey': key_base,
    'Authorization': `Bearer ${key_base}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  const opts = { method: method || 'GET', headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok) { const err = await res.text(); throw new Error(`DB ${res.status}: ${err}`); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ============================================================
// TABLE CRUD FACTORIES
// ============================================================
function makeTable(name) {
  return {
    getAll: (extra) => sbFetch(name, 'GET', null, null, extra || 'order=created_at.desc'),
    getActive: () => sbFetch(name, 'GET', null, null, 'is_active=eq.true&order=sort_order.asc'),
    add: async (data) => { const r = await sbFetch(name, 'POST', data); return r[0]; },
    update: async (id, data) => { const r = await sbFetch(name, 'PATCH', data, id); return r[0]; },
    delete: (id) => sbFetch(name, 'DELETE', null, id)
  };
}

const Alumni     = makeTable('alumni');
const Toppers    = makeTable('toppers');
const Selections = makeTable('selections');
const Team       = makeTable('team');
const Notices    = makeTable('notices');
const Ticker     = makeTable('ticker');

// ============================================================
// HELPERS
// ============================================================
function isDbConfigured() {
  const u = localStorage.getItem('ssic_db_url');
  const k = localStorage.getItem('ssic_db_key');
  return u && u !== 'YOUR_SUPABASE_URL_HERE' && k && k !== 'YOUR_SUPABASE_ANON_KEY_HERE';
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ============================================================
// LOCAL FALLBACK (when DB not configured)
// ============================================================
const LocalDB = {
  get(key) { try { return JSON.parse(localStorage.getItem('ssic_' + key) || '[]'); } catch(e) { return []; } },
  set(key, v) { try { localStorage.setItem('ssic_' + key, JSON.stringify(v)); } catch(e) {} },
  async add(key, rec) {
    const d = this.get(key);
    rec.id = Date.now(); rec.created_at = new Date().toISOString();
    d.unshift(rec); this.set(key, d); return rec;
  },
  async update(key, id, upd) {
    const d = this.get(key);
    const i = d.findIndex(x => x.id == id);
    if (i > -1) { d[i] = {...d[i], ...upd}; this.set(key, d); return d[i]; }
  },
  async delete(key, id) { this.set(key, this.get(key).filter(x => x.id != id)); }
};

// ============================================================
// NOTICE LOADER — used by index.html to render notice board
// ============================================================
async function loadNoticesOnPage() {
  if (!isDbConfigured()) return; // keep static HTML when no DB

  try {
    const all = await sbFetch('notices', 'GET', null, null, 'is_active=eq.true&order=sort_order.asc,created_at.desc');
    const notices   = all.filter(n => n.type === 'notice');
    const calendar  = all.filter(n => n.type === 'calendar');

    function buildItem(n) {
      return `<li class="notice-item">
        <div class="notice-date" ${n.type==='calendar'?'style="background:var(--blue-accent)"':''}>
          <div class="day">${n.day||'—'}</div>
          <div class="mon">${n.month||'—'}</div>
        </div>
        <div class="notice-text">
          <h4>${n.title||''}${n.badge?`<span class="notice-badge">${n.badge}</span>`:''}</h4>
          <p>${n.body||''}</p>
        </div>
      </li>`;
    }

    const nl = document.getElementById('notice-list-main');
    const cl = document.getElementById('calendar-list-main');
    if (nl && notices.length)   nl.innerHTML = notices.map(buildItem).join('');
    if (cl && calendar.length) cl.innerHTML = calendar.map(buildItem).join('');

    // Ticker
    const ticks = await sbFetch('ticker', 'GET', null, null, 'is_active=eq.true&order=sort_order.asc');
    const track = document.getElementById('ticker');
    if (track && ticks.length) {
      const items = [...ticks, ...ticks].map(t => `<span>${t.text}</span>`).join('');
      track.innerHTML = items;
    }
  } catch(e) { console.warn('Notice load failed:', e.message); }
}