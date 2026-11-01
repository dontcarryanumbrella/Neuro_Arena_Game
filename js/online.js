// Neuro Arena online: usernames, parties of two and matches, through a Supabase project.
// Nothing about a fight goes over the network while it plays: both players' fighters (brain, abilities,
// talents, special, skin) are shared once, and each screen runs the same battle from the same seed.
// Loaded after main.js; the database is set up by supabase/online.sql.

const ONLINE_KEY = 'neuro-arena-online';
const PARTY_MAX = 2;
const Online = { client: null, user: null, me: null, party: null, members: [], invites: [], seen: new Set(), timer: null, channel: null, busy: false };

// the project this browser connected to, or else the one built into this copy of the game (js/online-config.js)
const onlineCfg = () => { let c = {}; try { c = JSON.parse(localStorage.getItem(ONLINE_KEY)) || {}; } catch (e) { /* none saved */ } return c.url && c.key ? c : (typeof ONLINE_DEFAULT !== 'undefined' && ONLINE_DEFAULT.url && ONLINE_DEFAULT.key ? ONLINE_DEFAULT : c); };
const saveOnlineCfg = c => { try { localStorage.setItem(ONLINE_KEY, JSON.stringify(c)); } catch (e) { /* remembered only when storage works */ } };
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const nameOf = id => (Online.members.find(m => m.user_id === id) || {}).username || '?';

// ---------- connecting ----------
async function onlineConnect(url, key) {
  try { url = new URL(url.trim()).origin; } catch (e) { onlineStatus('That project URL does not look right. It should be like https://xxxx.supabase.co'); return; } // a pasted .../rest/v1/ works too
  if (!window.supabase) { onlineStatus('The online library did not load. Check your internet connection and reload.'); return; }
  Online.client = window.supabase.createClient(url, key);
  let { data: { session } } = await Online.client.auth.getSession();
  if (!session) {
    const { data, error } = await Online.client.auth.signInAnonymously();
    if (error) { onlineStatus('Could not sign in: ' + error.message + ' (is anonymous sign-in enabled in your Supabase project?)'); Online.client = null; return; }
    session = data.session;
  }
  Online.user = session.user;
  const { data: me } = await Online.client.from('profiles').select('*').eq('id', Online.user.id).maybeSingle();
  Online.me = me || null;
  saveOnlineCfg({ url, key });
  if (Online.me) await onlineReady();
  renderOnline();
}

async function setUsername(name) {
  name = name.trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) { onlineStatus('3 to 16 letters, numbers or underscores.'); return; }
  const { data, error } = await Online.client.from('profiles').upsert({ id: Online.user.id, username: name }).select().single();
  if (error) { onlineStatus(error.code === '23505' ? 'That name is taken.' : 'Could not save the name: ' + error.message); return; }
  Online.me = data;
  await onlineReady();
  renderOnline();
}

// signed in with a name: keep the party, invites and matches current (live where the project allows it, and by polling regardless)
async function onlineReady() {
  await uploadCard();
  await refreshOnline();
  if (Online.channel) Online.client.removeChannel(Online.channel);
  Online.channel = Online.client.channel('arena-' + Online.user.id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'invites', filter: `to_user=eq.${Online.user.id}` }, refreshOnline)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'party_members' }, refreshOnline)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, p => onMatch(p.new))
    .subscribe();
  clearInterval(Online.timer);
  Online.timer = setInterval(refreshOnline, 4000);
}

async function refreshOnline() {
  if (!Online.client || !Online.me || Online.busy) return;
  Online.busy = true;
  try {
    const c = Online.client, me = Online.user.id;
    const { data: mine } = await c.from('party_members').select('party_id').eq('user_id', me).maybeSingle();
    Online.party = null; Online.members = [];
    if (mine) {
      const { data: party } = await c.from('parties').select('*').eq('id', mine.party_id).maybeSingle();
      if (party) {
        Online.party = party;
        const { data: rows } = await c.from('party_members').select('user_id, joined_at').eq('party_id', party.id).order('joined_at');
        const ids = (rows || []).map(r => r.user_id);
        const { data: profs } = ids.length ? await c.from('profiles').select('id, username').in('id', ids) : { data: [] };
        Online.members = (rows || []).map(r => ({ ...r, username: ((profs || []).find(p => p.id === r.user_id) || {}).username || '?' }));
        // a match started in the last minute that this screen has not played yet
        const { data: recent } = await c.from('matches').select('*').eq('party_id', party.id).gte('created_at', new Date(Date.now() - 60000).toISOString()).order('created_at', { ascending: false }).limit(1);
        if (recent && recent[0]) onMatch(recent[0]);
      }
    }
    const { data: inv } = await c.from('invites').select('*').eq('to_user', me).eq('status', 'pending').order('created_at', { ascending: false });
    const fromIds = (inv || []).map(i => i.from_user);
    const { data: fromProfs } = fromIds.length ? await c.from('profiles').select('id, username').in('id', fromIds) : { data: [] };
    Online.invites = (inv || []).map(i => ({ ...i, fromName: ((fromProfs || []).find(p => p.id === i.from_user) || {}).username || '?' }));
  } finally { Online.busy = false; }
  renderOnline();
}

// ---------- your fighter, as others will meet it ----------
function myCard() {
  return { name: Online.me.username, userId: Online.user.id, agent: state.agent.toJSON({ small: true, actorOnly: true }), loadout: state.loadout.slice(), // only what it takes to fight, compact
    talents: state.talents.equipped.slice(), race: state.race.equipped, identity: identityOpts(), skin: state.skins.equipped };
}
async function uploadCard() {
  const { error } = await Online.client.from('fighters').upsert({ owner: Online.user.id, card: myCard(), updated_at: new Date().toISOString() });
  if (error) onlineStatus('Could not share your fighter: ' + error.message);
}

// ---------- finding people and forming a party ----------
async function searchUsers(q) {
  q = q.trim();
  if (!q) return [];
  const { data } = await Online.client.from('profiles').select('id, username').ilike('username', q.replace(/[%_]/g, '\\$&') + '%').neq('id', Online.user.id).limit(10);
  return data || [];
}

async function ensureParty() {
  if (Online.party) return Online.party;
  const c = Online.client;
  const { data: party, error } = await c.from('parties').insert({ leader: Online.user.id }).select().single();
  if (error) throw error;
  const { error: e2 } = await c.from('party_members').insert({ user_id: Online.user.id, party_id: party.id });
  if (e2) throw e2;
  Online.party = party;
  return party;
}

async function inviteUser(id, name) {
  try {
    if (Online.members.length >= PARTY_MAX) { onlineStatus('Your party is full.'); return; }
    const party = await ensureParty();
    const { error } = await Online.client.from('invites').insert({ from_user: Online.user.id, to_user: id, party_id: party.id });
    if (error) throw error;
    onlineStatus(`Invited ${name}.`);
  } catch (e) { onlineStatus('Could not invite: ' + e.message); }
  refreshOnline();
}

async function answerInvite(inv, yes) {
  const c = Online.client;
  try {
    if (yes) {
      const { count } = await c.from('party_members').select('user_id', { count: 'exact', head: true }).eq('party_id', inv.party_id);
      if ((count || 0) >= PARTY_MAX) { onlineStatus('That party is already full.'); yes = false; }
      else {
        await leaveParty(true);
        const { error } = await c.from('party_members').insert({ user_id: Online.user.id, party_id: inv.party_id });
        if (error) throw error;
      }
    }
    await c.from('invites').update({ status: yes ? 'accepted' : 'declined' }).eq('id', inv.id);
  } catch (e) { onlineStatus('Could not answer: ' + e.message); }
  refreshOnline();
}

async function leaveParty(quiet) {
  if (!Online.party) return;
  const c = Online.client;
  if (Online.party.leader === Online.user.id) await c.from('parties').delete().eq('id', Online.party.id); // the leader leaving disbands it
  else await c.from('party_members').delete().eq('user_id', Online.user.id);
  Online.party = null; Online.members = [];
  if (!quiet) refreshOnline();
}

// ---------- matches ----------
async function startMatch(mode) {
  if (!Online.party || Online.members.length < 2) { onlineStatus('You need someone in your party first.'); return; }
  const foes = mode === 'coop' ? [...document.querySelectorAll('#onlineFoes option:checked')].map(o => o.value).slice(0, 4) : [];
  if (mode === 'coop' && !foes.length) { onlineStatus('Pick at least one foe to fight together.'); return; }
  await uploadCard();
  const { error } = await Online.client.from('matches').insert({ party_id: Online.party.id, created_by: Online.user.id, mode, seed: Math.floor(Math.random() * 2e9), foes });
  if (error) onlineStatus('Could not start the match: ' + error.message);
}

// a match for this party: share the latest fighter, wait for the other's, then both screens play it from the same seed
async function onMatch(m) {
  if (!m || !Online.party || m.party_id !== Online.party.id || Online.seen.has(m.id)) return;
  Online.seen.add(m.id);
  onlineStatus('Match starting: sharing fighters...');
  if (m.created_by !== Online.user.id) await uploadCard();
  const ids = Online.members.map(x => x.user_id).sort(); // the same order on both screens
  let cards = null;
  for (let tries = 0; tries < 20 && !cards; tries++) {
    const { data } = await Online.client.from('fighters').select('owner, card, updated_at').in('owner', ids);
    const fresh = (data || []).filter(r => new Date(r.updated_at) >= new Date(new Date(m.created_at).getTime() - 2000));
    if (fresh.length === ids.length) cards = ids.map(id => fresh.find(r => r.owner === id).card);
    else await new Promise(r => setTimeout(r, 750));
  }
  if (!cards) { onlineStatus("The other player's fighter did not arrive. Try again."); return; }
  onlineStatus(m.mode === 'duel' ? `Duel: ${cards[0].name} vs ${cards[1].name}` : `Together vs ${m.foes.map(t => ENEMY_TYPES[t] ? ENEMY_TYPES[t].name : t).join(', ')}`);
  state.view.online = { match: m, cards };
  setMode('battle', 'online');
}

// the battle itself: every fighter from its card, its brain seeded the same on both screens
function buildOnlineSim(online) {
  const { match: m, cards } = online;
  const slots = m.mode === 'duel'
    ? cards.map((card, i) => ({ kind: 'net', team: i, card }))
    : [...cards.map(card => ({ kind: 'net', team: 0, card })), ...(m.foes || []).filter(t => ENEMY_TYPES[t]).map(t => ({ kind: t, team: 1 }))];
  const sim = new Sim('battle', m.seed, { visual: true, battle: { timeLimit: 120, slots }, fighter: DEFAULT_FIGHTER });
  sim.heroes.forEach((h, i) => {
    if (!h.card || !validAgentJSON(h.card.agent)) return;
    h.brain = PPOAgent.fromJSON(h.card.agent);
    h.brain.rand = mulberry32((m.seed + i * 7919) >>> 0); // its choices, decided the same way on both screens
  });
  return sim;
}

// ---------- the panel ----------
function onlineStatus(text) { const el = $('onlineStatus'); if (el) el.textContent = text || ''; }

function renderOnline() {
  const wrap = $('onlineBody'); if (!wrap) return;
  const cfg = onlineCfg();
  if (!Online.client) {
    wrap.innerHTML = `<p class="mini">Connect to your Supabase project (see "Playing online" in the README for the one-time setup).</p>
      <label class="mini">Project URL <input id="sbUrl" type="url" placeholder="https://xxxx.supabase.co" value="${escapeHtml(cfg.url || '')}"></label>
      <label class="mini">Anon public key <input id="sbKey" type="password" placeholder="eyJ..." value="${escapeHtml(cfg.key || '')}"></label>
      <button class="primary" id="sbConnect">Connect</button>`;
    $('sbConnect').onclick = () => { const url = $('sbUrl').value.trim(), key = $('sbKey').value.trim(); if (url && key) onlineConnect(url, key).catch(e => onlineStatus(e.message)); };
    return;
  }
  if (!Online.me) {
    wrap.innerHTML = `<p class="mini">Choose a username others can find you by.</p>
      <div class="row inline"><input id="olName" maxlength="16" placeholder="username"><button class="primary" id="olSetName">Save</button></div>`;
    $('olSetName').onclick = () => setUsername($('olName').value);
    return;
  }
  const sig = JSON.stringify([Online.me.username, Online.party && Online.party.id, Online.members.map(m => m.user_id), Online.invites.map(i => i.id)]);
  if (sig === Online.lastSig && wrap.querySelector('#olSearch')) return; // nothing changed: leave the search box and choices alone
  Online.lastSig = sig;
  const leader = Online.party && Online.party.leader === Online.user.id, full = Online.members.length >= 2;
  const foeOpts = [...BOSSES, ...ROSTER].map(t => `<option value="${t}">${escapeHtml(ENEMY_TYPES[t].name)}${ENEMY_TYPES[t].boss ? ' (boss)' : ''}</option>`).join('');
  wrap.innerHTML = `
    <p class="mini">Signed in as <b>${escapeHtml(Online.me.username)}</b>. <button id="olShare" title="Send your current fighter (brain, abilities, talents, special, skin)">Share my fighter</button></p>
    <div class="ol-block"><b>Find players</b>
      <input id="olSearch" placeholder="search usernames" autocomplete="off"><div id="olResults"></div></div>
    ${Online.invites.length ? `<div class="ol-block"><b>Invites</b>${Online.invites.map(i => `<div class="ol-row"><span>${escapeHtml(i.fromName)} invites you to their party</span><button data-acc="${i.id}">Join</button><button data-dec="${i.id}">Decline</button></div>`).join('')}</div>` : ''}
    <div class="ol-block"><b>Party</b>
      ${Online.party ? Online.members.map(mb => `<div class="ol-row"><span>${escapeHtml(mb.username)}${mb.user_id === Online.party.leader ? ' (leader)' : ''}${mb.user_id === Online.user.id ? ' · you' : ''}</span></div>`).join('') + `<button id="olLeave">${leader ? 'Disband party' : 'Leave party'}</button>`
        : '<p class="mini">Not in a party. Invite someone to start one.</p>'}
    </div>
    ${Online.party && full ? `<div class="ol-block"><b>Fight</b>
      <p class="mini">Your trained fighters fight; each screen plays the same battle.</p>
      <button class="primary" id="olDuel">1v1 duel</button>
      <p class="mini" style="margin-top:8px">Or team up against (hold Ctrl to pick several, up to 4):</p>
      <select id="onlineFoes" multiple size="6">${foeOpts}</select>
      <button id="olCoop">Fight together</button></div>` : ''}`;
  $('olShare').onclick = () => uploadCard().then(() => onlineStatus('Your fighter is shared.'));
  let t = 0;
  $('olSearch').oninput = e => { clearTimeout(t); const q = e.target.value; t = setTimeout(async () => {
    const res = await searchUsers(q), box = $('olResults'); if (!box) return;
    box.innerHTML = res.map(u => `<div class="ol-row"><span>${escapeHtml(u.username)}</span><button data-inv="${u.id}" data-name="${escapeHtml(u.username)}">Invite</button></div>`).join('') || (q.trim() ? '<p class="mini">No one by that name.</p>' : '');
    box.querySelectorAll('[data-inv]').forEach(b => { b.onclick = () => inviteUser(b.dataset.inv, b.dataset.name); });
  }, 250); };
  wrap.querySelectorAll('[data-acc]').forEach(b => { b.onclick = () => answerInvite(Online.invites.find(i => i.id === b.dataset.acc), true); });
  wrap.querySelectorAll('[data-dec]').forEach(b => { b.onclick = () => answerInvite(Online.invites.find(i => i.id === b.dataset.dec), false); });
  if ($('olLeave')) $('olLeave').onclick = () => leaveParty();
  if ($('olDuel')) $('olDuel').onclick = () => startMatch('duel');
  if ($('olCoop')) $('olCoop').onclick = () => startMatch('coop');
}

// reconnect on load if this browser has connected before
(function bootOnline() {
  renderOnline();
  const cfg = onlineCfg();
  if (cfg.url && cfg.key) onlineConnect(cfg.url, cfg.key).catch(e => onlineStatus('Could not reconnect: ' + e.message));
})();
