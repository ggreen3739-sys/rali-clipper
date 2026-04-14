/* ═══════════════════════════════════════
   Rali-Clipper v0.01 — live.js
   Live side JavaScript
═══════════════════════════════════════ */

// ── STATE ──
var dnV = '';
var dpV = '';
var hasDuty = false;
var totalPax = 0;
var vehicleCapacity = 0; // 0 = no capacity set
var longPressTimer = null;
var longPressTarget = null;
var multiTicketIndex = -1;
var multiNpV = '';

// ── ROUTE / FARE STAGE DATA ──
// This mirrors what's set up in the editor.
// When a trip is selected, setTrip() populates these from editorRoutes.
var currentRoute = '45';
var currentDirection = 'Inbound';
var currentFsIndex = 0;
var currentStopIndex = 0;
var destFsIndex = 2;

// Demo route data — in future this will come live from editorRoutes
var routeData = {
  '45': {
    name: 'Route 45',
    inbound: {
      fareStages: ['Town Centre', 'Hospital', 'Bus Station'],
      stops: {
        'Town Centre': ['Town Centre NB', 'Library', 'High Street'],
        'Hospital':    ['Church Road', 'Hospital Stop'],
        'Bus Station': ['Bus Station']
      }
    },
    outbound: {
      fareStages: ['Bus Station', 'Hospital', 'Town Centre'],
      stops: {
        'Bus Station': ['Bus Station SB'],
        'Hospital':    ['Hospital SB', 'Church Rd SB'],
        'Town Centre': ['High St SB', 'Library SB', 'Town Centre SB']
      }
    }
  },
  '46': {
    name: 'Route 46',
    inbound: {
      fareStages: ['Town Centre', 'Park & Ride'],
      stops: {
        'Town Centre': ['Town Centre', 'High Street'],
        'Park & Ride': ['Park & Ride']
      }
    },
    outbound: {
      fareStages: ['Park & Ride', 'Town Centre'],
      stops: {
        'Park & Ride': ['Park & Ride SB'],
        'Town Centre': ['High St SB', 'Town Centre SB']
      }
    }
  }
};

// Gets fare stages for current trip direction
function getCurrentFareStages() {
  var r = routeData[currentRoute];
  if (!r) return ['Stage 1', 'Stage 2', 'Stage 3'];
  var dir = currentDirection.toLowerCase().includes('out') ||
            currentDirection.toLowerCase().includes('south') ||
            currentDirection.toLowerCase().includes('west') ||
            currentDirection.toLowerCase().includes('anti') ? 'outbound' : 'inbound';
  return r[dir] ? r[dir].fareStages : ['Stage 1'];
}

// Gets stops for the current fare stage
function getCurrentStops() {
  var r = routeData[currentRoute];
  if (!r) return ['Stop 1'];
  var dir = currentDirection.toLowerCase().includes('out') ||
            currentDirection.toLowerCase().includes('south') ||
            currentDirection.toLowerCase().includes('west') ||
            currentDirection.toLowerCase().includes('anti') ? 'outbound' : 'inbound';
  var fs = getCurrentFareStages()[currentFsIndex];
  return (r[dir] && r[dir].stops && r[dir].stops[fs]) ? r[dir].stops[fs] : ['Stop'];
}

// ── NAVIGATION ──
function go(id) {
  document.querySelectorAll('.screen, .drive-screen').forEach(function(s) {
    s.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

function showModal(id) { document.getElementById(id).classList.add('active'); }
function hideModal(id) { document.getElementById(id).classList.remove('active'); }

// ── PIN NEXT (resets driver number and PIN fields) ──
function pinNext() {
  if (dpV.length > 0) {
    // Reset both fields ready for next login
    dnV = '';
    dpV = '';
    var dn = document.getElementById('dn-disp');
    var dp = document.getElementById('dp-disp');
    if (dn) dn.innerHTML = '<span class="ph">Driver number</span>';
    if (dp) dp.innerHTML = '<span class="ph">PIN</span>';
    go('s-vehicle');
  }
}

// ── DRIVER NUMPAD ──
function np(field, val) {
  if (field === 'dn') {
    if (val === 'back') dnV = dnV.slice(0, -1);
    else if (dnV.length < 8) dnV += val;
    var el = document.getElementById('dn-disp');
    el.innerHTML = dnV.length > 0
      ? '<span style="letter-spacing:5px;">' + dnV + '</span>'
      : '<span class="ph">Driver number</span>';
  } else {
    if (val === 'back') dpV = dpV.slice(0, -1);
    else if (dpV.length < 6) dpV += val;
    var el = document.getElementById('dp-disp');
    el.innerHTML = dpV.length > 0
      ? '<span style="letter-spacing:5px;">' + '●'.repeat(dpV.length) + '</span>'
      : '<span class="ph">PIN</span>';
  }
}

// ── VEHICLE LIST ──
var presetV = [
  { f: '1234', r: 'ABC 123D', n: 'AEC Routemaster',   cap: 64 },
  { f: '5678', r: 'XYZ 456E', n: 'Bristol VRT',        cap: 70 },
  { f: '9012', r: 'DEF 789F', n: 'Leyland Atlantean',  cap: 68 },
  { f: '3456', r: 'GHI 012G', n: 'Daimler Fleetline',  cap: 72 },
  { f: '7890', r: 'JKL 345H', n: 'Bristol RE',          cap: 45 }
];
var adhocV = [];

function renderV(q) {
  q = q || '';
  var h = '';
  var pf = presetV.filter(function(v) {
    return !q || v.f.includes(q) || v.r.toLowerCase().includes(q) || v.n.toLowerCase().includes(q);
  });
  if (pf.length) {
    h += '<div class="slbl">Fleet vehicles</div>';
    pf.forEach(function(v) {
      h += '<div class="li" onclick="selectVehicle(' + v.cap + ')">'
        + '<div><div class="ln">' + v.f + ' – ' + v.n + '</div>'
        + '<div class="ls">' + v.r + (v.cap ? ' · Capacity: ' + v.cap : '') + '</div></div>'
        + '<div class="la">›</div></div>';
    });
  }
  var af = adhocV.filter(function(v) {
    return !q || v.r.toLowerCase().includes(q) || v.n.toLowerCase().includes(q);
  });
  if (af.length) {
    h += '<div class="slbl">Ad-hoc vehicles</div>';
    af.forEach(function(v) {
      h += '<div class="li adhoc" onclick="selectVehicle(' + (v.cap || 0) + ')">'
        + '<div><div class="ln">' + v.r + (v.f ? ' (' + v.f + ')' : '') + '</div>'
        + '<div class="ls">' + v.n + ' · Ad-hoc</div></div>'
        + '<div class="la">›</div></div>';
    });
  }
  if (!h) h = '<div style="padding:20px;text-align:center;color:#aaa;font-size:13px;">No vehicles found</div>';
  var el = document.getElementById('vlist');
  if (el) el.innerHTML = h;
}

function selectVehicle(cap) {
  vehicleCapacity = cap || 0;
  totalPax = 0;
  updatePaxDisplay();
  go('s-duty');
}

function filterV() {
  renderV(document.getElementById('vsearch').value.toLowerCase());
}

function saveAdhoc() {
  var reg = document.getElementById('ah-reg').value.trim();
  if (!reg) { document.getElementById('ah-err').style.display = 'block'; return; }
  document.getElementById('ah-err').style.display = 'none';
  var cap = parseInt(document.getElementById('ah-cap').value) || 0;
  adhocV.push({
    f: document.getElementById('ah-fleet').value.trim(),
    r: reg,
    n: document.getElementById('ah-make').value.trim() || 'Ad-hoc vehicle',
    cap: cap
  });
  document.getElementById('ah-reg').value = '';
  document.getElementById('ah-fleet').value = '';
  document.getElementById('ah-make').value = '';
  document.getElementById('ah-cap').value = '';
  hideModal('adhoc-modal');
  renderV();
  selectVehicle(cap);
}

// ── DUTY ──
function setDuty(v) {
  hasDuty = v;
  var el = document.getElementById('next-trip-item');
  var sub = document.getElementById('ntsub');
  if (el) {
    if (v) {
      el.classList.remove('grey');
      if (sub) sub.textContent = 'Ends current trip, begins next in duty';
    } else {
      el.classList.add('grey');
      if (sub) sub.textContent = 'Not available – ad-hoc duty selected';
    }
  }
}

// ── TRIP SETUP ──
function setTrip(route, from, to, dir) {
  currentRoute = route;
  currentDirection = dir;
  currentFsIndex = 0;
  currentStopIndex = 0;

  // Set dest to last fare stage by default
  var stages = getCurrentFareStages();
  destFsIndex = stages.length - 1;

  // Update fare stage / stop displays
  updateFsDisplay();
  updateStopDisplay();

  // Update trip info bar
  var mr = document.getElementById('m-route'); if (mr) mr.textContent = route;
  var tf = document.getElementById('ti-from'); if (tf) tf.textContent = from || '—';
  var tt = document.getElementById('ti-to');   if (tt) tt.textContent = to || '—';
  var td = document.getElementById('ti-dir');  if (td) td.textContent = dir;
  var dl = document.getElementById('dl-route');if (dl) dl.textContent = 'Route ' + route + ' – ' + dir;

  // Reset basket and pax
  resetBasket();
}

// ── FARE STAGE NAVIGATION ──
function updateFsDisplay() {
  var stages = getCurrentFareStages();
  var el = document.getElementById('m-from');
  if (el) el.textContent = stages[currentFsIndex] || '—';
  var del = document.getElementById('m-to');
  if (del) del.textContent = stages[destFsIndex] || '—';
}

function updateStopDisplay() {
  var stops = getCurrentStops();
  if (currentStopIndex >= stops.length) currentStopIndex = 0;
  var el = document.getElementById('m-stop');
  if (el) el.textContent = stops[currentStopIndex] || '—';
}

function stepFs(dir) {
  var stages = getCurrentFareStages();
  currentFsIndex = Math.max(0, Math.min(stages.length - 1, currentFsIndex + dir));
  // Ensure dest is never before current
  if (destFsIndex < currentFsIndex) destFsIndex = currentFsIndex;
  currentStopIndex = 0;
  updateFsDisplay();
  updateStopDisplay();
}

function stepDest(dir) {
  var stages = getCurrentFareStages();
  // Dest can't go before current fare stage
  destFsIndex = Math.max(currentFsIndex, Math.min(stages.length - 1, destFsIndex + dir));
  updateFsDisplay();
}

function stepStop(dir) {
  var stops = getCurrentStops();
  currentStopIndex = Math.max(0, Math.min(stops.length - 1, currentStopIndex + dir));
  updateStopDisplay();
}

// Show full list picker for fare stages
function showFsList(type) {
  var stages = getCurrentFareStages();
  var listEl = document.getElementById('fs-picker-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  stages.forEach(function(fs, i) {
    var item = document.createElement('div');
    item.className = 'li';
    // Grey out stages before current for destination picker
    if (type === 'dest' && i < currentFsIndex) {
      item.style.opacity = '0.4';
      item.style.cursor = 'not-allowed';
    } else {
      item.onclick = function() {
        if (type === 'current') {
          currentFsIndex = i;
          if (destFsIndex < i) destFsIndex = i;
          currentStopIndex = 0;
          updateFsDisplay();
          updateStopDisplay();
        } else {
          destFsIndex = i;
          updateFsDisplay();
        }
        hideModal('fs-picker-modal');
      };
    }
    item.innerHTML = '<div class="ln">' + fs + '</div>';
    if ((type === 'current' && i === currentFsIndex) || (type === 'dest' && i === destFsIndex)) {
      item.innerHTML += '<div class="la">✓</div>';
    }
    listEl.appendChild(item);
  });
  document.getElementById('fs-picker-title').textContent =
    type === 'current' ? 'Select current fare stage' : 'Select destination fare stage';
  showModal('fs-picker-modal');
}

// Show full stop list picker
function showStopList() {
  var stops = getCurrentStops();
  var listEl = document.getElementById('stop-picker-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  stops.forEach(function(stop, i) {
    var item = document.createElement('div');
    item.className = 'li';
    item.onclick = function() {
      currentStopIndex = i;
      updateStopDisplay();
      hideModal('stop-picker-modal');
    };
    item.innerHTML = '<div class="ln">' + stop + '</div>'
      + (i === currentStopIndex ? '<div class="la">✓</div>' : '');
    listEl.appendChild(item);
  });
  showModal('stop-picker-modal');
}

// ── BASKET / TICKET QUANTITIES ──
var basket = [0, 0, 0, 0];

function adj(idx, d) {
  basket[idx] = Math.max(0, basket[idx] + d);
  var el = document.getElementById('qv' + idx);
  if (el) el.textContent = basket[idx];
  updateIssueButton();
}

function resetBasket() {
  basket = [0, 0, 0, 0];
  for (var i = 0; i < 4; i++) {
    var el = document.getElementById('qv' + i);
    if (el) el.textContent = '0';
  }
  updateIssueButton();
}

function getBasketTotal() {
  return basket.reduce(function(a, b) { return a + b; }, 0);
}

function updateIssueButton() {
  var btn = document.getElementById('issue-btn');
  if (!btn) return;
  var total = getBasketTotal();
  if (total === 0) {
    btn.classList.add('alight');
    btn.classList.remove('flash');
    btn.innerHTML = 'Alight<br>passenger';
  } else {
    btn.classList.remove('alight');
    btn.classList.remove('flash');
    var newPax = totalPax + total;
    btn.innerHTML = 'Issue ticket<br><span style="font-size:12px;opacity:0.85;">' + totalPax + ' → ' + newPax + '</span>';
  }
}

// ── ISSUE TICKET / ALIGHT LOGIC ──
function handleIssueBtn() {
  var total = getBasketTotal();

  if (total === 0) {
    // Alight passenger
    if (totalPax > 0) {
      totalPax = Math.max(0, totalPax - 1);
      updatePaxDisplay();
    }
    return;
  }

  var newPax = totalPax + total;

  // Capacity check
  if (vehicleCapacity > 0 && totalPax < vehicleCapacity && newPax > vehicleCapacity) {
    // Under → Over: show warning
    var over = newPax - vehicleCapacity;
    document.getElementById('over-cap-msg').textContent =
      over + ' over capacity — issue anyway?';
    document.getElementById('over-cap-confirm').onclick = function() {
      commitIssue(newPax);
      hideModal('over-cap-modal');
    };
    showModal('over-cap-modal');
    return;
  }

  // All other cases just update
  commitIssue(newPax);
}

function commitIssue(newPax) {
  totalPax = newPax;
  updatePaxDisplay();

  // Flash green
  var btn = document.getElementById('issue-btn');
  if (btn) {
    btn.classList.add('flash');
    btn.textContent = '✓ Issued';
    setTimeout(function() {
      resetBasket();
    }, 600);
  } else {
    resetBasket();
  }
}

// ── PAX DISPLAY ──
function updatePaxDisplay() {
  var el = document.getElementById('tpax');
  if (!el) return;

  var display = '';
  var colourClass = 'pax-green';

  if (vehicleCapacity > 0) {
    display = totalPax + '/' + vehicleCapacity;
    var pct = totalPax / vehicleCapacity;
    if (pct >= 1) colourClass = 'pax-red';
    else if (pct >= 0.5) colourClass = 'pax-amber';
    else colourClass = 'pax-green';
  } else {
    display = String(totalPax);
    colourClass = 'pax-green';
  }

  el.textContent = display;
  el.className = 'ti-val ' + colourClass;
}

// ── LONG PRESS (multi-ticket add) ──
function startLongPress(el, idx) {
  longPressTimer = setTimeout(function() {
    multiTicketIndex = idx;
    multiNpV = '';
    var disp = document.getElementById('multi-np-disp');
    if (disp) disp.innerHTML = '<span class="ph">Enter quantity</span>';
    showModal('multi-ticket-modal');
  }, 600);
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function multiNp(val) {
  if (val === 'back') {
    multiNpV = multiNpV.slice(0, -1);
  } else if (multiNpV.length < 3) {
    multiNpV += val;
  }
  var disp = document.getElementById('multi-np-disp');
  if (disp) {
    disp.innerHTML = multiNpV.length > 0
      ? '<span style="letter-spacing:5px;font-size:34px;">' + multiNpV + '</span>'
      : '<span class="ph">Enter quantity</span>';
  }
}

function confirmMultiTicket() {
  var qty = parseInt(multiNpV) || 0;
  if (qty > 0 && multiTicketIndex >= 0) {
    basket[multiTicketIndex] = basket[multiTicketIndex] + qty;
    var el = document.getElementById('qv' + multiTicketIndex);
    if (el) el.textContent = basket[multiTicketIndex];
    updateIssueButton();
  }
  hideModal('multi-ticket-modal');
  multiNpV = '';
  multiTicketIndex = -1;
}

// ── HISTORY FILTERS ──
var currentFilter = 'all';
var historyData = [
  { type: 'trip',    title: 'Trip 1 – Route 45 Inbound',       sub: '08:15 · Driver 1042 · 4 pax · £8.00',   date: 'Today' },
  { type: 'dead',    title: 'Dead run – Depot to Bus Station',  sub: '08:00 · Driver 1042',                    date: 'Today' },
  { type: 'fuel',    title: 'Fuel log',                          sub: '45.2L · £1.49/L · £67.35 total',        date: 'Today' },
  { type: 'trip',    title: 'Trip 3 – Route 46 Outbound',       sub: '11:20 · Driver 2301 · 6 pax · £14.00',  date: 'Yesterday' },
  { type: 'trip',    title: 'Trip 2 – Route 45 Outbound',       sub: '09:30 · Driver 1042 · 5 pax · £11.00',  date: 'Yesterday' },
  { type: 'fuel',    title: 'Fuel log',                          sub: '30.0L · £1.49/L · £44.70 total',        date: 'Yesterday' },
  { type: 'dead',    title: 'Dead run – Bus Station to Depot',  sub: '15:30 · Driver 2301',                    date: 'Yesterday' },
];

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.filter === f);
  });
  renderHistory();
}

function renderHistory() {
  var list = document.getElementById('history-list');
  if (!list) return;
  var filtered = historyData.filter(function(item) {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'trips') return item.type === 'trip';
    if (currentFilter === 'dead') return item.type === 'dead';
    if (currentFilter === 'fuel') return item.type === 'fuel';
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:#aaa;font-size:13px;">No records found</div>';
    return;
  }

  var html = '';
  var lastDate = '';
  filtered.forEach(function(item) {
    if (item.date !== lastDate) {
      html += '<div class="slbl">' + item.date + '</div>';
      lastDate = item.date;
    }
    var colour = item.type === 'trip' ? '#2c5f9e' : item.type === 'dead' ? '#c0392b' : '#1e8449';
    var label  = item.type === 'trip' ? 'Trip'     : item.type === 'dead' ? 'Dead run' : 'Fuel';
    html += '<div class="li">'
      + '<div><div class="ln">' + item.title + '</div>'
      + '<div class="ls">' + item.sub + '</div></div>'
      + '<div style="font-size:11px;color:' + colour + ';">' + label + '</div>'
      + '</div>';
  });
  list.innerHTML = html;
}

// ── CLOCK & WEATHER ──
function tick() {
  var n = new Date();
  var hh = String(n.getHours()).padStart(2, '0');
  var mm = String(n.getMinutes()).padStart(2, '0');
  var ss = String(n.getSeconds()).padStart(2, '0');
  var dd = String(n.getDate()).padStart(2, '0');
  var mo = String(n.getMonth() + 1).padStart(2, '0');
  var yyyy = n.getFullYear();
  var ts = hh + ':' + mm + ':' + ss;
  var ds = dd + '/' + mo + '/' + yyyy;
  var hm = hh + ':' + mm;

  var ids = [
    ['w-time', ts], ['w-date', ds],
    ['m-clock', ts], ['m-date', ds],
    ['dl-clock', hm], ['dl-date', ds],
    ['dr-clock', hm], ['dr-date', ds],
    ['brk-clock', hm], ['brk-date', ds]
  ];
  ids.forEach(function(p) {
    var e = document.getElementById(p[0]);
    if (e) e.textContent = p[1];
  });

  var tdt = document.getElementById('tp-dt');
  if (tdt) tdt.textContent = 'Date:    ' + dd + '/' + mo + '/' + yyyy + '\nTime:    ' + ts;
}

function loadWeather() {
  fetch('https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current=temperature_2m,apparent_temperature,windspeed_10m,relativehumidity_2m,weathercode&windspeed_unit=mph&timezone=Europe/London')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var c = d.current;
      var codes = {
        0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',
        45:'Foggy',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',
        61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',
        80:'Showers',95:'Thunderstorm'
      };
      var set = function(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; };
      set('wtemp', Math.round(c.temperature_2m) + '°C');
      set('wfeel', Math.round(c.apparent_temperature) + '°C');
      set('wwind', Math.round(c.windspeed_10m) + ' mph');
      set('whum',  c.relativehumidity_2m + '%');
      set('wdesc', codes[c.weathercode] || 'Clear');
    })
    .catch(function() {
      var e = document.getElementById('wdesc');
      if (e) e.textContent = 'Weather unavailable';
    });
}

// ── INIT ──
function liveInit() {
  renderV();
  setDuty(false);
  tick();
  setInterval(tick, 1000);
  loadWeather();
  updateIssueButton();
  renderHistory();
}
