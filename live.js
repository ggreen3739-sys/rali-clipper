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
var currentEventIndex = -1;

// ── ROUTE / FARE STAGE DATA ──
// This mirrors what's set up in the editor.
// When a trip is selected, setTrip() populates these from editorRoutes.
var currentRoute = '';
var currentDirection = 'Inbound';
var currentFsIndex = 0;
var currentStopIndex = 0;
var destFsIndex = 2;


function isOutbound() {
  var d = currentDirection.toLowerCase();
  return d.includes('out') || d.includes('south') || d.includes('west') || d.includes('anti');
}

// Gets fare stages for current trip direction
function getCurrentFareStages() {
  var route = editorRoutes.find(function(r) { return r.id === currentRoute; });
  if (!route || !route.fareStages || !route.fareStages.length) return ['Stage 1', 'Stage 2'];
  return isOutbound() ? route.fareStages.slice().reverse() : route.fareStages.slice();
}

// Gets stops for the current fare stage
function getCurrentStops() {
  var route = editorRoutes.find(function(r) { return r.id === currentRoute; });
  if (!route || !route.stops) return ['Stop'];
  var dir = isOutbound() ? 'outbound' : 'inbound';
  var stopsData = route.stops[dir] || {};
  var fsName = getCurrentFareStages()[currentFsIndex];
  return stopsData[fsName] || [fsName];
}

// Gets ALL stops for the current direction across all fare stages in order
function getAllDirectionStops() {
  var route = editorRoutes.find(function(r) { return r.id === currentRoute; });
  if (!route || !route.stops) return getCurrentStops();
  var dir = isOutbound() ? 'outbound' : 'inbound';
  var stopsData = route.stops[dir] || {};
  var stages = getCurrentFareStages();
  var result = [];
  stages.forEach(function(stage) {
    (stopsData[stage] || []).forEach(function(s) {
      if (result.indexOf(s) < 0) result.push(s);
    });
  });
  return result.length ? result : getCurrentStops();
}

// Sets currentFsIndex and currentStopIndex to match the named stop across all fare stages
function selectStopAcrossStages(stopName) {
  var route = editorRoutes.find(function(r) { return r.id === currentRoute; });
  if (!route || !route.stops) return;
  var dir = isOutbound() ? 'outbound' : 'inbound';
  var stopsData = route.stops[dir] || {};
  var stages = getCurrentFareStages();
  for (var si = 0; si < stages.length; si++) {
    var stageStops = stopsData[stages[si]] || [];
    var idx = stageStops.indexOf(stopName);
    if (idx >= 0) {
      currentFsIndex = si;
      currentStopIndex = idx;
      updateFsDisplay();
      updateStopDisplay();
      return;
    }
  }
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
    renderV();
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
var adhocV = [];

function renderV(q) {
  q = q || '';
  var h = '';
  var pf = editorVehicles.filter(function(v) {
    return !q || v.fleet.includes(q) || v.reg.toLowerCase().includes(q) || v.make.toLowerCase().includes(q);
  });
  if (pf.length) {
    h += '<div class="slbl">Fleet vehicles</div>';
    pf.forEach(function(v) {
      h += '<div class="li" onclick="selectVehicle(' + v.capacity + ')">'
        + '<div><div class="ln">' + v.fleet + ' – ' + v.make + '</div>'
        + '<div class="ls">' + v.reg + (v.capacity ? ' · Capacity: ' + v.capacity : '') + '</div></div>'
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
  renderLiveDutyList();
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
  if (!v) currentEventIndex = -1;
  updateNextEventButton();
}

// ── TRIP SETUP ──
function setTrip(route, from, to, dir, journeyId) {
  if (journeyId && historyData.some(function(h) { return h.type === 'trip' && h.journeyId === journeyId; })) {
    _pendingTripParams = { route: route, from: from, to: to, dir: dir, journeyId: journeyId };
    var jidEl = document.getElementById('trip-reenter-jid');
    if (jidEl) jidEl.textContent = journeyId;
    showModal('m-trip-reenter');
    return;
  }
  _doSetTrip(route, from, to, dir, journeyId);
}

function mergeTrip() {
  if (!_pendingTripParams) return;
  hideModal('m-trip-reenter');
  var p = _pendingTripParams; _pendingTripParams = null;
  var existIdx = -1;
  historyData.forEach(function(h, i) { if (h.type === 'trip' && h.journeyId === p.journeyId) existIdx = i; });
  var existing = existIdx >= 0 ? historyData.splice(existIdx, 1)[0] : null;
  _doSetTrip(p.route, p.from, p.to, p.dir, p.journeyId);
  if (existing) {
    if (existing.actualStart) tripStartTime = existing.actualStart;
    if (typeof existing.totalPaxOnBoard === 'number') {
      totalPax = existing.totalPaxOnBoard;
      updatePaxDisplay();
    }
    if (existing.tickets) {
      var edRoute = editorRoutes.find(function(r) { return r.id === p.route; });
      existing.tickets.forEach(function(t) {
        if (!t || !edRoute) return;
        var idx = edRoute.tickets.findIndex(function(rt) { return rt.name === t.name; });
        if (idx < 0) return;
        if (!tripTicketsSold[idx]) tripTicketsSold[idx] = { name: t.name, group: t.group, qty: 0, revenue: 0 };
        tripTicketsSold[idx].qty += t.qty;
        tripTicketsSold[idx].revenue += t.revenue;
      });
    }
  }
}

function startNewTrip() {
  if (!_pendingTripParams) return;
  hideModal('m-trip-reenter');
  var p = _pendingTripParams; _pendingTripParams = null;
  var starredId = p.journeyId;
  while (historyData.some(function(h) { return h.type === 'trip' && h.journeyId === starredId; })) {
    starredId += '*';
  }
  _doSetTrip(p.route, p.from, p.to, p.dir, starredId);
}

function _doSetTrip(route, from, to, dir, journeyId) {
  recordTripEnd();
  totalPax               = 0;
  updatePaxDisplay();
  currentTripStopActuals = {};
  _lastDetectedStop      = null;
  _lastVisitedStop       = null;
  _gpsFirstFix           = false;
  updateTimetableClock(null);
  currentRoute      = route;
  currentDirection  = dir;
  currentJourneyId  = journeyId || '';
  currentTrail      = [];
  currentTripDistance = 0;
  lastGPSPoint      = null;
  startGPSTracking();
  currentFsIndex = 0;
  currentStopIndex = 0;

  // Set dest to last fare stage by default
  var stages = getCurrentFareStages();
  destFsIndex = stages.length - 1;

  // Update fare stage / stop displays
  updateFsDisplay();
  updateStopDisplay();

  // Update trip info bar
  var edRoute = editorRoutes.find(function(r) { return r.id === currentRoute; });
  var routeName = edRoute ? edRoute.name : currentRoute;
  var mr = document.getElementById('m-route'); if (mr) mr.textContent = routeName;
  var tf = document.getElementById('ti-from'); if (tf) tf.textContent = from || '—';
  var tt = document.getElementById('ti-to');   if (tt) tt.textContent = to || '—';
  var td = document.getElementById('ti-dir');  if (td) td.textContent = dir;
  var dl = document.getElementById('dl-route');if (dl) dl.textContent = routeName + ' – ' + dir;
  currentTicketGroup = null;
  currentTicketPage  = 0;
  currentTabOffset   = 0;
  renderTicketTabs();
  renderTicketGrid();
  updateFarePrices();
  setupTicketSwipe();

  // Use ad-hoc overrides if set
  if (adhocJourneyId) { currentJourneyId = adhocJourneyId; adhocJourneyId = ''; }
  if (adhocStartTime) { tripStartTime = adhocStartTime; adhocStartTime = null; }
  else                { tripStartTime = nowHM(); }
  var ts = document.getElementById('ti-start'); if (ts) ts.textContent = tripStartTime || '--:--';
  var tn = document.getElementById('ti-trip');  if (tn) tn.textContent = currentJourneyId || '—';
  updateTimetableClock(getCurrentTimetableTrip() ? 'matched' : 'unmatched');

  // Start tracking new trip
  tripActive     = true;
  currentTripNotes = '';
  tripTicketsSold = [];
  updateTripNotesSub();

  // Reset basket and pax
  resetBasket();

  // Refresh stop markers on live map if it's already initialised
  if (liveMapInst) addRouteStopsToLiveMap();
}

// ── FARE STAGE NAVIGATION ──
function updateFsDisplay() {
  var stages = getCurrentFareStages();
  var el = document.getElementById('m-from');
  if (el) el.textContent = stages[currentFsIndex] || '—';
  var del = document.getElementById('m-to');
  if (del) del.textContent = stages[destFsIndex] || '—';
  updateFarePrices();
}

function updateFarePrices() {
  var edRoute = editorRoutes.find(function(r) { return r.id === currentRoute; });
  if (!edRoute || !edRoute.tickets) return;
  var stages = getCurrentFareStages();
  var from = stages[currentFsIndex] || '';
  var to   = stages[destFsIndex]   || '';
  edRoute.tickets.forEach(function(tt, i) {
    var el = document.getElementById('tprice-' + i);
    if (!el) return;
    if (tt.fareType === 'flat') {
      el.textContent = tt.price != null ? '£' + tt.price.toFixed(2) : 'Flat fare';
    } else {
      var fare = null;
      if (tt.chart) {
        var k1 = from + '→' + to, k2 = to + '→' + from;
        if (tt.chart[k1] != null)      fare = tt.chart[k1];
        else if (tt.chart[k2] != null) fare = tt.chart[k2];
        else if (from === to) {
          Object.keys(tt.chart).forEach(function(k) {
            var v = tt.chart[k];
            if (v != null && (fare == null || v < fare)) fare = v;
          });
        }
      }
      el.textContent = fare != null ? '£' + fare.toFixed(2) : 'Fare chart';
    }
  });
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

// Show full stop list picker — all stops in direction with timetable times if available
function showStopList() {
  var allStops = getAllDirectionStops();
  var currentStops = getCurrentStops();
  var currentStopName = currentStops[currentStopIndex] || '';
  var listEl = document.getElementById('stop-picker-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  var ttTrip = getCurrentTimetableTrip();
  var ttLbl = document.getElementById('stop-picker-tt-label');
  if (ttLbl) ttLbl.textContent = ttTrip ? ttTrip.tripId + ' · ' + ttTrip.direction : '';

  allStops.forEach(function(stop) {
    var ttStop = ttTrip ? ttTrip.stops.find(function(s) { return s.name === stop; }) : null;
    var isTiming = ttStop && ttStop.isTimingPoint;
    var isSelected = stop === currentStopName;
    var item = document.createElement('div');
    item.className = isSelected ? 'li cur-stop' : 'li';
    item.onclick = (function(name) {
      return function() {
        selectStopAcrossStages(name);
        hideModal('stop-picker-modal');
      };
    })(stop);

    var circleHtml = isTiming
      ? '<div style="width:12px;height:12px;border-radius:50%;background:#2c5f9e;flex-shrink:0;margin-right:8px;margin-top:2px;"></div>'
      : '<div style="width:12px;height:12px;border-radius:50%;background:#ddd;flex-shrink:0;margin-right:8px;margin-top:2px;"></div>';
    var actuals = currentTripStopActuals[stop] || null;
    var arrActual = actuals ? actuals.arrival : null;
    var depActual = actuals ? actuals.departure : null;
    var timeHtml = ttStop && ttStop.time
      ? '<div style="text-align:right;flex-shrink:0;">'
        + '<div style="font-size:13px;font-weight:' + (isTiming ? '700' : '400') + ';color:' + (isTiming ? '#2c5f9e' : '#888') + ';">' + ttStop.time + '</div>'
        + (arrActual ? '<div style="font-size:11px;font-weight:600;color:#1e8449;">Arr: ' + arrActual + (depActual ? ' · Dep: ' + depActual : '') + '</div>' : '')
        + '</div>'
      : '';

    item.innerHTML = '<div style="display:flex;align-items:flex-start;flex:1;">'
      + circleHtml
      + '<div class="ln" style="margin:0;">' + stop + '</div>'
      + '</div>'
      + timeHtml;

    listEl.appendChild(item);
  });
  showModal('stop-picker-modal');
}

function getCurrentTimetableTrip() {
  if (!currentRoute || !currentJourneyId) return null;
  var tts = typeof editorTimetables !== 'undefined' ? editorTimetables : [];
  var routeTTs = tts.filter(function(tt) { return tt.routeId === currentRoute; });
  for (var i = 0; i < routeTTs.length; i++) {
    for (var j = 0; j < routeTTs[i].trips.length; j++) {
      var trip = routeTTs[i].trips[j];
      if (trip.tripId === currentJourneyId && trip.direction === currentDirection) return trip;
    }
  }
  return null;
}

// ── BASKET / TICKET QUANTITIES ──
var basket = [0, 0, 0, 0];
var currentTicketGroup = null;
var currentTicketPage  = 0;
var currentTabOffset   = 0;

// ── TRIP TRACKING ──
var tripActive        = false;
var tripStartTime     = null;
var currentDirection  = '';
var currentJourneyId  = '';
var tripTicketsSold   = [];
var deadStartTime     = null;
var deadNotes         = '';
var breakStartTime    = null;
var breakPlannedMins  = 0;
var fuelPriceMode     = 'ppl';
var currentTripNotes  = '';
var adhocJourneyId    = '';
var adhocStartTime    = null;
var adhocDutyName     = '';
var _pendingTripParams = null;
var _adhocTripPending = null;

// ── APP CONFIG ──
var appConfig = {
  early:     { mins: 1,  color: '#c0392b' },
  late:      { mins: 5,  color: '#d4730e' },
  ontime:    { color: '#1e8449' },
  matched:   { color: '#2c5f9e' },
  unmatched: { color: '#5566aa' },
  clockFont: 'white',
  units:     { distance: 'miles', speed: 'mph', fuel: 'mpg' }
};
var _APP_CONFIG_DEFAULTS = JSON.parse(JSON.stringify(appConfig));

// ── GPS / TRACKING GLOBALS ──
var _donationBannerShown  = false;
var gpsWatchId            = null;
var _gpsState             = 'searching';
var _gpsFirstFix          = false;
var _lastVisitedStop      = null;
var currentTripStopActuals = {};  // stopName → { arrival: 'HH:MM', departure: 'HH:MM'|null }
var _lastDetectedStop      = null;
var currentTrail      = [];
var currentTripDistance = 0;
var lastGPSPoint      = null;
var currentAlt        = null;
var currentSpeedMs    = null;  // raw m/s from GPS
var currentSpeed      = null;  // display value in configured units
var liveMapInst       = null;
var liveTrailLine     = null;
var liveMarker        = null;
var tripMapInst       = null;
var liveStopMarkers   = [];

function nowHM() {
  var n = new Date();
  return String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0');
}
function todayStr() {
  var n = new Date();
  return String(n.getDate()).padStart(2,'0') + '/' + String(n.getMonth()+1).padStart(2,'0') + '/' + n.getFullYear();
}
function timeToMins(hhmm) {
  if (!hhmm) return 0;
  var p = hhmm.split(':');
  return parseInt(p[0]) * 60 + parseInt(p[1]);
}

function minsBetween(t1, t2) {
  if (!t1 || !t2) return null;
  var d = timeToMins(t2) - timeToMins(t1);
  return d >= 0 ? d : null;
}

function adj(idx, d) {
  basket[idx] = Math.max(0, basket[idx] + d);
  var el = document.getElementById('qv' + idx);
  if (el) el.textContent = basket[idx];
  updateIssueButton();
}

function resetBasket() {
  basket = new Array(basket.length).fill(0);
  for (var i = 0; i < basket.length; i++) {
    var el = document.getElementById('qv' + i);
    if (el) el.textContent = '0';
  }
  updateIssueButton();
}

function makeBox(label, subLabel, idx) {
  var box = document.createElement('div');
  box.className = 'tbox';
  box.innerHTML = '<div class="tn">' + label + '</div>'
    + '<div class="qr">'
    + '<button class="qm" onclick="adj(' + idx + ',-1)">−</button>'
    + '<span class="qv" id="qv' + idx + '">' + (basket[idx] || 0) + '</span>'
    + '<button class="qp" onclick="adj(' + idx + ',1)">+</button>'
    + '</div>'
    + (subLabel ? '<div class="tp" id="tprice-' + idx + '">' + subLabel + '</div>' : '');
  box.addEventListener('mousedown',  function() { startLongPress(box, idx); });
  box.addEventListener('mouseup',    cancelLongPress);
  box.addEventListener('mouseleave', cancelLongPress);
  box.addEventListener('touchstart', function(e) { startLongPress(box, idx); }, {passive:true});
  box.addEventListener('touchend',   cancelLongPress);
  return box;
}

function renderTicketTabs() {
  var tabsEl = document.getElementById('ticket-tabs');
  if (!tabsEl) return;
  var edRoute = editorRoutes.find(function(r) { return r.id === currentRoute; });
  var routeTickets = edRoute && edRoute.tickets ? edRoute.tickets : [];

  // Which group IDs have tickets on this route
  var activeGroupIds = [];
  routeTickets.forEach(function(rt) {
    var tt = editorTicketTypes.find(function(t) { return t.name === rt.name; });
    var gid = tt && tt.group ? tt.group : 'donations';
    if (activeGroupIds.indexOf(gid) === -1) activeGroupIds.push(gid);
  });

  // Default selection to first active group
  if (!currentTicketGroup || activeGroupIds.indexOf(currentTicketGroup) === -1) {
    currentTicketGroup = activeGroupIds[0] || (editorTicketGroups[0] && editorTicketGroups[0].id) || 'donations';
  }

  var total = editorTicketGroups.length;
  currentTabOffset = Math.max(0, Math.min(currentTabOffset, Math.max(0, total - 4)));

  tabsEl.innerHTML = '';
  for (var i = 0; i < 4; i++) {
    var idx = currentTabOffset + i;
    var tab = document.createElement('div');
    if (idx < total) {
      var g = editorTicketGroups[idx];
      var hasTickets = activeGroupIds.indexOf(g.id) !== -1;
      if (hasTickets) {
        tab.className = 'tab' + (g.id === currentTicketGroup ? ' on' : '');
        tab.textContent = g.name;
        tab.onclick = (function(gid) { return function() { setTicketGroup(gid); }; })(g.id);
      } else {
        tab.className = 'tab empty';
        tab.textContent = 'Empty';
      }
    } else {
      tab.className = 'tab empty';
      tab.textContent = '—';
    }
    tabsEl.appendChild(tab);
  }

  var btnL = document.getElementById('tab-scroll-left');
  var btnR = document.getElementById('tab-scroll-right');
  if (btnL) btnL.disabled = currentTabOffset <= 0;
  if (btnR) btnR.disabled = currentTabOffset >= Math.max(0, total - 4);
}

function tabScrollLeft() {
  if (currentTabOffset > 0) { currentTabOffset--; renderTicketTabs(); }
}

function tabScrollRight() {
  if (currentTabOffset < Math.max(0, editorTicketGroups.length - 4)) { currentTabOffset++; renderTicketTabs(); }
}

function setTicketGroup(groupId) {
  currentTicketGroup = groupId;
  currentTicketPage  = 0;
  renderTicketTabs();
  renderTicketGrid();
  updateFarePrices();
}

function renderTicketGrid() {
  var grid = document.getElementById('tgrid');
  if (!grid) return;

  var edRoute = editorRoutes.find(function(r) { return r.id === currentRoute; });
  var allTickets = edRoute && edRoute.tickets && edRoute.tickets.length ? edRoute.tickets : null;

  grid.innerHTML = '';

  if (!allTickets) {
    basket = [0];
    var msg = document.createElement('div');
    msg.style.cssText = 'grid-column:1/-1;padding:10px 12px;font-size:12px;color:#888;text-align:center;';
    msg.textContent = 'No fares on this service';
    grid.appendChild(msg);
    grid.appendChild(makeBox('Custom fare', 'Enter amt', 0));
    var ph = document.createElement('div');
    ph.className = 'tbox'; ph.style.visibility = 'hidden'; ph.style.pointerEvents = 'none';
    grid.appendChild(ph);
    renderPageDots(0, 0);
    updateIssueButton();
    return;
  }

  if (basket.length !== allTickets.length) basket = new Array(allTickets.length).fill(0);

  // Filter to current group
  var groupTickets = [];
  allTickets.forEach(function(rt, i) {
    var tt = editorTicketTypes.find(function(t) { return t.name === rt.name; });
    var gid = tt && tt.group ? tt.group : 'donations';
    if (gid === currentTicketGroup) groupTickets.push({ ticket: rt, idx: i });
  });

  var totalPages = Math.max(1, Math.ceil(groupTickets.length / 4));
  if (currentTicketPage >= totalPages) currentTicketPage = 0;
  var pageItems = groupTickets.slice(currentTicketPage * 4, currentTicketPage * 4 + 4);

  for (var i = 0; i < 4; i++) {
    var item = pageItems[i];
    if (item) {
      grid.appendChild(makeBox(item.ticket.name, item.ticket.fareType === 'flat' ? 'Flat fare' : 'Fare chart', item.idx));
    } else {
      var ph = document.createElement('div');
      ph.className = 'tbox'; ph.style.visibility = 'hidden'; ph.style.pointerEvents = 'none';
      grid.appendChild(ph);
    }
  }

  renderPageDots(currentTicketPage, totalPages);
  updateIssueButton();
}

function renderPageDots(page, total) {
  var el = document.getElementById('ticket-page-dots');
  if (!el) return;
  if (total <= 1) { el.innerHTML = ''; return; }
  var html = '';
  for (var i = 0; i < total; i++) {
    html += '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;margin:0 3px;background:' + (i === page ? '#2c5f9e' : '#ccc') + ';"></span>';
  }
  el.innerHTML = html;
}

function setupTicketSwipe() {
  var grid = document.getElementById('tgrid');
  if (!grid) return;
  var startX = null;
  grid.removeEventListener('touchstart', grid._swipeStart);
  grid.removeEventListener('touchend',   grid._swipeEnd);
  grid._swipeStart = function(e) { startX = e.touches[0].clientX; };
  grid._swipeEnd   = function(e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) < 40) return;
    var edRoute = editorRoutes.find(function(r) { return r.id === currentRoute; });
    var allTickets = edRoute && edRoute.tickets ? edRoute.tickets : [];
    var groupTickets = allTickets.filter(function(rt) {
      var tt = editorTicketTypes.find(function(t) { return t.name === rt.name; });
      return (tt && tt.group ? tt.group : 'donations') === currentTicketGroup;
    });
    var totalPages = Math.max(1, Math.ceil(groupTickets.length / 4));
    if (dx < 0 && currentTicketPage < totalPages - 1) { currentTicketPage++; renderTicketGrid(); updateFarePrices(); }
    if (dx > 0 && currentTicketPage > 0)              { currentTicketPage--; renderTicketGrid(); updateFarePrices(); }
  };
  grid.addEventListener('touchstart', grid._swipeStart, {passive:true});
  grid.addEventListener('touchend',   grid._swipeEnd,   {passive:true});
}

function getBasketTotal() {
  return basket.reduce(function(a, b) { return a + b; }, 0);
}

function getBasketCost() {
  var edRoute = editorRoutes.find(function(r) { return r.id === currentRoute; });
  if (!edRoute || !edRoute.tickets) return 0;
  var stages = getCurrentFareStages();
  var from = stages[currentFsIndex] || '', to = stages[destFsIndex] || '';
  var total = 0;
  basket.forEach(function(qty, i) {
    if (!qty) return;
    var tt = edRoute.tickets[i];
    if (!tt) return;
    var price = 0;
    if (tt.fareType === 'flat') {
      price = tt.price || 0;
    } else if (tt.chart) {
      var k1 = from + '→' + to, k2 = to + '→' + from;
      price = tt.chart[k1] != null ? tt.chart[k1] : (tt.chart[k2] != null ? tt.chart[k2] : 0);
    }
    total += qty * price;
  });
  return total;
}

function updateIssueButton() {
  var btn = document.getElementById('issue-btn');
  if (!btn) return;
  var total = getBasketTotal();
  if (total === 0) {
    btn.classList.add('alight');
    btn.classList.remove('flash');
    btn.innerHTML = 'Alight<br>passenger';
    btn.style.opacity = totalPax === 0 ? '0.4' : '';
    btn.style.cursor  = totalPax === 0 ? 'not-allowed' : '';
  } else {
    btn.classList.remove('alight');
    btn.classList.remove('flash');
    btn.style.opacity = '';
    btn.style.cursor  = '';
    var newPax = totalPax + total;
    var cost = getBasketCost();
    btn.innerHTML = '<div style="text-align:center;line-height:1.25;width:100%;">'
      + (cost > 0 ? '<div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;">£' + cost.toFixed(2) + '</div>' : '')
      + '<div style="font-size:11px;opacity:0.82;">' + totalPax + ' → ' + newPax + '</div>'
      + '<div style="font-size:17px;font-weight:700;">Issue</div>'
      + '</div>';
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
  // Accumulate tickets sold for history
  var edRoute = editorRoutes.find(function(r) { return r.id === currentRoute; });
  if (edRoute && edRoute.tickets) {
    var stages = getCurrentFareStages();
    var from = stages[currentFsIndex] || '';
    var to   = stages[destFsIndex]   || '';
    basket.forEach(function(qty, i) {
      if (qty <= 0) return;
      var rt = edRoute.tickets[i];
      if (!rt) return;
      if (!tripTicketsSold[i]) {
        var ttType = editorTicketTypes.find(function(t) { return t.name === rt.name; });
        tripTicketsSold[i] = { name: rt.name, group: ttType ? ttType.group : 'donations', qty: 0, revenue: 0 };
      }
      tripTicketsSold[i].qty += qty;
      var price = 0;
      if (rt.fareType === 'flat') {
        price = rt.price || 0;
      } else if (rt.chart) {
        var k1 = from + '→' + to, k2 = to + '→' + from;
        price = rt.chart[k1] != null ? rt.chart[k1] : (rt.chart[k2] || 0);
      }
      tripTicketsSold[i].revenue += qty * price;
    });
  }

  totalPax = newPax;
  updatePaxDisplay();
  updateVimDonation();

  // Flash green
  var btn = document.getElementById('issue-btn');
  if (btn) {
    btn.classList.add('flash');
    btn.textContent = '✓ Issued';
    setTimeout(function() { resetBasket(); }, 600);
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
  updateIssueButton();
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
var historyData = [];

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
    if (currentFilter === 'all')    return true;
    if (currentFilter === 'trips')  return item.type === 'trip';
    if (currentFilter === 'dead')   return item.type === 'dead';
    if (currentFilter === 'breaks') return item.type === 'break';
    if (currentFilter === 'fuel')   return item.type === 'fuel';
    return true;
  }).slice().reverse();

  if (filtered.length === 0) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:#aaa;font-size:13px;">No records yet</div>';
    return;
  }

  list.innerHTML = '';
  var lastDate = '';
  filtered.forEach(function(item, idx) {
    if (item.date !== lastDate) {
      var d = document.createElement('div');
      d.className = 'slbl'; d.textContent = item.date;
      list.appendChild(d);
      lastDate = item.date;
    }

    var card = document.createElement('div');
    card.style.cssText = 'display:flex;align-items:stretch;background:#fff;border-bottom:1px solid #eee;padding:0;cursor:pointer;';
    card.onmouseenter = function() { card.style.background = '#f5f8ff'; };
    card.onmouseleave = function() { card.style.background = '#fff'; };

    var COL_W = 'width:60px;min-width:60px;max-width:60px;flex-shrink:0;';
    if (item.type === 'trip') {
      var rn = (item.routeName || '—').substring(0, 5);
      var fontSize = rn.length <= 3 ? '20px' : rn.length === 4 ? '17px' : '14px';
      var donStr  = '£' + (item.donRev  || 0).toFixed(2) + ' donations';
      var timeRow = (item.actualStart || '—') + ' → ' + (item.actualEnd || '—') + (item.journeyId ? ' · ' + item.journeyId : '');
      var paxRow  = donStr + ' · ' + (item.paxBoarded || 0) + ' pax';
      card.innerHTML =
        '<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;padding:10px 8px;' + COL_W + 'border-right:2px solid #d0d8e8;">'
        + '<div style="font-size:' + fontSize + ';font-weight:800;color:#2c5f9e;line-height:1;text-align:center;">' + rn + '</div>'
        + '<div style="font-size:10px;color:#2c5f9e;font-weight:500;margin-top:3px;text-align:center;">' + (item.direction || '') + '</div>'
        + '</div>'
        + '<div style="flex:1;padding:10px 12px;display:flex;flex-direction:column;justify-content:center;gap:3px;min-width:0;">'
        + '<div style="font-size:12px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + timeRow + '</div>'
        + '<div style="font-size:11px;color:#888;">' + paxRow + '</div>'
        + '</div>';
      card.onclick = (function(it) { return function() { showTripDetail(it); }; })(item);

    } else if (item.type === 'dead') {
      var durStr = item.durationMins != null ? item.durationMins + ' min' : '—';
      card.innerHTML =
        '<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;padding:10px 8px;' + COL_W + 'border-right:2px solid #f5c6c6;">'
        + '<div style="font-size:13px;font-weight:700;color:#c0392b;text-transform:uppercase;line-height:1.3;">Dead</div>'
        + '<div style="font-size:13px;font-weight:700;color:#c0392b;text-transform:uppercase;line-height:1.3;">run</div>'
        + '</div>'
        + '<div style="flex:1;padding:10px 12px;display:flex;flex-direction:column;justify-content:center;gap:3px;">'
        + '<div style="font-size:12px;color:#333;">' + (item.actualStart || '—') + ' → ' + (item.actualEnd || '—') + ' · ' + durStr + '</div>'
        + '<div style="font-size:11px;color:#888;">' + (item.notes || 'Not in service') + '</div>'
        + '</div>';

    } else if (item.type === 'break') {
      var durStr = item.durationMins != null ? item.durationMins + ' min' : '—';
      var planStr = item.plannedMins ? 'planned ' + item.plannedMins + ' min' : '';
      card.innerHTML =
        '<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;padding:10px 8px;' + COL_W + 'border-right:2px solid #a9dfbf;">'
        + '<div style="font-size:13px;font-weight:700;color:#1e8449;text-transform:uppercase;">Break</div>'
        + '</div>'
        + '<div style="flex:1;padding:10px 12px;display:flex;flex-direction:column;justify-content:center;gap:3px;">'
        + '<div style="font-size:12px;color:#333;">' + (item.actualStart || '—') + ' → ' + (item.actualEnd || '—') + ' · ' + durStr + '</div>'
        + '<div style="font-size:11px;color:#888;">' + planStr + '</div>'
        + '</div>';

    } else if (item.type === 'fuel') {
      var parts = [];
      if (item.amount  != null) parts.push(item.amount.toFixed(1) + ' L');
      if (item.ppl     != null) parts.push('£' + item.ppl.toFixed(3) + '/L');
      if (item.overall != null) parts.push('£' + item.overall.toFixed(2) + ' total');
      if (item.startMileage != null && item.endMileage != null) parts.push(item.startMileage + ' → ' + item.endMileage + ' mi');
      card.innerHTML =
        '<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;padding:10px 8px;' + COL_W + 'border-right:2px solid #fad7a0;">'
        + '<div style="font-size:13px;font-weight:700;color:#e67e22;text-transform:uppercase;">Fuel</div>'
        + '</div>'
        + '<div style="flex:1;padding:10px 12px;display:flex;flex-direction:column;justify-content:center;gap:3px;">'
        + '<div style="font-size:12px;color:#333;">' + (item.time || '—') + '</div>'
        + '<div style="font-size:11px;color:#888;">' + (parts.join(' · ') || 'No details') + '</div>'
        + '</div>';
      card.onclick = (function(it) { return function() { showFuelDetail(it); }; })(item);
    }

    list.appendChild(card);
  });
}

function showTripDetail(item) {
  var el = document.getElementById('trip-detail-body');
  if (!el) return;
  var durStr  = item.durationMins   != null ? item.durationMins + ' min'       : '—';
  var distStr = item.distanceMiles  != null ? item.distanceMiles.toFixed(2) + ' mi' : '—';
  var html = '<div style="margin-bottom:12px;">'
    + '<div style="font-size:20px;font-weight:800;color:#2c5f9e;">' + (item.routeName || '—') + ' – ' + (item.direction || '') + '</div>'
    + (item.journeyId ? '<div style="font-size:13px;color:#888;margin-top:2px;">Journey ' + item.journeyId + '</div>' : '')
    + '</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:12px;">'
    + '<div style="flex:1;background:#f0f4ff;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.4px;">Start</div><div style="font-size:16px;font-weight:700;color:#2c5f9e;">' + (item.actualStart || '—') + '</div></div>'
    + '<div style="flex:1;background:#f0f4ff;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.4px;">End</div><div style="font-size:16px;font-weight:700;color:#2c5f9e;">' + (item.actualEnd || '—') + '</div></div>'
    + '<div style="flex:1;background:#f0f4ff;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.4px;">Duration</div><div style="font-size:16px;font-weight:700;color:#2c5f9e;">' + durStr + '</div></div>'
    + '<div style="flex:1;background:#f0f4ff;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.4px;">Distance</div><div style="font-size:16px;font-weight:700;color:#2c5f9e;">' + distStr + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:14px;">'
    + '<div style="flex:1;background:#f0f8f4;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.4px;">Pax boarded</div><div style="font-size:18px;font-weight:700;color:#1e8449;">' + (item.paxBoarded || 0) + '</div></div>'
    + '<div style="flex:1;background:#f0f8f4;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.4px;">Donations</div><div style="font-size:18px;font-weight:700;color:#1e8449;">£' + (item.donRev || 0).toFixed(2) + '</div></div>'
    + '<div style="flex:1;background:#f0f8f4;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.4px;">Other sales</div><div style="font-size:18px;font-weight:700;color:#1e8449;">£' + (item.othRev || 0).toFixed(2) + '</div></div>'
    + '</div>';
  if (item.tickets && item.tickets.length) {
    html += '<div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px;">Ticket breakdown</div>';
    item.tickets.forEach(function(t) {
      if (!t || t.qty === 0) return;
      html += '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee;font-size:13px;">'
        + '<span>' + t.name + '</span>'
        + '<span style="color:#555;">×' + t.qty + ' · £' + t.revenue.toFixed(2) + '</span>'
        + '</div>';
    });
  } else {
    html += '<div style="font-size:13px;color:#aaa;text-align:center;padding:10px 0;">No tickets issued</div>';
  }
  if (item.ttStops && item.ttStops.length) {
    html += '<div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px;margin-top:4px;">Stop times</div>';
    item.ttStops.forEach(function(s) {
      var stopAct = item.stopActuals && item.stopActuals[s.name] ? item.stopActuals[s.name] : null;
      var actual = stopAct ? (typeof stopAct === 'string' ? stopAct : (stopAct.arrival || null)) : null;
      var actual2 = stopAct && typeof stopAct === 'object' ? (stopAct.departure || null) : null;
      var diff = (actual && s.time) ? timeToMins(actual) - timeToMins(s.time) : null;
      var statusColor = diff == null ? '#aaa' : (diff > appConfig.late.mins ? appConfig.late.color : (diff < -appConfig.early.mins ? appConfig.early.color : appConfig.ontime.color));
      var statusLabel = diff == null ? '' : (diff > appConfig.late.mins ? 'Late ' + diff + ' min' : (diff < -appConfig.early.mins ? 'Early ' + Math.abs(diff) + ' min' : 'On time'));
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #f0f0f0;">'
        + '<div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1;">'
        + (s.isTimingPoint
          ? '<div style="width:8px;height:8px;border-radius:50%;background:#2c5f9e;flex-shrink:0;"></div>'
          : '<div style="width:8px;height:8px;border-radius:50%;border:1.5px solid #ccc;flex-shrink:0;"></div>')
        + '<span style="font-size:12px;color:' + (s.isTimingPoint ? '#333' : '#666') + ';font-weight:' + (s.isTimingPoint ? '600' : '400') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + s.name + '</span>'
        + '</div>'
        + '<div style="text-align:right;flex-shrink:0;padding-left:8px;">'
        + '<span style="font-size:12px;color:#2c5f9e;font-weight:600;">' + s.time + '</span>'
        + (actual ? '<span style="font-size:11px;color:' + statusColor + ';margin-left:6px;">' + actual + (actual2 ? '→' + actual2 : '') + (statusLabel ? ' · ' + statusLabel : '') + '</span>' : '')
        + '</div>'
        + '</div>';
    });
  }
  if (item.notes) {
    html += '<div style="margin-top:12px;padding:10px;background:#fffbe6;border-radius:8px;border-left:3px solid #f0c040;">'
      + '<div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">Trip notes</div>'
      + '<div style="font-size:13px;color:#333;">' + item.notes + '</div>'
      + '</div>';
  }
  el.innerHTML = html;
  showTripMap(item.trail);
  showModal('m-trip-detail');
}

// ── TRIP / EVENT RECORDING ──
function recordTripEnd() {
  if (!tripActive || !tripStartTime) return;
  tripActive = false;
  var endTime = nowHM();
  var dur = minsBetween(tripStartTime, endTime);
  var edRoute = editorRoutes.find(function(r) { return r.id === currentRoute; });
  var routeName = edRoute ? edRoute.name : currentRoute;
  var donQty = 0, donRev = 0, othQty = 0, othRev = 0, paxBoarded = 0;
  tripTicketsSold.forEach(function(sold) {
    if (!sold || sold.qty === 0) return;
    paxBoarded += sold.qty;
    if (sold.group === 'donations') { donQty += sold.qty; donRev += sold.revenue; }
    else                            { othQty += sold.qty; othRev += sold.revenue; }
  });
  var tickets = tripTicketsSold.filter(function(s) { return s && s.qty > 0; });
  var distMiles = currentTripDistance > 0 ? currentTripDistance / 1609.344 : null;
  var ttTrip = getCurrentTimetableTrip();
  historyData.push({
    type: 'trip', date: todayStr(),
    routeName: routeName, direction: currentDirection, journeyId: currentJourneyId,
    actualStart: tripStartTime, actualEnd: endTime, durationMins: dur,
    paxBoarded: paxBoarded, totalPaxOnBoard: totalPax,
    donQty: donQty, donRev: donRev, othQty: othQty, othRev: othRev,
    tickets: tickets, notes: currentTripNotes,
    trail: currentTrail.slice(), distanceMiles: distMiles,
    stopActuals: Object.assign({}, currentTripStopActuals),
    ttStops: ttTrip ? ttTrip.stops.filter(function(s) { return s.time; }).map(function(s) {
      return { name: s.name, time: s.time, isTimingPoint: s.isTimingPoint };
    }) : null
  });
  currentTrail = [];
  currentTripDistance = 0;
  lastGPSPoint = null;
  currentTripNotes = '';
  updateTripNotesSub();
  updateVimDonation();
  tripTicketsSold = [];
}

function startDeadRun(ev) {
  recordTripEnd();
  deadStartTime = nowHM();
  deadNotes = ev && ev.notes ? ev.notes : '';
  updateVimDonation();
  go('s-deadrun');
}

function endDeadRun() {
  var endTime = nowHM();
  var dur = minsBetween(deadStartTime, endTime);
  historyData.push({
    type: 'dead', date: todayStr(),
    notes: deadNotes, actualStart: deadStartTime, actualEnd: endTime, durationMins: dur
  });
  deadStartTime = null;
  go('s-trip');
}

function startBreak(ev) {
  recordTripEnd();
  breakStartTime   = nowHM();
  breakPlannedMins = ev && ev.duration ? ev.duration : 0;
  updateVimDonation();
  go('s-break');
}

function endBreak() {
  var endTime = nowHM();
  var dur = minsBetween(breakStartTime, endTime);
  historyData.push({
    type: 'break', date: todayStr(),
    actualStart: breakStartTime, actualEnd: endTime, durationMins: dur, plannedMins: breakPlannedMins
  });
  breakStartTime = null;
  go('s-trip');
}

function startFuel() {
  recordTripEnd();
  fuelPriceMode = 'ppl';
  setFuelMode('ppl');
  ['fuel-start-mi','fuel-end-mi','fuel-amount','fuel-price'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  go('s-fuel');
}

function setFuelMode(mode) {
  fuelPriceMode = mode;
  var btnPPL     = document.getElementById('fuel-mode-ppl');
  var btnOverall = document.getElementById('fuel-mode-overall');
  var lbl        = document.getElementById('fuel-price-lbl');
  if (btnPPL)     btnPPL.style.background     = mode === 'ppl'     ? '#2c5f9e' : '#e0e0e0';
  if (btnPPL)     btnPPL.style.color          = mode === 'ppl'     ? '#fff'    : '#333';
  if (btnOverall) btnOverall.style.background = mode === 'overall' ? '#2c5f9e' : '#e0e0e0';
  if (btnOverall) btnOverall.style.color      = mode === 'overall' ? '#fff'    : '#333';
  if (lbl) lbl.textContent = mode === 'ppl' ? 'Price per litre (£)' : 'Overall cost (£)';
}

function saveFuel() {
  var startMi = document.getElementById('fuel-start-mi').value;
  var endMi   = document.getElementById('fuel-end-mi').value;
  var amount  = parseFloat(document.getElementById('fuel-amount').value) || null;
  var price   = parseFloat(document.getElementById('fuel-price').value)  || null;
  if (amount === null && price === null && !startMi && !endMi) {
    alert('Please fill in at least one field.');
    return;
  }
  var ppl = null, overall = null;
  if (fuelPriceMode === 'ppl') {
    ppl = price;
    if (ppl != null && amount != null) overall = ppl * amount;
  } else {
    overall = price;
    if (overall != null && amount != null && amount > 0) ppl = overall / amount;
  }
  historyData.push({
    type: 'fuel', date: todayStr(), time: nowHM(),
    startMileage: startMi ? parseFloat(startMi) : null,
    endMileage:   endMi   ? parseFloat(endMi)   : null,
    amount: amount, ppl: ppl, overall: overall
  });
  go('s-trip');
}

function updateFuelCalc() {
  var hint   = document.getElementById('fuel-calc-hint');
  if (!hint) return;
  var amount = parseFloat(document.getElementById('fuel-amount').value) || null;
  var price  = parseFloat(document.getElementById('fuel-price').value)  || null;
  if (amount == null || price == null) { hint.textContent = ''; return; }
  if (fuelPriceMode === 'ppl') {
    hint.textContent = '= £' + (amount * price).toFixed(2) + ' overall';
  } else {
    hint.textContent = amount > 0 ? '= £' + (price / amount).toFixed(3) + '/L' : '';
  }
}

function showFuelDetail(item) {
  var el = document.getElementById('fuel-detail-body');
  if (!el) return;
  var html = '<div style="font-size:18px;font-weight:700;color:#e67e22;margin-bottom:14px;">Fuel log · ' + (item.time || '—') + '</div>';
  var rows = [
    ['Time', item.time || '—'],
    ['Amount', item.amount != null ? item.amount.toFixed(1) + ' L' : '—'],
    ['Price per litre', item.ppl != null ? '£' + item.ppl.toFixed(3) : '—'],
    ['Overall cost', item.overall != null ? '£' + item.overall.toFixed(2) : '—'],
    ['Start mileage', item.startMileage != null ? item.startMileage : '—'],
    ['End mileage', item.endMileage != null ? item.endMileage : '—'],
    ['Miles covered', (item.startMileage != null && item.endMileage != null) ? (item.endMileage - item.startMileage) + ' mi' : '—']
  ];
  rows.forEach(function(r) {
    html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:13px;">'
      + '<span style="color:#888;">' + r[0] + '</span><span style="font-weight:500;">' + r[1] + '</span></div>';
  });
  el.innerHTML = html;
  showModal('m-fuel-detail');
}

function openAdhocDutyModal() {
  var inp = document.getElementById('adhoc-duty-name');
  if (inp) inp.value = '';
  showModal('m-adhoc-duty');
  setTimeout(function() { if (inp) inp.focus(); }, 150);
}

function confirmAdhocDuty() {
  var inp = document.getElementById('adhoc-duty-name');
  adhocDutyName = (inp ? inp.value.trim() : '') || 'Ad-hoc';
  hideModal('m-adhoc-duty');
  currentDutyId = '';
  setDuty(false);
  var hdrLbl = document.querySelector('#s-trip .blue-hdr div:first-child > div:first-child');
  if (hdrLbl) hdrLbl.textContent = adhocDutyName;
  renderAdhocDutyList();
  go('s-trip');
}

function _openAdhocTripModal(routeId) {
  var route = editorRoutes.find(function(r) { return r.id === routeId; });
  if (!route) return;
  _adhocTripPending = { routeId: routeId };
  var sel = document.getElementById('adhoc-trip-dir');
  if (sel) {
    sel.innerHTML = '<option value="' + route.dir1 + '">' + route.dir1 + '</option>'
      + '<option value="' + route.dir2 + '">' + route.dir2 + '</option>';
  }
  var jidEl = document.getElementById('adhoc-trip-jid');
  var timeEl = document.getElementById('adhoc-trip-time');
  if (jidEl) jidEl.value = '';
  if (timeEl) timeEl.value = nowHM ? nowHM() : '';
  showModal('m-adhoc-trip');
}

function confirmAdhocTrip() {
  if (!_adhocTripPending) return;
  var routeId = _adhocTripPending.routeId;
  _adhocTripPending = null;
  var route = editorRoutes.find(function(r) { return r.id === routeId; });
  if (!route) return;
  var sel = document.getElementById('adhoc-trip-dir');
  var dir = sel ? sel.value : route.dir1;
  var fs = route.fareStages || [];
  var isDir1 = (dir === route.dir1);
  var from = isDir1 ? (fs[0] || '') : (fs[fs.length - 1] || '');
  var to   = isDir1 ? (fs[fs.length - 1] || '') : (fs[0] || '');
  var jid  = (document.getElementById('adhoc-trip-jid').value  || '').trim();
  var time = (document.getElementById('adhoc-trip-time').value || '');
  if (!jid) jid = (adhocDutyName || 'AD') + '-' + dir.charAt(0) + '-' + new Date().getMinutes();
  hideModal('m-adhoc-trip');
  if (time) adhocStartTime = time;
  _doSetTrip(routeId, from, to, dir, jid);
  go('s-main');
}

function renderAdhocDutyList() {
  var list = document.getElementById('trip-event-list');
  if (!list) return;
  list.innerHTML = '';

  if (editorRoutes.length) {
    var lbl = document.createElement('div'); lbl.className = 'slbl'; lbl.textContent = 'Services';
    list.appendChild(lbl);
    editorRoutes.forEach(function(route) {
      var fs = route.fareStages || [];
      var item = document.createElement('div');
      item.className = 'li';
      item.innerHTML = '<div><div class="ln">' + route.name + '</div>'
        + '<div class="ls">' + (fs[0] || '') + ' – ' + (fs[fs.length - 1] || '') + '</div></div>'
        + '<div class="la">›</div>';
      item.onclick = (function(rid) {
        return function() { _openAdhocTripModal(rid); };
      })(route.id);
      list.appendChild(item);
    });
  }

  var lbl2 = document.createElement('div'); lbl2.className = 'slbl'; lbl2.textContent = 'Other events';
  list.appendChild(lbl2);

  var deadItem = document.createElement('div');
  deadItem.className = 'li dead';
  deadItem.innerHTML = '<div><div class="ln" style="color:#c0392b;">Dead run</div><div class="ls">Not in service</div></div><div class="la" style="color:#c0392b;">›</div>';
  deadItem.onclick = function() { startDeadRun({}); };
  list.appendChild(deadItem);

  var brkItem = document.createElement('div');
  brkItem.className = 'li brk';
  brkItem.innerHTML = '<div><div class="ln" style="color:#1e8449;">Break</div><div class="ls">Driver break</div></div><div class="la" style="color:#1e8449;">›</div>';
  brkItem.onclick = function() { startBreak({}); };
  list.appendChild(brkItem);

  var fuelItem = document.createElement('div');
  fuelItem.className = 'li';
  fuelItem.innerHTML = '<div><div class="ln">Fuel</div><div class="ls">Record fuel stop</div></div><div class="la">›</div>';
  fuelItem.onclick = function() { startFuel(); };
  list.appendChild(fuelItem);
}

function startAdhocModal() {
  recordTripEnd();
  renderLiveRouteList();
  go('s-route');
}

function openTripNotes() {
  var inp = document.getElementById('trip-notes-inp');
  if (inp) inp.value = currentTripNotes;
  showModal('m-trip-notes');
}

function saveTripNotes() {
  var inp = document.getElementById('trip-notes-inp');
  currentTripNotes = inp ? inp.value.trim() : '';
  updateTripNotesSub();
  hideModal('m-trip-notes');
}

function updateTripNotesSub() {
  var sub = document.getElementById('trip-notes-sub');
  if (sub) sub.textContent = currentTripNotes ? currentTripNotes.substring(0, 40) + (currentTripNotes.length > 40 ? '…' : '') : 'No notes added';
}

function updateVimDonation() {
  var activeTarget = editorDonationTargets.find(function(t) { return t.active; });
  var today = todayStr();
  var totalDon = 0;
  if (activeTarget) {
    historyData.forEach(function(h) {
      if (h.type === 'trip' && h.date === today) totalDon += (h.donRev || 0);
    });
    tripTicketsSold.forEach(function(s) {
      if (s && s.group === 'donations') totalDon += s.revenue;
    });
  }
  var percent = activeTarget ? Math.min(100, Math.round((totalDon / activeTarget.amount) * 100)) : 0;
  var pctTxt = activeTarget ? percent + '%' : '—';

  [
    ['vim-donation-bar',    'vim-donation-pct'],
    ['deadrun-donation-bar','deadrun-donation-pct'],
    ['break-donation-bar',  'break-donation-pct']
  ].forEach(function(pair) {
    var bar = document.getElementById(pair[0]);
    var pct = document.getElementById(pair[1]);
    if (bar) bar.style.width = (activeTarget ? percent : 0) + '%';
    if (pct) pct.textContent = pctTxt;
  });

  if (activeTarget && percent >= 100 && !_donationBannerShown) {
    _donationBannerShown = true;
    showDonationBanner();
  }
}

function showDonationBanner() {
  var banner = document.getElementById('donation-banner');
  if (!banner) return;
  banner.style.display = 'block';
  banner.style.opacity = '1';
  setTimeout(function() {
    banner.style.transition = 'opacity 1s';
    banner.style.opacity = '0';
    setTimeout(function() {
      banner.style.display = 'none';
      banner.style.transition = '';
      banner.style.opacity = '1';
    }, 1000);
  }, 4000);
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
    ['dl-clock', ts], ['dl-date', ds],
    ['dr-clock', ts], ['dr-date', ds],
    ['brk-clock', ts], ['brk-date', ds]
  ];
  ids.forEach(function(p) {
    var e = document.getElementById(p[0]);
    if (e) e.textContent = p[1];
  });

  var tdt = document.getElementById('tp-dt');
  if (tdt) tdt.textContent = 'Date:    ' + dd + '/' + mo + '/' + yyyy + '\nTime:    ' + ts;
  updateVimStops();
  refreshTimetableClock();
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

// ── AD-HOC ROUTE & DIRECTION SCREENS ──
function renderLiveRouteList() {
  var list = document.getElementById('route-list-live');
  if (!list) return;
  list.innerHTML = '';
  if (!editorRoutes.length) return;

  var addItem = function(route) {
    var fs = route.fareStages;
    var item = document.createElement('div');
    item.className = 'li';
    item.innerHTML = '<div><div class="ln">' + route.name + '</div>'
      + '<div class="ls">' + (fs[0] || '') + ' – ' + (fs[fs.length - 1] || '') + '</div></div>'
      + '<div class="la">›</div>';
    item.onclick = (function(id) {
      return function() { _openAdhocTripModal(id); };
    })(route.id);
    list.appendChild(item);
  };

  var defLbl = document.createElement('div');
  defLbl.className = 'slbl';
  defLbl.textContent = 'Default';
  list.appendChild(defLbl);
  addItem(editorRoutes[0]);

  if (editorRoutes.length > 1) {
    var allLbl = document.createElement('div');
    allLbl.className = 'slbl';
    allLbl.textContent = 'All routes';
    list.appendChild(allLbl);
    editorRoutes.slice(1).forEach(addItem);
  }
}

function renderDirectionList() {
  var list = document.getElementById('direction-list-live');
  if (!list) return;
  var route = editorRoutes.find(function(r) { return r.id === currentRoute; });
  if (!route) return;

  var hdrSub = document.querySelector('#s-direction .blue-hdr div:first-child');
  if (hdrSub) hdrSub.textContent = route.name + ' – ad-hoc';

  var fs = route.fareStages;
  var from1 = fs[0] || '', to1 = fs[fs.length - 1] || '';
  var from2 = to1, to2 = from1;

  list.innerHTML = '<div class="slbl">Direction</div>';

  var addDir = function(label, from, to, dir) {
    var item = document.createElement('div');
    item.className = 'li';
    item.innerHTML = '<div><div class="ln">' + label + '</div>'
      + '<div class="ls">' + from + ' → ' + to + '</div></div><div class="la">›</div>';
    item.onclick = function() { setTrip(route.id, from, to, dir); go('s-main'); };
    list.appendChild(item);
  };
  addDir(route.dir1, from1, to1, route.dir1);
  addDir(route.dir2, from2, to2, route.dir2);
}

// ── DUTIES / TRIP LIST ──
var currentDutyId = '';

function renderLiveDutyList() {
  var list = document.getElementById('live-duty-list');
  if (!list) return;
  list.innerHTML = '';
  if (!editorDuties.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:#aaa;font-size:13px;">No duties configured</div>';
    return;
  }
  var lbl = document.createElement('div');
  lbl.className = 'slbl'; lbl.textContent = 'Available duties';
  list.appendChild(lbl);
  editorDuties.forEach(function(duty) {
    var item = document.createElement('div');
    item.className = 'li';
    var typeLabel = duty.type === 'running' ? 'Running board' : 'Duty board';
    item.innerHTML = '<div><div class="ln">' + duty.name + '</div>'
      + '<div class="ls">' + typeLabel + (duty.description ? ' – ' + duty.description : '') + ' · ' + duty.events.length + ' events</div></div>'
      + '<div class="la">›</div>';
    item.onclick = (function(id) {
      return function() {
        currentDutyId = id;
        setDuty(true);
        renderTripList();
        go('s-trip');
      };
    })(duty.id);
    list.appendChild(item);
  });
}

function renderTripList() {
  var list = document.getElementById('trip-event-list');
  if (!list) return;
  var duty = editorDuties.find(function(d) { return d.id === currentDutyId; });
  var hdrLbl = document.querySelector('#s-trip .blue-hdr div:first-child > div:first-child');
  if (hdrLbl) hdrLbl.textContent = duty ? duty.name + (duty.description ? ' – ' + duty.description : '') : 'Select a duty';
  list.innerHTML = '';
  if (!duty || !duty.events.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:#aaa;font-size:13px;">No events in this duty</div>';
    return;
  }
  var lbl = document.createElement('div');
  lbl.className = 'slbl'; lbl.textContent = 'Scheduled events';
  list.appendChild(lbl);
  duty.events.forEach(function(ev, evIdx) {
    var item = document.createElement('div');
    if (ev.type === 'trip') {
      var route = editorRoutes.find(function(r) { return r.id === ev.routeId; });
      var fs = route ? route.fareStages : [];
      var dLow = (ev.direction || '').toLowerCase();
      var out = dLow.includes('out') || dLow.includes('south') || dLow.includes('west') || dLow.includes('anti');
      var from = out ? (fs[fs.length - 1] || '') : (fs[0] || '');
      var to   = out ? (fs[0] || '') : (fs[fs.length - 1] || '');
      item.className = 'li';
      item.innerHTML = '<div><div class="ln">' + (ev.journeyId ? ev.journeyId + ' – ' : '') + (route ? route.name : ev.routeId) + ' ' + ev.direction + '</div>'
        + '<div class="ls">' + from + ' → ' + to + (ev.startTime ? ' · ' + ev.startTime : '') + '</div></div>'
        + '<div class="la">›</div>';
      item.onclick = (function(rid, f, t, d, jid, idx) {
        return function() { currentEventIndex = idx; setTrip(rid, f, t, d, jid); go('s-main'); };
      })(ev.routeId, from, to, ev.direction, ev.journeyId, evIdx);
    } else if (ev.type === 'dead') {
      item.className = 'li dead';
      item.innerHTML = '<div><div class="ln" style="color:#c0392b;">Dead run' + (ev.notes ? ' – ' + ev.notes : '') + '</div>'
        + '<div class="ls">Not in service' + (ev.startTime ? ' · ' + ev.startTime : '') + '</div></div>'
        + '<div class="la" style="color:#c0392b;">›</div>';
      item.onclick = (function(e, idx) { return function() { currentEventIndex = idx; startDeadRun(e); }; })(ev, evIdx);
    } else if (ev.type === 'break') {
      item.className = 'li brk';
      item.innerHTML = '<div><div class="ln" style="color:#1e8449;">Break' + (ev.duration ? ' – ' + ev.duration + ' mins' : '') + '</div>'
        + '<div class="ls">Driver break' + (ev.startTime ? ' · ' + ev.startTime : '') + '</div></div>'
        + '<div class="la" style="color:#1e8449;">›</div>';
      item.onclick = (function(e, idx) { return function() { currentEventIndex = idx; startBreak(e); }; })(ev, evIdx);
    } else if (ev.type === 'fuel') {
      item.className = 'li';
      item.innerHTML = '<div><div class="ln">Fuel log</div>'
        + '<div class="ls">Record fuel usage' + (ev.startTime ? ' · ' + ev.startTime : '') + '</div></div>'
        + '<div class="la">›</div>';
      item.onclick = (function(idx) { return function() { currentEventIndex = idx; startFuel(); }; })(evIdx);
    }
    list.appendChild(item);
  });
  updateNextEventButton();
}

function updateNextEventButton() {
  var el = document.getElementById('next-trip-item');
  var sub = document.getElementById('ntsub');
  if (!el) return;
  if (!hasDuty) { el.classList.add('grey'); return; }
  var duty = editorDuties.find(function(d) { return d.id === currentDutyId; });
  var isLast = !duty || currentEventIndex >= duty.events.length - 1;
  if (isLast) {
    el.classList.add('grey');
    if (sub) sub.textContent = currentEventIndex >= 0 ? 'No more events in this duty' : 'No duty event selected yet';
  } else {
    el.classList.remove('grey');
    if (sub) sub.textContent = 'Ends current event, begins next in duty';
  }
}

function startNextEvent() {
  var duty = editorDuties.find(function(d) { return d.id === currentDutyId; });
  if (!duty || !hasDuty) return;
  var nextIdx = currentEventIndex + 1;
  if (nextIdx >= duty.events.length) return;
  var ev = duty.events[nextIdx];
  currentEventIndex = nextIdx;
  if (ev.type === 'trip') {
    var route = editorRoutes.find(function(r) { return r.id === ev.routeId; });
    var fs = route ? route.fareStages : [];
    var dLow = (ev.direction || '').toLowerCase();
    var out = dLow.includes('out') || dLow.includes('south') || dLow.includes('west') || dLow.includes('anti');
    var from = out ? (fs[fs.length - 1] || '') : (fs[0] || '');
    var to   = out ? (fs[0] || '') : (fs[fs.length - 1] || '');
    setTrip(ev.routeId, from, to, ev.direction, ev.journeyId);
    go('s-main');
  } else if (ev.type === 'dead') {
    startDeadRun(ev);
  } else if (ev.type === 'break') {
    startBreak(ev);
  } else if (ev.type === 'fuel') {
    startFuel();
  }
  updateNextEventButton();
}

// ── GPS / TRACKING ──
function haversineM(p1, p2) {
  var R = 6371000;
  var dLat = (p2.lat - p1.lat) * Math.PI / 180;
  var dLng = (p2.lng - p1.lng) * Math.PI / 180;
  var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
          Math.cos(p1.lat*Math.PI/180)*Math.cos(p2.lat*Math.PI/180)*
          Math.sin(dLng/2)*Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function speedConvFactor() {
  return appConfig.units.speed === 'mph' ? 2.23694 : 3.6;
}
function speedUnit() { return appConfig.units.speed === 'mph' ? 'mph' : 'km/h'; }
function distConvFactor() { return appConfig.units.distance === 'miles' ? (1 / 1609.344) : (1 / 1000); }
function distUnit() { return appConfig.units.distance === 'miles' ? 'mi' : 'km'; }
function altUnit() { return 'm'; }
function fuelUnit() { return appConfig.units.fuel; }

function refreshUnitsDisplay() {
  currentSpeed = currentSpeedMs != null ? Math.round(currentSpeedMs * speedConvFactor()) : null;
  updateVimGPS();
  updateMapOverlay();
}

function startGPSTracking() {
  if (!navigator.geolocation || gpsWatchId !== null) return;
  updateGpsPill('searching');
  gpsWatchId = navigator.geolocation.watchPosition(onGPSUpdate, onGPSError, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 15000
  });
}

function onGPSUpdate(pos) {
  var c = pos.coords;
  var point = { lat: c.latitude, lng: c.longitude, alt: c.altitude, time: pos.timestamp };
  currentAlt     = (c.altitude != null && c.altitudeAccuracy != null) ? Math.round(c.altitude) : null;
  currentSpeedMs = c.speed != null ? c.speed : null;
  currentSpeed   = currentSpeedMs != null ? Math.round(currentSpeedMs * speedConvFactor()) : null;

  if (lastGPSPoint) currentTripDistance += haversineM(lastGPSPoint, point);
  lastGPSPoint = point;
  currentTrail.push(point);

  if ((c.accuracy || 9999) <= 300) updateGpsPill('active');
  updateLiveMapMarker(point);
  updateVimGPS();
  updateMapOverlay();
  checkStopAndTimetable(point);

  var status = document.getElementById('map-gps-status');
  if (status) status.textContent = 'GPS active';
}

function onGPSError(err) {
  updateGpsPill('error');
  var status = document.getElementById('map-gps-status');
  if (status) status.textContent = 'No GPS signal';
}

function updateGpsPill(state) {
  _gpsState = state;
  var colors = { searching: '#f0a500', active: '#4caf50', error: '#c0392b' };
  var labels = { searching: 'Searching', active: 'Active', error: 'No signal' };
  var c = colors[state] || '#f0a500';
  var lbl = labels[state] || 'GPS';
  var html = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none">'
    + '<circle cx="7" cy="7" r="5.5" stroke="' + c + '" stroke-width="1.2"/>'
    + '<ellipse cx="7" cy="7" rx="2.2" ry="5.5" stroke="' + c + '" stroke-width="1.2"/>'
    + '<line x1="1.5" y1="7" x2="12.5" y2="7" stroke="' + c + '" stroke-width="1.2"/>'
    + '</svg><div class="s2"><span style="font-size:9px;color:' + c + ';">GPS</span><span style="font-size:9px;color:' + c + ';">' + lbl + '</span></div>';
  document.querySelectorAll('.gps-pill').forEach(function(el) { el.innerHTML = html; });
}

function showGpsStatus() {
  var content = document.getElementById('gps-status-content');
  if (content) {
    if (_gpsState === 'active') {
      content.innerHTML = '<div style="font-size:36px;color:#4caf50;line-height:1;">✓</div>'
        + '<div style="font-size:16px;font-weight:700;color:#222;margin-top:8px;">GPS Okay</div>'
        + '<div style="font-size:12px;color:#888;margin-top:4px;">Location is being tracked</div>';
    } else if (_gpsState === 'error') {
      content.innerHTML = '<div style="font-size:36px;color:#c0392b;line-height:1;">✕</div>'
        + '<div style="font-size:16px;font-weight:700;color:#222;margin-top:8px;">GPS Fault</div>'
        + '<div style="font-size:12px;color:#888;margin-top:4px;">Unable to access location</div>';
    } else {
      content.innerHTML = '<div style="width:32px;height:32px;border:3px solid #f0a500;border-top-color:transparent;border-radius:50%;animation:gps-spin 0.8s linear infinite;margin:0 auto 10px;"></div>'
        + '<div style="font-size:16px;font-weight:700;color:#222;">Can\'t find GPS</div>'
        + '<div style="font-size:12px;color:#888;margin-top:4px;">Waiting for location signal…</div>';
    }
  }
  showModal('m-gps-status');
}

function updateTimetableClock(status) {
  var ick = document.getElementById('m-ick');
  var statusEl = document.getElementById('m-tt-status');
  if (!ick) return;
  var cfg = appConfig;
  var bgColors = { ontime: cfg.ontime.color, late: cfg.late.color, early: cfg.early.color, matched: cfg.matched.color, unmatched: cfg.unmatched.color };
  var labels   = { ontime: 'On time', late: 'Late', early: 'Early', matched: 'Matched', unmatched: 'Unmatched' };
  var fontCol  = cfg.clockFont === 'black' ? '#111111' : '#ffffff';
  ick.style.background = (status && bgColors[status]) ? bgColors[status] : '';
  var timeEl = ick.querySelector('.ct');
  var dateEl = ick.querySelector('.cd');
  if (timeEl) timeEl.style.color = status ? fontCol : '';
  if (dateEl) dateEl.style.color = status ? (fontCol === '#ffffff' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)') : '';
  if (statusEl) {
    statusEl.textContent = status ? (labels[status] || '') : '';
    statusEl.style.color = status ? (fontCol === '#ffffff' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)') : '#e0eeff';
  }
}

function checkStopAndTimetable(point) {
  if (!tripActive || !currentRoute) { updateTimetableClock(null); return; }
  var allStops = getAllDirectionStops();
  var detected = null;
  for (var i = 0; i < allStops.length; i++) {
    var sObj = (typeof editorStops !== 'undefined' ? editorStops : []).find(function(s) { return s.name === allStops[i]; });
    if (!sObj || !sObj.lat || !sObj.lng) continue;
    var dist = haversineM(point, { lat: parseFloat(sObj.lat), lng: parseFloat(sObj.lng) });
    if (dist <= (sObj.radius || 50)) { detected = allStops[i]; break; }
  }
  // Record arrival on first detection of each stop
  if (detected && detected !== _lastDetectedStop) {
    if (!currentTripStopActuals[detected]) {
      currentTripStopActuals[detected] = { arrival: nowHM(), departure: null };
    }
    _lastVisitedStop = detected;
  }
  // Hysteresis: only clear _lastDetectedStop when 2× radius away; record departure
  if (detected) {
    _lastDetectedStop = detected;
  } else if (_lastDetectedStop) {
    var lso = (typeof editorStops !== 'undefined' ? editorStops : []).find(function(s) { return s.name === _lastDetectedStop; });
    if (lso && lso.lat && lso.lng) {
      if (haversineM(point, { lat: parseFloat(lso.lat), lng: parseFloat(lso.lng) }) > (lso.radius || 50) * 2) {
        var dep = currentTripStopActuals[_lastDetectedStop];
        if (dep && !dep.departure) dep.departure = nowHM();
        _lastDetectedStop = null;
      }
    } else { _lastDetectedStop = null; }
  }
  // Update clock status and VIM stop cards
  updateVimStops();
  refreshTimetableClock();
}

function refreshTimetableClock() {
  if (!tripActive) return;
  var ttTrip = getCurrentTimetableTrip();
  if (!ttTrip) { updateTimetableClock('unmatched'); return; }
  // Use _lastDetectedStop so status persists through the hysteresis zone
  var atStop = _lastDetectedStop;
  if (!atStop) { updateTimetableClock('matched'); return; }
  var ttStop = ttTrip.stops.find(function(s) { return s.name === atStop; });
  if (!ttStop || !ttStop.time) { updateTimetableClock('matched'); return; }
  var diff = timeToMins(nowHM()) - timeToMins(ttStop.time);
  if (Math.abs(diff) > 330) { updateTimetableClock('matched'); return; }
  updateTimetableClock(diff > appConfig.late.mins ? 'late' : (diff < -appConfig.early.mins ? 'early' : 'ontime'));
}

function updateVimStops() {
  if (!tripActive) return;
  var stops = getCurrentStops();
  var prevCard = document.getElementById('vim-prev-card');
  var nextCard = document.getElementById('vim-next-card');
  if (!prevCard || !nextCard) return;

  var ttTrip = getCurrentTimetableTrip();
  var prevName = _lastVisitedStop;
  var prevIdx  = (prevName && stops) ? stops.indexOf(prevName) : -1;

  // ── Previous stop ──
  if (prevIdx >= 0) {
    var actuals  = currentTripStopActuals[prevName] || null;
    var arrTime  = actuals ? actuals.arrival   : null;
    var depTime  = actuals ? actuals.departure  : null;
    var ttPrev   = ttTrip ? ttTrip.stops.find(function(s) { return s.name === prevName; }) : null;
    var schTime  = ttPrev  ? ttPrev.time : null;
    var diff     = (arrTime && schTime) ? timeToMins(arrTime) - timeToMins(schTime) : null;
    var stLbl    = diff == null ? '' : (diff > appConfig.late.mins ? 'Late ' + diff + 'm' : (diff < -appConfig.early.mins ? 'Early ' + Math.abs(diff) + 'm' : 'On time'));
    var stCol    = diff == null ? '' : (diff > appConfig.late.mins ? appConfig.late.color : (diff < -appConfig.early.mins ? appConfig.early.color : appConfig.ontime.color));
    var dwellStr = '';
    if (arrTime && !depTime) {
      var dw = timeToMins(nowHM()) - timeToMins(arrTime);
      dwellStr = (dw > 0 ? dw + ' min' : '< 1 min') + ' dwell';
    }
    prevCard.innerHTML = '<div style="font-size:10px;color:#5555aa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Previous stop</div>'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline;">'
      + '<div style="font-size:14px;font-weight:500;color:#c0c0e0;">' + prevName + '</div>'
      + (stLbl ? '<div style="font-size:11px;font-weight:700;color:' + stCol + ';">' + stLbl + '</div>' : '')
      + '</div>'
      + '<div style="font-size:12px;color:#6666aa;margin-top:4px;">'
      + (schTime ? 'Sch: <span style="color:#8888cc;">' + schTime + '</span>' : '')
      + (arrTime ? (schTime ? '&ensp;' : '') + 'Arr: <span style="color:#4caf50;">' + arrTime + '</span>' : '')
      + (depTime ? '&ensp;Dep: <span style="color:#7799ee;">' + depTime + '</span>'
                 : (dwellStr ? '&ensp;<span style="color:#8888aa;">' + dwellStr + '</span>' : ''))
      + '</div>';
  } else {
    prevCard.innerHTML = '<div style="font-size:10px;color:#5555aa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Previous stop</div>'
      + '<div style="font-size:13px;color:#444466;">—</div>';
  }

  // ── Next stop ──
  if (!stops || !stops.length || prevIdx >= stops.length - 1) {
    nextCard.innerHTML = '<div style="font-size:10px;color:#5555aa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Next stop</div>'
      + '<div style="font-size:13px;color:#444466;">—</div>';
    return;
  }
  var nextIdx  = prevIdx + 1;
  var nextName = stops[nextIdx];
  var isTerm   = (nextIdx === stops.length - 1);
  var ttNext   = ttTrip ? ttTrip.stops.find(function(s) { return s.name === nextName; }) : null;
  var nextSch  = ttNext ? ttNext.time : null;
  var estTime  = null;
  if (nextSch) {
    var prevActuals = currentTripStopActuals[prevName];
    var prevArr2    = prevActuals ? prevActuals.arrival : null;
    var ttPrev2     = ttTrip ? ttTrip.stops.find(function(s) { return s.name === prevName; }) : null;
    var prevSch2    = ttPrev2 ? ttPrev2.time : null;
    var diff2       = (prevArr2 && prevSch2) ? timeToMins(prevArr2) - timeToMins(prevSch2) : null;
    if (diff2 != null) {
      var em2 = timeToMins(nextSch) + diff2;
      if (em2 >= 0) estTime = String(Math.floor(em2/60)%24).padStart(2,'0') + ':' + String(em2%60).padStart(2,'0');
    }
  }
  nextCard.innerHTML = '<div style="font-size:10px;color:#5555aa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">'
    + (isTerm ? 'Terminus' : 'Next stop') + '</div>'
    + '<div style="font-size:14px;font-weight:500;color:#c0c0e0;">' + nextName + '</div>'
    + '<div style="font-size:12px;color:#6666aa;margin-top:4px;">'
    + (nextSch ? 'Sch: <span style="color:#8888cc;">' + nextSch + '</span>' : '')
    + (estTime ? (nextSch ? '&ensp;' : '') + 'Est: <span style="color:#c0c0e0;">' + estTime + '</span>' : '')
    + '</div>';
}

function updateVimGPS() {
  var sp  = document.getElementById('dl-speed');
  var alt = document.getElementById('dl-alt');
  var su  = speedUnit(), au = altUnit();
  if (sp)  sp.textContent  = currentSpeed != null ? currentSpeed + ' ' + su : '— ' + su;
  if (alt) alt.textContent = currentAlt   != null ? currentAlt   + ' ' + au : '— ' + au;
}

function updateMapOverlay() {
  var sp   = document.getElementById('map-speed');
  var alt  = document.getElementById('map-alt');
  var dist = document.getElementById('map-dist');
  var su   = speedUnit(), au = altUnit(), du = distUnit();
  if (sp)   sp.textContent   = currentSpeed != null ? currentSpeed + ' ' + su : '— ' + su;
  if (alt)  alt.textContent  = currentAlt   != null ? currentAlt   + ' ' + au : '— ' + au;
  if (dist) dist.textContent = (currentTripDistance * distConvFactor()).toFixed(2) + ' ' + du;
}

function openLiveMap() {
  go('s-map');
  setTimeout(initLiveMap, 120);
}

function initLiveMap() {
  var container = document.getElementById('live-map-container');
  if (!container) return;

  if (!liveMapInst) {
    liveMapInst = L.map('live-map-container', { zoomControl: true, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(liveMapInst);
    liveTrailLine = L.polyline([], { color: '#4a90d9', weight: 5, opacity: 0.9 }).addTo(liveMapInst);
    var busIcon = L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;background:#4a90d9;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(74,144,217,0.8);"></div>',
      iconSize: [14, 14], iconAnchor: [7, 7]
    });
    // Start with hidden marker — only shown once GPS provides a real fix
    liveMarker = L.marker([53.0, -1.5], { icon: busIcon, opacity: 0, zIndexOffset: 1000 }).addTo(liveMapInst);
    liveMapInst.setView([53.0, -1.5], 13);
    // Pan to actual position as soon as geolocation responds
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        if (!liveMapInst || currentTrail.length > 0) return;
        var lat = pos.coords.latitude, lng = pos.coords.longitude;
        liveMarker.setLatLng([lat, lng]);
        liveMarker.setOpacity(1);
        liveMapInst.setView([lat, lng], 15);
      }, null, { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 });
    }
  } else {
    liveMapInst.invalidateSize();
  }

  if (currentTrail.length > 0) {
    var lls = currentTrail.map(function(p) { return [p.lat, p.lng]; });
    liveTrailLine.setLatLngs(lls);
    var last = currentTrail[currentTrail.length - 1];
    liveMarker.setLatLng([last.lat, last.lng]);
    liveMapInst.setView([last.lat, last.lng], liveMapInst.getZoom() || 15);
  }
  addRouteStopsToLiveMap();
  updateMapOverlay();
}

function addRouteStopsToLiveMap() {
  liveStopMarkers.forEach(function(m) { m.remove(); });
  liveStopMarkers = [];
  if (!liveMapInst || !currentRoute) return;

  var ttTrip = getCurrentTimetableTrip();
  var currentStopName = (getCurrentStops() || [])[currentStopIndex] || '';

  var stopsToShow; // [{name, time, isTimingPoint}]
  if (ttTrip && ttTrip.stops && ttTrip.stops.length) {
    // Only stops that have a time entered
    stopsToShow = ttTrip.stops.filter(function(s) { return s.time && s.time.trim(); });
  } else {
    // No timetable: show all direction stops
    var route = editorRoutes.find(function(r) { return r.id === currentRoute; });
    if (!route || !route.stops) return;
    var dir = isOutbound() ? 'outbound' : 'inbound';
    var stopsData = route.stops[dir] || {};
    var stages = getCurrentFareStages();
    var seen = [];
    stopsToShow = [];
    stages.forEach(function(stage) {
      (stopsData[stage] || []).forEach(function(n) {
        if (seen.indexOf(n) < 0) { seen.push(n); stopsToShow.push({ name: n, time: '' }); }
      });
    });
  }

  var bearingMap = { N:0, NE:45, E:90, SE:135, S:180, SW:225, W:270, NW:315 };

  stopsToShow.forEach(function(s) {
    var stopObj = typeof editorStops !== 'undefined'
      ? editorStops.find(function(e) { return e.name === s.name; }) : null;
    if (!stopObj || !stopObj.lat || !stopObj.lng) return;
    var lat = parseFloat(stopObj.lat), lng = parseFloat(stopObj.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    var isCurrent = s.name === currentStopName;
    var ttLabel = s.time ? ' · ' + s.time : '';
    var isTP = s.isTimingPoint;

    // Get bearing (number or legacy string)
    var stopDir = stopObj.direction;
    var bearing = null;
    if (stopDir != null && stopDir !== 'any') {
      bearing = typeof stopDir === 'number' ? stopDir : (bearingMap[stopDir] != null ? bearingMap[stopDir] : null);
    }

    var m;
    if (bearing != null) {
      var sz = isCurrent ? 36 : 30;
      var dotR = isCurrent ? 9 : 7;
      var dotFill = isCurrent ? '#2c5f9e' : '#fff';
      var dotStroke = '#1a3f7a';
      var arrowFill = isTP ? '#2c5f9e' : '#888';
      var svg = '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">'
        + '<circle cx="20" cy="20" r="' + dotR + '" fill="' + dotFill + '" stroke="' + dotStroke + '" stroke-width="2"/>'
        + '<g transform="rotate(' + bearing + ',20,20)">'
        + '<polygon points="20,4 16,15 20,12 24,15" fill="' + arrowFill + '"/>'
        + '</g></svg>';
      m = L.marker([lat, lng], {
        icon: L.divIcon({ html: svg, iconSize: [sz, sz], iconAnchor: [sz/2, sz/2], className: '' })
      }).addTo(liveMapInst);
    } else {
      m = L.circleMarker([lat, lng], {
        radius: isCurrent ? 8 : 6,
        color: '#2c5f9e', weight: 2,
        fillColor: isCurrent ? '#2c5f9e' : '#fff',
        fillOpacity: isCurrent ? 1 : 0.9
      }).addTo(liveMapInst);
    }

    m.bindTooltip(s.name + ttLabel, { permanent: isTP, direction: 'top', offset: [0, -8], className: isTP ? 'tp-label' : '' });
    liveStopMarkers.push(m);
  });
}

function updateLiveMapMarker(point) {
  if (!liveMapInst || !liveTrailLine || !liveMarker) return;
  var lls = liveTrailLine.getLatLngs();
  lls.push([point.lat, point.lng]);
  liveTrailLine.setLatLngs(lls);
  liveMarker.setLatLng([point.lat, point.lng]);
  if (!_gpsFirstFix) {
    _gpsFirstFix = true;
    liveMarker.setOpacity(1);
    liveMapInst.setView([point.lat, point.lng], liveMapInst.getZoom() || 15);
  }
  var mapScreen = document.getElementById('s-map');
  if (mapScreen && mapScreen.classList.contains('active')) {
    liveMapInst.panTo([point.lat, point.lng]);
  }
}

function showTripMap(trail) {
  var container = document.getElementById('trip-map-container');
  if (!container) return;
  if (!trail || trail.length < 2) { container.style.display = 'none'; return; }

  container.style.display = 'block';
  if (tripMapInst) { tripMapInst.remove(); tripMapInst = null; }

  setTimeout(function() {
    tripMapInst = L.map('trip-map-container', {
      zoomControl: false, attributionControl: false,
      dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(tripMapInst);
    var lls = trail.map(function(p) { return [p.lat, p.lng]; });
    var line = L.polyline(lls, { color: '#2c5f9e', weight: 4 }).addTo(tripMapInst);
    L.circleMarker(lls[0], { radius: 7, fillColor: '#27ae60', fillOpacity: 1, color: '#fff', weight: 2 }).addTo(tripMapInst);
    L.circleMarker(lls[lls.length - 1], { radius: 7, fillColor: '#c0392b', fillOpacity: 1, color: '#fff', weight: 2 }).addTo(tripMapInst);
    tripMapInst.fitBounds(line.getBounds(), { padding: [20, 20] });
  }, 60);
}

// ── INIT ──
function liveInit() {
  renderV();
  renderLiveRouteList();
  renderLiveDutyList();
  renderTicketTabs();
  renderTicketGrid();
  setDuty(false);
  updateGpsPill('searching');
  tick();
  setInterval(tick, 1000);
  loadWeather();
  renderHistory();
  startGPSTracking();

  document.addEventListener('keydown', function(e) {
    var main = document.getElementById('s-main');
    if (!main || !main.classList.contains('active')) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    var edRoute = editorRoutes.find(function(r) { return r.id === currentRoute; });
    var allTickets = edRoute && edRoute.tickets ? edRoute.tickets : [];
    var groupTickets = allTickets.filter(function(rt) {
      var tt = editorTicketTypes.find(function(t) { return t.name === rt.name; });
      return (tt && tt.group ? tt.group : 'donations') === currentTicketGroup;
    });
    var totalPages = Math.max(1, Math.ceil(groupTickets.length / 4));
    if (e.key === 'ArrowRight' && currentTicketPage < totalPages - 1) { currentTicketPage++; renderTicketGrid(); updateFarePrices(); }
    if (e.key === 'ArrowLeft'  && currentTicketPage > 0)              { currentTicketPage--; renderTicketGrid(); updateFarePrices(); }
  });
}
