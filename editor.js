/* ═══════════════════════════════════════
   Rali-Clipper v0.01 — editor.js
   Editor side JavaScript
═══════════════════════════════════════ */

// ── EDITOR STATE ──
var edPinSet = false;
var edPin = '';
var edPinNew = '';
var edPinConfV = '';
var epeV = '';
var currentEditFsEl = null;
var BASE_MAX = 3.00;

// ── EDITOR DATA ──
// This is the source of truth for routes, fare stages, stops etc.
// In future this will sync with a backend/Supabase.

var editorFareStages = ['Depot', 'Town Hall', 'Market Place'];

var editorStops = [
  { name: 'Depot',                       lat: '',           lng: '',          direction: null, radius: 50 },
  { name: 'Library',                     lat: '',           lng: '',          direction: null, radius: 50 },
  { name: 'Town Hall',                   lat: '',           lng: '',          direction: null, radius: 50 },
  { name: 'Bus Stop',                    lat: '',           lng: '',          direction: null, radius: 50 },
  { name: 'Market Place',                lat: '',           lng: '',          direction: null, radius: 50 },
  { name: 'Home',                         lat: '53.207185',  lng: '-1.417013', direction: 180,  radius: 60 },
  { name: 'Holmewood Village',            lat: '53.193500',  lng: '-1.414200', direction: 180,  radius: 50 },
  { name: 'Heath, Crown Inn',             lat: '53.181000',  lng: '-1.403000', direction: 180,  radius: 50 },
  { name: 'Stretton, Badger Box',         lat: '53.169500',  lng: '-1.395000', direction: 180,  radius: 50 },
  { name: 'Clay Cross, High Street',      lat: '53.160000',  lng: '-1.402000', direction: 180,  radius: 60 },
  { name: 'Shirland, White Horse',        lat: '53.137000',  lng: '-1.390000', direction: 180,  radius: 50 },
  { name: 'South Normanton, Hall Lane',   lat: '53.116000',  lng: '-1.381000', direction: 180,  radius: 50 },
  { name: 'Alfreton Bus Station',         lat: '53.099000',  lng: '-1.381000', direction: null, radius: 70 }
];

var editorTicketGroups = [
  { id: 'donations',  name: 'Donations',  mandatory: true  },
  { id: 'passes',     name: 'Passes',     mandatory: false },
  { id: 'day',        name: 'Day Riders', mandatory: false },
  { id: 'weekly',     name: 'Weekly',     mandatory: false },
  { id: 'concession', name: 'Concession', mandatory: false },
  { id: 'group',      name: 'Group',      mandatory: false }
];

var editorTicketTypes = [
  { name: 'Adult Single',    group: 'donations'  },
  { name: 'Child Single',    group: 'donations'  },
  { name: 'Adult donation',  group: 'donations'  },
  { name: 'Child donation',  group: 'donations'  },
  { name: 'Family donation', group: 'donations'  },
  { name: 'Gift Aid adult',  group: 'donations'  },
  { name: 'Gift Aid child',  group: 'donations'  },
  { name: 'Gift Aid family', group: 'donations'  },
  { name: 'Heritage pass',   group: 'passes'     },
  { name: 'Day rider',       group: 'day'        },
  { name: 'Weekly pass',     group: 'weekly'     },
  { name: 'Concession',      group: 'concession' },
  { name: 'Group ticket',    group: 'group'      }
];

var editorRoutes = [
  {
    id: 'r1',
    name: '173',
    dirType: 'io',
    dir1: 'Inbound',
    dir2: 'Outbound',
    notes: '',
    fareStages: ['Depot', 'Town Hall', 'Market Place'],
    tickets: [
      { name: 'Adult Single', fareType: 'chart', chart: {
          'Depot→Depot': 1.00,
          'Town Hall→Depot': 2.00,      'Town Hall→Town Hall': 1.00,
          'Market Place→Depot': 3.00,   'Market Place→Town Hall': 2.00,  'Market Place→Market Place': 1.00
      }},
      { name: 'Child Single', fareType: 'chart', chart: {
          'Depot→Depot': 0.50,
          'Town Hall→Depot': 1.00,      'Town Hall→Town Hall': 0.50,
          'Market Place→Depot': 1.50,   'Market Place→Town Hall': 1.00,  'Market Place→Market Place': 0.50
      }},
      { name: 'Adult donation', fareType: 'flat', price: 2.00 },
      { name: 'Child donation', fareType: 'flat', price: 1.00 }
    ],
    stops: {
      inbound: {
        'Depot':        ['Depot'],
        'Town Hall':    ['Library', 'Town Hall'],
        'Market Place': ['Bus Stop', 'Market Place']
      },
      outbound: {
        'Market Place': ['Market Place', 'Bus Stop'],
        'Town Hall':    ['Town Hall', 'Library'],
        'Depot':        ['Depot']
      }
    }
  },
  {
    id: 'r2',
    name: 'Heritage',
    dirType: 'io',
    dir1: 'Inbound',
    dir2: 'Outbound',
    notes: '',
    fareStages: ['Start', 'Finish'],
    tickets: [
      { name: 'Adult donation',  fareType: 'flat', price: 2.00 },
      { name: 'Child donation',  fareType: 'flat', price: 1.00 },
      { name: 'Family donation', fareType: 'flat', price: 5.00 },
      { name: 'Gift Aid adult',  fareType: 'flat', price: 2.50 },
      { name: 'Gift Aid child',  fareType: 'flat', price: 1.25 },
      { name: 'Gift Aid family', fareType: 'flat', price: 6.25 },
      { name: 'Heritage pass',   fareType: 'flat', price: 10.00 },
      { name: 'Day rider',       fareType: 'flat', price: 5.00  },
      { name: 'Weekly pass',     fareType: 'flat', price: 20.00 },
      { name: 'Concession',      fareType: 'flat', price: 1.50  },
      { name: 'Group ticket',    fareType: 'flat', price: 8.00  }
    ],
    stops: {
      inbound:  { 'Start': ['Start'],  'Finish': ['Finish'] },
      outbound: { 'Finish': ['Finish'], 'Start': ['Start']  }
    }
  },
  {
    id: 'r3',
    name: 'C55',
    dirType: 'ns',
    dir1: 'Northbound',
    dir2: 'Southbound',
    notes: 'Home to Alfreton Bus Station via A61',
    fareStages: ['Alfreton', 'Clay Cross', 'Home'],
    tickets: [
      { name: 'Adult Single', fareType: 'chart', chart: {
          'Home→Home':           1.50,
          'Home→Clay Cross':     2.80,
          'Home→Alfreton':       4.20,
          'Clay Cross→Clay Cross': 1.50,
          'Clay Cross→Alfreton': 3.00,
          'Alfreton→Alfreton':   1.50
      }},
      { name: 'Child Single', fareType: 'chart', chart: {
          'Home→Home':           0.80,
          'Home→Clay Cross':     1.40,
          'Home→Alfreton':       2.10,
          'Clay Cross→Clay Cross': 0.80,
          'Clay Cross→Alfreton': 1.50,
          'Alfreton→Alfreton':   0.80
      }},
      { name: 'Adult Return',  fareType: 'flat', price: 7.00  },
      { name: 'Child Return',  fareType: 'flat', price: 3.50  },
      { name: 'Day rider',     fareType: 'flat', price: 5.50  },
      { name: 'Concession',    fareType: 'flat', price: 1.50  },
      { name: 'Group ticket',  fareType: 'flat', price: 9.00  }
    ],
    stops: {
      outbound: {
        'Home':       ['Home', 'Holmewood Village'],
        'Clay Cross': ['Heath, Crown Inn', 'Stretton, Badger Box', 'Clay Cross, High Street'],
        'Alfreton':   ['Shirland, White Horse', 'South Normanton, Hall Lane', 'Alfreton Bus Station']
      },
      inbound: {
        'Alfreton':   ['Alfreton Bus Station', 'South Normanton, Hall Lane', 'Shirland, White Horse'],
        'Clay Cross': ['Clay Cross, High Street', 'Stretton, Badger Box', 'Heath, Crown Inn'],
        'Home':       ['Holmewood Village', 'Home']
      }
    }
  }
];

var editorVehicles = [
  { fleet: '1', reg: 'ABC 123D', make: 'AEC Routemaster', capacity: 64 }
];

var editorDuties = [
  {
    id: 'd1',
    name: 'Duty 101',
    type: 'duty',
    description: '',
    events: [
      { type: 'dead',  startTime: '08:00', notes: 'Depot to Town Hall' },
      { type: 'trip',  journeyId: 'T1', startTime: '08:15', routeId: 'r1', direction: 'Inbound' },
      { type: 'trip',  journeyId: 'T2', startTime: '09:30', routeId: 'r1', direction: 'Outbound' },
      { type: 'break', startTime: '10:45', duration: 30 },
      { type: 'fuel',  startTime: '11:30' }
    ]
  },
  {
    id: 'd2',
    name: 'Heritage Duty',
    type: 'duty',
    description: '',
    events: [
      { type: 'dead',  startTime: '09:00', notes: 'Depot to start point' },
      { type: 'trip',  journeyId: 'H1', startTime: '09:30', routeId: 'r2', direction: 'Inbound' },
      { type: 'break', startTime: '11:00', duration: 15 },
      { type: 'trip',  journeyId: 'H2', startTime: '11:20', routeId: 'r2', direction: 'Outbound' },
      { type: 'fuel',  startTime: '13:00' }
    ]
  }
];

var editorDrivers = [
  { name: 'Driver', number: '1001', notes: '' }
];

var editorDonationTargets = [];
var _pendingTargetData = null;

function renderDonationTarget() {
  var cur  = document.getElementById('donatarget-current-section');
  var hist = document.getElementById('donatarget-history-section');
  var sub  = document.getElementById('donatarget-sub');
  var active = editorDonationTargets.find(function(t) { return t.active; });
  if (active) {
    if (sub) sub.textContent = '£' + active.amount.toFixed(2) + ' target active';
    if (cur) cur.innerHTML =
      '<div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px;">Current target</div>'
      + '<div class="card" style="padding:12px 14px;margin-bottom:10px;">'
      + '<div style="font-size:18px;font-weight:700;color:#2c5f9e;">£' + active.amount.toFixed(2) + '</div>'
      + '<div style="font-size:12px;color:#888;margin-top:4px;">' + active.startDate + ' – ' + active.endDate + '</div>'
      + '<button class="btn-sm red" style="margin-top:10px;width:100%;padding:8px;" onclick="closeActiveDonationTarget()">Close this target</button>'
      + '</div>';
  } else {
    if (sub) sub.textContent = 'No active target';
    if (cur) cur.innerHTML = '<div style="font-size:13px;color:#aaa;padding:12px 0 10px;">No active target. Add one below.</div>';
  }
  var past = editorDonationTargets.filter(function(t) { return !t.active; });
  if (hist) {
    if (!past.length) { hist.innerHTML = ''; return; }
    var html = '<div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px;">Past targets</div>';
    past.slice().reverse().forEach(function(t) {
      html += '<div class="card" style="padding:10px 14px;margin-bottom:6px;opacity:0.75;">'
        + '<div style="font-size:15px;font-weight:600;">£' + t.amount.toFixed(2) + '</div>'
        + '<div style="font-size:12px;color:#888;margin-top:2px;">' + t.startDate + ' – ' + t.endDate + '</div>'
        + '</div>';
    });
    hist.innerHTML = html;
  }
}

function saveNewDonationTarget() {
  var amount = parseFloat(document.getElementById('donatarget-amount').value);
  var start  = document.getElementById('donatarget-start').value;
  var end    = document.getElementById('donatarget-end').value;
  if (!amount || !start || !end) { alert('Please fill in all fields.'); return; }
  _pendingTargetData = { amount: amount, startDate: start, endDate: end };
  var hasActive = editorDonationTargets.some(function(t) { return t.active; });
  if (hasActive) {
    hideModal('m-add-donatarget');
    showModal('m-confirm-replace-target');
  } else {
    _commitNewDonationTarget();
    hideModal('m-add-donatarget');
  }
}

function forceNewDonationTarget() {
  closeActiveDonationTarget();
  _commitNewDonationTarget();
  hideModal('m-confirm-replace-target');
}

function _commitNewDonationTarget() {
  if (!_pendingTargetData) return;
  if (typeof _donationBannerShown !== 'undefined') _donationBannerShown = false;
  editorDonationTargets.push({
    id: 'dt-' + Date.now(),
    amount: _pendingTargetData.amount,
    startDate: _pendingTargetData.startDate,
    endDate: _pendingTargetData.endDate,
    active: true
  });
  _pendingTargetData = null;
  renderDonationTarget();
}

function closeActiveDonationTarget() {
  editorDonationTargets.forEach(function(t) { if (t.active) t.active = false; });
  renderDonationTarget();
}

var dirPairs = {
  io: ['Inbound',    'Outbound'      ],
  ns: ['Northbound', 'Southbound'    ],
  ew: ['Eastbound',  'Westbound'     ],
  ca: ['Clockwise',  'Anticlockwise' ]
};

// ── EDITOR ENTRY ──
function editorEntry() {
  if (!edPinSet) {
    edPinNew = '';
    var d = document.getElementById('eps-disp');
    if (d) d.innerHTML = '<span class="ph">Enter new PIN</span>';
    go('s-ed-pinsetup');
  } else {
    epeV = '';
    var d = document.getElementById('epe-disp');
    if (d) d.innerHTML = '<span class="ph">Editor PIN</span>';
    var err = document.getElementById('epe-err');
    if (err) err.style.display = 'none';
    go('s-ed-pinentry');
  }
}

// ── EDITOR PIN SETUP ──
function npEd(v) {
  if (edPinNew.length < 4) edPinNew += v;
  var el = document.getElementById('eps-disp');
  el.innerHTML = edPinNew.length > 0
    ? '<span style="letter-spacing:8px;font-size:28px;">' + '●'.repeat(edPinNew.length) + '</span>'
    : '<span class="ph">Enter new PIN</span>';
}

function npEdBack() {
  edPinNew = edPinNew.slice(0, -1);
  var el = document.getElementById('eps-disp');
  el.innerHTML = edPinNew.length > 0
    ? '<span style="letter-spacing:8px;font-size:28px;">' + '●'.repeat(edPinNew.length) + '</span>'
    : '<span class="ph">Enter new PIN</span>';
}

function edPinSetupNext() {
  if (edPinNew.length === 4) {
    edPinConfV = '';
    var d = document.getElementById('epc-disp');
    if (d) d.innerHTML = '<span class="ph">Confirm PIN</span>';
    var hint = document.getElementById('epc-hint');
    if (hint) { hint.textContent = 'Re-enter your PIN to confirm'; hint.style.color = '#888'; }
    go('s-ed-pinconfirm');
  }
}

function npEdC(v) {
  if (edPinConfV.length < 4) edPinConfV += v;
  var el = document.getElementById('epc-disp');
  el.innerHTML = edPinConfV.length > 0
    ? '<span style="letter-spacing:8px;font-size:28px;">' + '●'.repeat(edPinConfV.length) + '</span>'
    : '<span class="ph">Confirm PIN</span>';
}

function npEdCBack() {
  edPinConfV = edPinConfV.slice(0, -1);
  var el = document.getElementById('epc-disp');
  el.innerHTML = edPinConfV.length > 0
    ? '<span style="letter-spacing:8px;font-size:28px;">' + '●'.repeat(edPinConfV.length) + '</span>'
    : '<span class="ph">Confirm PIN</span>';
}

function edPinConfirm() {
  if (edPinConfV.length === 4) {
    if (edPinConfV === edPinNew) {
      edPin = edPinNew;
      edPinSet = true;
      go('s-ed-home');
    } else {
      var hint = document.getElementById('epc-hint');
      if (hint) { hint.textContent = 'PINs do not match. Try again.'; hint.style.color = '#e74c3c'; }
      edPinConfV = '';
      var el = document.getElementById('epc-disp');
      if (el) el.innerHTML = '<span class="ph">Confirm PIN</span>';
    }
  }
}

function npEpe(v) {
  if (epeV.length < 4) epeV += v;
  var el = document.getElementById('epe-disp');
  el.innerHTML = epeV.length > 0
    ? '<span style="letter-spacing:8px;font-size:28px;">' + '●'.repeat(epeV.length) + '</span>'
    : '<span class="ph">Editor PIN</span>';
}

function npEpeBack() {
  epeV = epeV.slice(0, -1);
  var el = document.getElementById('epe-disp');
  el.innerHTML = epeV.length > 0
    ? '<span style="letter-spacing:8px;font-size:28px;">' + '●'.repeat(epeV.length) + '</span>'
    : '<span class="ph">Editor PIN</span>';
}

function edPinCheck() {
  if (epeV.length === 4) {
    if (epeV === edPin) {
      go('s-ed-home');
    } else {
      var err = document.getElementById('epe-err');
      if (err) err.style.display = 'block';
      epeV = '';
      var el = document.getElementById('epe-disp');
      if (el) el.innerHTML = '<span class="ph">Editor PIN</span>';
    }
  }
}

// ── FARE STAGES ──
function renderFareStageList() {
  var list = document.getElementById('global-fs-list');
  if (!list) return;
  list.innerHTML = '';
  editorFareStages.forEach(function(name, i) {
    var card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '6px';
    card.innerHTML =
      '<div style="display:flex;align-items:center;padding:10px 12px;gap:8px;">'
      + '<span style="flex:1;font-size:14px;font-weight:500;color:#222;">' + name + '</span>'
      + '<button class="btn-sm" onclick="showEditFsModal(' + i + ')">Edit</button>'
      + '<button class="btn-sm red" onclick="deleteFsGlobal(' + i + ')">Delete</button>'
      + '</div>';
    list.appendChild(card);
  });
  // Update count label
  var lbl = document.getElementById('fs-count-lbl');
  if (lbl) lbl.textContent = editorFareStages.length + ' defined';
}

function saveNewFs() {
  var name = document.getElementById('new-fs-name').value.trim();
  if (!name) return;
  editorFareStages.push(name);
  document.getElementById('new-fs-name').value = '';
  renderFareStageList();
  go('s-ed-farestages');
}

function showEditFsModal(i) {
  document.getElementById('edit-fs-input').value = editorFareStages[i];
  document.getElementById('edit-fs-save').onclick = function() {
    var val = document.getElementById('edit-fs-input').value.trim();
    if (val) editorFareStages[i] = val;
    renderFareStageList();
    hideModal('m-ed-editfs');
  };
  showModal('m-ed-editfs');
}

function deleteFsGlobal(i) {
  editorFareStages.splice(i, 1);
  renderFareStageList();
}

// ── STOPS ──
function renderStopList() {
  var list = document.getElementById('global-stop-list');
  if (!list) return;
  list.innerHTML = '';
  editorStops.forEach(function(stop, i) {
    var card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '6px';
    var coordStr = (stop.lat && stop.lng) ? stop.lat + ', ' + stop.lng : 'No coordinates set';
    var metaStr = (stop.radius ? stop.radius + 'm' : '50m') + (stop.direction && stop.direction !== 'any' ? ' · ' + stop.direction : '');
    card.innerHTML =
      '<div style="display:flex;align-items:center;padding:10px 12px;gap:8px;">'
      + '<div style="flex:1;">'
      + '<div style="font-size:14px;font-weight:500;">' + stop.name + '</div>'
      + '<div style="font-size:11px;color:#888;">' + coordStr + '</div>'
      + '<div style="font-size:11px;color:#aaa;">' + metaStr + '</div>'
      + '</div>'
      + '<button class="btn-sm" onclick="openEditStop(' + i + ')">Edit</button>'
      + '<button class="btn-sm red" onclick="deleteStop(' + i + ')">Delete</button>'
      + '</div>';
    list.appendChild(card);
  });
}

function saveNewStop() {
  var name = document.getElementById('new-stop-name').value.trim();
  var lat  = document.getElementById('new-stop-lat').value.trim();
  var lng  = document.getElementById('new-stop-lng').value.trim();
  if (!name || !lat || !lng) { alert('Please enter a stop name, latitude and longitude'); return; }
  var dir = _stopEditBearing; // numeric 0-359 or null
  var radius = parseInt(document.getElementById('new-stop-radius').value) || 50;
  var stopObj = { name: name, lat: lat, lng: lng, direction: dir, radius: radius };
  if (stopEditIdx >= 0) {
    editorStops[stopEditIdx] = stopObj;
  } else {
    editorStops.push(stopObj);
  }
  if (_createStopFromRouteDir) {
    var routeDir = _createStopFromRouteDir;
    var route = editorRoutes[currentRouteIndex];
    var fsSelect = document.getElementById('stop-route-fs-select');
    var stage = fsSelect ? fsSelect.value : ((route && route.fareStages && route.fareStages[0]) || '');
    if (route && stage) {
      if (!route.stops) route.stops = {};
      if (!route.stops[routeDir]) route.stops[routeDir] = {};
      if (!route.stops[routeDir][stage]) route.stops[routeDir][stage] = [];
      if (route.stops[routeDir][stage].indexOf(name) < 0) route.stops[routeDir][stage].push(name);
    }
    _createStopFromRouteDir = null;
    var assignSection = document.getElementById('stop-route-assign-row');
    if (assignSection) assignSection.style.display = 'none';
    currentStopsDir = routeDir;
    renderRouteStops(routeDir);
    go(routeDir === 'inbound' ? 's-ed-instops' : 's-ed-outstops');
    return;
  }
  renderStopList();
  go('s-ed-stops');
}

function deleteStop(i) {
  editorStops.splice(i, 1);
  renderStopList();
}

// ── TICKET TYPES ──
function renderTicketTypeList() {
  var list = document.getElementById('ticket-type-list');
  if (!list) return;
  list.innerHTML = '';
  var lbl = document.getElementById('tt-count-lbl');
  if (lbl) lbl.textContent = editorTicketTypes.length + ' defined';
  editorTicketTypes.forEach(function(tt, i) {
    var grp = editorTicketGroups.find(function(g) { return g.id === tt.group; });
    var grpName = grp ? grp.name : 'Donations';
    var card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '6px';
    card.innerHTML =
      '<div style="display:flex;align-items:center;padding:10px 12px;gap:8px;">'
      + '<div style="flex:1;">'
      + '<div style="font-size:14px;font-weight:500;">' + tt.name + '</div>'
      + '<div style="font-size:11px;color:#888;">' + grpName + '</div>'
      + '</div>'
      + '<button class="btn-sm red" onclick="deleteTicketType(' + i + ')">Delete</button>'
      + '</div>';
    list.appendChild(card);
  });
}

function saveNewTicketType() {
  var name  = document.getElementById('new-tt-name').value.trim();
  var group = (document.getElementById('new-tt-group') || {}).value || 'donations';
  if (!name) return;
  editorTicketTypes.push({ name: name, group: group });
  renderTicketTypeList();
  go('s-ed-tickettypes');
}

function deleteTicketType(i) {
  editorTicketTypes.splice(i, 1);
  renderTicketTypeList();
}

function openAddTicketType() {
  populateGroupSelect('new-tt-group');
  document.getElementById('new-tt-name').value = '';
  go('s-ed-addtickettype');
}

function populateGroupSelect(selId) {
  var sel = document.getElementById(selId);
  if (!sel) return;
  sel.innerHTML = '';
  editorTicketGroups.forEach(function(g) {
    var o = document.createElement('option');
    o.value = g.id; o.textContent = g.name;
    sel.appendChild(o);
  });
  sel.value = 'donations';
}

// ── TICKET GROUPS ──

function renderTicketGroupList() {
  var list = document.getElementById('ticket-group-list');
  if (!list) return;
  list.innerHTML = '';
  var lbl = document.getElementById('tg-count-lbl');
  if (lbl) lbl.textContent = editorTicketGroups.length + ' defined';
  editorTicketGroups.forEach(function(g, i) {
    var card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '6px';
    card.innerHTML =
      '<div style="display:flex;align-items:center;padding:10px 12px;gap:8px;">'
      + '<div style="flex:1;">'
      + '<div style="font-size:14px;font-weight:500;">' + g.name + '</div>'
      + (g.mandatory ? '<div style="font-size:11px;color:#888;">Mandatory — cannot be removed</div>' : '')
      + '</div>'
      + (g.mandatory ? '' : '<button class="btn-sm red" onclick="deleteTicketGroup(' + i + ')">Delete</button>')
      + '</div>';
    list.appendChild(card);
  });
}

function saveNewTicketGroup() {
  var inp = document.getElementById('new-tg-name');
  var name = inp ? inp.value.trim() : '';
  if (!name) return;
  editorTicketGroups.push({ id: 'tg-' + Date.now(), name: name, mandatory: false });
  if (inp) inp.value = '';
  renderTicketGroupList();
}

function deleteTicketGroup(i) {
  if (editorTicketGroups[i] && editorTicketGroups[i].mandatory) return;
  editorTicketGroups.splice(i, 1);
  renderTicketGroupList();
}

// ── ROUTES ──
function renderRouteList() {
  var list = document.getElementById('route-list');
  if (!list) return;
  list.innerHTML = '';
  editorRoutes.forEach(function(route, i) {
    var item = document.createElement('div');
    item.className = 'menu-btn';
    item.style.marginBottom = '6px';
    item.innerHTML =
      '<div>'
      + '<div class="mb-name">' + route.name + '</div>'
      + '<div class="mb-sub">' + route.dir1 + ' / ' + route.dir2 + '</div>'
      + '</div>'
      + '<div class="mb-arr">›</div>';
    item.onclick = function() { openRouteDetail(i); };
    list.appendChild(item);
  });
  // Update count label
  var lbl = document.getElementById('route-count-lbl');
  if (lbl) lbl.textContent = editorRoutes.length + ' defined';
}

// Currently editing route index
var currentRouteIndex = -1;

function openRouteDetail(i) {
  currentRouteIndex = i;
  var route = editorRoutes[i];
  var hdr = document.getElementById('route-detail-hdr');
  if (hdr) { hdr.querySelector('.title').textContent = route.name; hdr.querySelector('.sub').textContent = route.dir1 + ' / ' + route.dir2; }
  renderRouteFsList();
  go('s-ed-routedetail');
}

function saveNewRoute() {
  var name    = document.getElementById('new-route-name').value.trim();
  var dirType = document.getElementById('new-route-dir').value;
  var notes   = document.getElementById('new-route-notes').value.trim();
  if (!name) return;
  var pair = dirPairs[dirType] || ['Inbound', 'Outbound'];
  editorRoutes.push({
    id: 'r' + Date.now(),
    name: name,
    dirType: dirType,
    dir1: pair[0],
    dir2: pair[1],
    notes: notes,
    fareStages: [],
    tickets: [],
    stops: { inbound: {}, outbound: {} }
  });
  document.getElementById('new-route-name').value = '';
  document.getElementById('new-route-notes').value = '';
  renderRouteList();
  openRouteDetail(editorRoutes.length - 1);
}

// ── ROUTE FARE STAGES ──
function renderRouteFsList() {
  var list = document.getElementById('route-fs-list');
  if (!list) return;
  list.innerHTML = '';
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;

  // Update direction caps
  var startCap = document.getElementById('route-fs-start');
  var endCap   = document.getElementById('route-fs-end');
  var mirrorCap = document.getElementById('route-fs-mirror');
  if (startCap)  startCap.textContent  = 'Start of ' + route.dir1 + ' trip';
  if (endCap)    endCap.textContent    = 'End of ' + route.dir1 + ' trip';
  if (mirrorCap) mirrorCap.textContent = route.dir2 + ' will be mirrored in reverse';

  route.fareStages.forEach(function(name, i) {
    var block = document.createElement('div');
    block.className = 'fs-block';
    block.style.marginBottom = '6px';
    block.innerHTML =
      '<div class="fs-block-hdr">'
      + '<button class="arr-btn" onclick="moveRouteFs(' + i + ',-1)" ' + (i === 0 ? 'disabled' : '') + '>▲</button>'
      + '<span class="fs-block-name">' + name + '</span>'
      + '<button class="arr-btn" onclick="moveRouteFs(' + i + ',1)" ' + (i === route.fareStages.length - 1 ? 'disabled' : '') + '>▼</button>'
      + '<button class="btn-sm red" style="margin-left:4px;" onclick="deleteRouteFs(' + i + ')">✕</button>'
      + '</div>';
    list.appendChild(block);
  });
}

function moveRouteFs(i, dir) {
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  var j = i + dir;
  if (j < 0 || j >= route.fareStages.length) return;
  var tmp = route.fareStages[i];
  route.fareStages[i] = route.fareStages[j];
  route.fareStages[j] = tmp;
  renderRouteFsList();
}

function deleteRouteFs(i) {
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  route.fareStages.splice(i, 1);
  renderRouteFsList();
}

function addFsToRoute() {
  var sel = document.getElementById('m-fs-select');
  if (!sel) return;
  var name = sel.value;
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  if (route.fareStages.indexOf(name) > -1) {
    alert(name + ' is already in this route.');
    return;
  }
  route.fareStages.push(name);
  renderRouteFsList();
  hideModal('m-ed-addfs');

  // Keep the route stops screen selector in sync
  populateFsSelectModal();
}

function populateFsSelectModal() {
  var sel = document.getElementById('m-fs-select');
  if (!sel) return;
  sel.innerHTML = '';
  editorFareStages.forEach(function(name) {
    var opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    sel.appendChild(opt);
  });
}

function showAddFsModal() {
  populateFsSelectModal();
  showModal('m-ed-addfs');
}

// ── ROUTE STOPS ──
function moveStop(btn, dir) {
  var stopItem = btn.closest('.stop-item-ed');
  var fsBlock  = stopItem.closest('.fs-block');
  var scroll   = stopItem.closest('[id$="-stops-scroll"]');
  if (!scroll) return;
  var allStops = Array.from(scroll.querySelectorAll('.stop-item-ed'));
  var fsStops  = Array.from(fsBlock.querySelectorAll('.stop-item-ed'));
  var idx      = fsStops.indexOf(stopItem);
  var globalIdx = allStops.indexOf(stopItem);

  if (dir === 'up') {
    if (idx > 0) {
      fsBlock.insertBefore(stopItem, fsStops[idx - 1]);
    } else if (globalIdx > 0) {
      var allBlocks = Array.from(scroll.querySelectorAll('.fs-block'));
      var fsIdx = allBlocks.indexOf(fsBlock);
      if (fsIdx > 0) allBlocks[fsIdx - 1].appendChild(stopItem);
    }
  } else {
    if (idx < fsStops.length - 1) {
      fsBlock.insertBefore(fsStops[idx + 1], stopItem);
    } else {
      var allBlocks = Array.from(scroll.querySelectorAll('.fs-block'));
      var fsIdx = allBlocks.indexOf(fsBlock);
      if (fsIdx < allBlocks.length - 1) {
        var nextFs    = allBlocks[fsIdx + 1];
        var firstStop = nextFs.querySelector('.stop-item-ed');
        if (firstStop) nextFs.insertBefore(stopItem, firstStop);
        else nextFs.appendChild(stopItem);
      }
    }
  }
  updateAllStopArrows();
}

function updateAllStopArrows() {
  ['inbound-stops-scroll', 'outbound-stops-scroll'].forEach(function(id) {
    var scroll = document.getElementById(id);
    if (!scroll) return;
    var allBlocks = Array.from(scroll.querySelectorAll('.fs-block'));
    var allStops  = Array.from(scroll.querySelectorAll('.stop-item-ed'));
    allStops.forEach(function(stop, i) {
      var btns = stop.querySelectorAll('.arr-btn');
      if (btns.length < 2) return;
      var fsIdx = allBlocks.indexOf(stop.closest('.fs-block'));
      btns[0].disabled = (i === 0) && (fsIdx === 0);
      btns[1].disabled = (i === allStops.length - 1) && (fsIdx >= allBlocks.length - 1);
    });
  });
}

// ── VEHICLES ──
function renderVehicleList() {
  var list = document.getElementById('vehicle-list');
  if (!list) return;
  list.innerHTML = '';
  editorVehicles.forEach(function(v, i) {
    var card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '6px';
    card.innerHTML =
      '<div style="display:flex;align-items:center;padding:10px 12px;gap:8px;">'
      + '<div style="flex:1;">'
      + '<div style="font-size:14px;font-weight:500;">' + v.fleet + ' – ' + v.make + '</div>'
      + '<div style="font-size:11px;color:#888;">' + v.reg + ' · Capacity: ' + v.capacity + '</div>'
      + '</div>'
      + '<button class="btn-sm">Edit</button>'
      + '<button class="btn-sm red" onclick="deleteVehicle(' + i + ')">Delete</button>'
      + '</div>';
    list.appendChild(card);
  });
}

function saveNewVehicle() {
  var reg  = document.getElementById('new-v-reg').value.trim();
  var fleet = document.getElementById('new-v-fleet').value.trim();
  var make = document.getElementById('new-v-make').value.trim();
  var cap  = parseInt(document.getElementById('new-v-cap').value) || 0;
  if (!reg || !make) return;
  editorVehicles.push({ fleet: fleet, reg: reg, make: make, capacity: cap });
  document.getElementById('new-v-reg').value = '';
  document.getElementById('new-v-fleet').value = '';
  document.getElementById('new-v-make').value = '';
  document.getElementById('new-v-cap').value = '';
  renderVehicleList();
  go('s-ed-vehicles');
}

function deleteVehicle(i) {
  editorVehicles.splice(i, 1);
  renderVehicleList();
}

// ── DRIVERS ──
function renderDriverList() {
  var list = document.getElementById('driver-list');
  if (!list) return;
  list.innerHTML = '';
  editorDrivers.forEach(function(d, i) {
    var card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '6px';
    card.innerHTML =
      '<div style="display:flex;align-items:center;padding:10px 12px;gap:8px;">'
      + '<div style="flex:1;">'
      + '<div style="font-size:14px;font-weight:500;">Driver ' + d.number + ' – ' + d.name + '</div>'
      + '<div style="font-size:11px;color:#888;">PIN set' + (d.notes ? ' · ' + d.notes : '') + '</div>'
      + '</div>'
      + '<button class="btn-sm">Edit</button>'
      + '<button class="btn-sm red" onclick="deleteDriver(' + i + ')">Delete</button>'
      + '</div>';
    list.appendChild(card);
  });
}

function saveNewDriver() {
  var name   = document.getElementById('new-d-name').value.trim();
  var number = document.getElementById('new-d-num').value.trim();
  var notes  = document.getElementById('new-d-notes').value.trim();
  if (!name || !number) return;
  editorDrivers.push({ name: name, number: number, notes: notes });
  document.getElementById('new-d-name').value = '';
  document.getElementById('new-d-num').value = '';
  document.getElementById('new-d-notes').value = '';
  renderDriverList();
  go('s-ed-drivers');
}

function deleteDriver(i) {
  editorDrivers.splice(i, 1);
  renderDriverList();
}

// ── APPLY RULE ──
function getBaseChartMax() {
  var sel = document.getElementById('rule-base-sel');
  if (!sel || !sel.value) return 0;
  var route = editorRoutes[currentRouteIndex];
  if (!route) return 0;
  var tt = route.tickets.find(function(t) { return t.name === sel.value; });
  if (!tt || !tt.chart) return 0;
  var vals = Object.keys(tt.chart).map(function(k) { return tt.chart[k]; });
  return vals.length ? Math.max.apply(null, vals) : 0;
}

function populateRuleBaseSelect() {
  var sel = document.getElementById('rule-base-sel');
  if (!sel) return;
  sel.innerHTML = '';
  var route = editorRoutes[currentRouteIndex];
  if (route) {
    route.tickets.filter(function(t) { return t.fareType === 'chart'; }).forEach(function(t) {
      var o = document.createElement('option'); o.value = o.textContent = t.name; sel.appendChild(o);
    });
  }
  updatePreview();
}

function updatePreview() {
  var op      = document.getElementById('rule-op');
  var val     = document.getElementById('rule-val');
  var preview = document.getElementById('rule-preview');
  var lbl     = document.getElementById('rule-preview-lbl');
  if (!op || !val || !preview) return;
  var baseMax = getBaseChartMax();
  var v = parseFloat(val.value) || 0;
  var result = baseMax;
  if      (op.value === 'multiply')  result = baseMax * v;
  else if (op.value === 'divide')    result = v !== 0 ? baseMax / v : 0;
  else if (op.value === 'add')       result = baseMax + v;
  else if (op.value === 'subtract')  result = baseMax - v;
  else if (op.value === 'cap')       result = Math.min(baseMax, v);
  if (lbl) lbl.textContent = 'Preview — highest base fare (£' + baseMax.toFixed(2) + ')';
  preview.textContent = '£' + baseMax.toFixed(2) + ' → £' + Math.max(0, result).toFixed(2);
}

function applyFareRule() {
  var route = editorRoutes[currentRouteIndex];
  var tt = route && route.tickets[currentEditTicketIdx];
  if (!tt) return;
  var sel = document.getElementById('rule-base-sel');
  var baseTt = sel && route.tickets.find(function(t) { return t.name === sel.value; });
  if (!baseTt || !baseTt.chart) return;
  var op  = (document.getElementById('rule-op')    || {}).value;
  var val = parseFloat((document.getElementById('rule-val') || {}).value) || 0;
  var rnd = (document.getElementById('rule-round') || {}).value || 'none';
  function applyOp(base) {
    var r;
    if      (op === 'multiply')  r = base * val;
    else if (op === 'divide')    r = val !== 0 ? base / val : 0;
    else if (op === 'add')       r = base + val;
    else if (op === 'subtract')  r = base - val;
    else if (op === 'cap')       r = Math.min(base, val);
    else r = base;
    r = Math.max(0, r);
    if      (rnd === '5p-near')  r = Math.round(r * 20) / 20;
    else if (rnd === '10p-near') r = Math.round(r * 10) / 10;
    else if (rnd === '5p-up')    r = Math.ceil(r  * 20) / 20;
    else if (rnd === '10p-up')   r = Math.ceil(r  * 10) / 10;
    else if (rnd === '5p-down')  r = Math.floor(r * 20) / 20;
    else if (rnd === '10p-down') r = Math.floor(r * 10) / 10;
    return r;
  }
  var wrap = document.getElementById('fare-chart-table-wrap');
  if (wrap) {
    wrap.querySelectorAll('input[data-from]').forEach(function(inp) {
      var key = inp.dataset.from + '→' + inp.dataset.to;
      var rev = inp.dataset.to + '→' + inp.dataset.from;
      var base = baseTt.chart[key] != null ? baseTt.chart[key] : baseTt.chart[rev];
      if (base != null) inp.value = applyOp(base).toFixed(2);
    });
  }
  hideModal('m-ed-rule');
}

// ── FARE STAGE EDIT MODAL ──
function showEditFsModalGlobal(name, el) {
  currentEditFsEl = el;
  document.getElementById('edit-fs-input').value = name;
  showModal('m-ed-editfs');
}

function saveEditFs() {
  var val = document.getElementById('edit-fs-input').value.trim();
  if (val && currentEditFsEl) currentEditFsEl.textContent = val;
  hideModal('m-ed-editfs');
}

var currentStopsDir = 'inbound';

// ── ROUTE STOPS ──
function makeStopItemHtml(name) {
  return '<div class="stop-item-ed"><span class="si-name">' + name + '</span>'
    + '<button class="arr-btn" onclick="moveStop(this,\'up\')">▲</button>'
    + '<button class="arr-btn" onclick="moveStop(this,\'down\')">▼</button>'
    + '<button class="btn-sm red" onclick="this.closest(\'.stop-item-ed\').remove();updateAllStopArrows()">✕</button>'
    + '</div>';
}

function renderRouteStops(dir) {
  var scrollId = dir === 'inbound' ? 'inbound-stops-scroll' : 'outbound-stops-scroll';
  var scroll = document.getElementById(scrollId);
  if (!scroll) return;
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  if (!route.stops) route.stops = { inbound: {}, outbound: {} };

  var stopsData = route.stops[dir] || {};
  var fareStages = dir === 'outbound'
    ? route.fareStages.slice().reverse()
    : route.fareStages.slice();

  if (route.fareStages.length < 2) {
    scroll.innerHTML = '<div class="tag" style="background:#fff3cd;border:1px solid #ffc107;color:#856404;margin:12px;">Add at least 2 fare stages to this route before adding stops.</div>';
    return;
  }

  var html = '';
  if (dir === 'outbound') {
    html += '<div class="tag success">Fare stages mirrored from Inbound. Add stops independently.</div>';
  }
  fareStages.forEach(function(fsName) {
    var stops = stopsData[fsName] || [];
    var isOut = dir === 'outbound';
    html += '<div class="fs-block" data-fs="' + fsName + '">';
    html += '<div class="fs-block-hdr"' + (isOut ? ' style="background:#e8f8e8;"' : '') + '>';
    html += '<span class="fs-block-name"' + (isOut ? ' style="color:#1e6b1e;"' : '') + '>' + fsName + '</span></div>';
    stops.forEach(function(stopName) { html += makeStopItemHtml(stopName); });
    html += '</div>';
  });
  scroll.innerHTML = html;
  updateAllStopArrows();
}

function saveRouteStops(dir) {
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  if (!route.stops) route.stops = { inbound: {}, outbound: {} };
  var scrollId = dir === 'inbound' ? 'inbound-stops-scroll' : 'outbound-stops-scroll';
  var scroll = document.getElementById(scrollId);
  if (!scroll) return;
  var result = {};
  scroll.querySelectorAll('.fs-block').forEach(function(block) {
    var fsName = block.dataset.fs;
    if (!fsName) return;
    result[fsName] = Array.from(block.querySelectorAll('.si-name')).map(function(el) {
      return el.textContent;
    });
  });
  route.stops[dir] = result;
}

// ── STOP MODAL HELPERS ──
function populateAssignStopModal() {
  var stopSel = document.getElementById('assign-stop-select');
  var fsSel   = document.getElementById('assign-fs-select');
  if (!stopSel || !fsSel) return;
  stopSel.innerHTML = '';
  editorStops.forEach(function(s) {
    var o = document.createElement('option');
    o.value = o.textContent = s.name;
    stopSel.appendChild(o);
  });
  var route = editorRoutes[currentRouteIndex];
  fsSel.innerHTML = '';
  if (route) {
    var stages = currentStopsDir === 'outbound'
      ? route.fareStages.slice().reverse()
      : route.fareStages.slice();
    stages.forEach(function(fs) {
      var o = document.createElement('option');
      o.value = o.textContent = fs;
      fsSel.appendChild(o);
    });
  }
}

function assignStopToRoute() {
  var stopName = document.getElementById('assign-stop-select').value;
  var fsName   = document.getElementById('assign-fs-select').value;
  if (!stopName || !fsName) return;
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  if (!route.stops) route.stops = { inbound: {}, outbound: {} };
  var d = currentStopsDir;
  if (!route.stops[d][fsName]) route.stops[d][fsName] = [];
  if (route.stops[d][fsName].indexOf(stopName) === -1)
    route.stops[d][fsName].push(stopName);
  renderRouteStops(d);
  hideModal('m-ed-assignstop');
}

function populateCreateStopModal() {
  var fsSel = document.getElementById('create-stop-fs-select');
  if (!fsSel) return;
  var route = editorRoutes[currentRouteIndex];
  fsSel.innerHTML = '';
  if (route) {
    var stages = currentStopsDir === 'outbound'
      ? route.fareStages.slice().reverse()
      : route.fareStages.slice();
    stages.forEach(function(fs) {
      var o = document.createElement('option');
      o.value = o.textContent = fs;
      fsSel.appendChild(o);
    });
  }
  var n = document.getElementById('create-stop-name-inp');
  var la = document.getElementById('create-stop-lat-inp');
  var lo = document.getElementById('create-stop-lng-inp');
  if (n)  n.value  = '';
  if (la) la.value = '';
  if (lo) lo.value = '';
}

function createAndAssignStop() {
  var name   = (document.getElementById('create-stop-name-inp').value || '').trim();
  var lat    = (document.getElementById('create-stop-lat-inp').value  || '').trim();
  var lng    = (document.getElementById('create-stop-lng-inp').value  || '').trim();
  var fsName = document.getElementById('create-stop-fs-select').value;
  if (!name || !fsName) return;
  if (!editorStops.find(function(s) { return s.name === name; })) {
    editorStops.push({ name: name, lat: lat, lng: lng });
    renderStopList();
  }
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  if (!route.stops) route.stops = { inbound: {}, outbound: {} };
  var d = currentStopsDir;
  if (!route.stops[d][fsName]) route.stops[d][fsName] = [];
  if (route.stops[d][fsName].indexOf(name) === -1)
    route.stops[d][fsName].push(name);
  renderRouteStops(d);
  hideModal('m-ed-createstop');
}

var currentEditTicketIdx = -1;

// ── ROUTE TICKETS ──
function renderRouteTickets() {
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  if (!route.tickets) route.tickets = [];

  var list = document.getElementById('route-ticket-list');
  if (list) {
    list.innerHTML = '';
    if (route.tickets.length === 0) {
      list.innerHTML = '<div style="padding:14px 16px;font-size:13px;color:#888;">No ticket types assigned yet.</div>';
    } else {
      route.tickets.forEach(function(tt, i) {
        var fareLabel = tt.fareType === 'flat'
          ? 'Flat fare' + (tt.price != null ? ' · £' + tt.price.toFixed(2) : '')
          : 'Fare chart';
        var editFn = tt.fareType === 'flat' ? 'openFlatFare(' + i + ')' : 'openFareChart(' + i + ')';
        var row = document.createElement('div');
        row.className = 'ticket-item';
        row.innerHTML = '<div style="flex:1;">'
          + '<div style="font-size:13px;font-weight:500;">' + tt.name + '</div>'
          + '<div style="font-size:11px;color:#888;margin-top:2px;">' + fareLabel + '</div>'
          + '</div>'
          + '<button class="btn-sm blue" onclick="' + editFn + '">Edit</button>'
          + '<button class="btn-sm red" onclick="removeRouteTicket(\'' + tt.name.replace(/'/g, "\\'") + '\')">Remove</button>';
        list.appendChild(row);
      });
    }
  }

  var sel = document.getElementById('route-ticket-add-select');
  if (sel) {
    sel.innerHTML = '<option value="">Select ticket type...</option>';
    editorTicketTypes.forEach(function(tt) {
      var taken = route.tickets.some(function(t) { return t.name === tt.name; });
      if (!taken) {
        var o = document.createElement('option');
        o.value = o.textContent = tt.name;
        sel.appendChild(o);
      }
    });
  }
}

function addRouteTicket(fareType) {
  var sel = document.getElementById('route-ticket-add-select');
  if (!sel || !sel.value) return;
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  if (!route.tickets) route.tickets = [];
  route.tickets.push({ name: sel.value, fareType: fareType || 'chart' });
  renderRouteTickets();
}

function removeRouteTicket(name) {
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  route.tickets = route.tickets.filter(function(t) { return t.name !== name; });
  renderRouteTickets();
}

// ── FLAT FARE EDITING ──
function openFlatFare(idx) {
  currentEditTicketIdx = idx;
  var route = editorRoutes[currentRouteIndex];
  var tt = route.tickets[idx];
  var lbl = document.getElementById('flat-fare-ticket-lbl');
  if (lbl) lbl.textContent = tt.name;
  var inp = document.getElementById('flat-fare-price-input');
  if (inp) inp.value = tt.price != null ? tt.price.toFixed(2) : '0.00';
  showModal('m-ed-flatfare');
}

function saveFlatFare() {
  var inp = document.getElementById('flat-fare-price-input');
  var price = parseFloat(inp ? inp.value : '0') || 0;
  var route = editorRoutes[currentRouteIndex];
  if (route && route.tickets[currentEditTicketIdx]) {
    route.tickets[currentEditTicketIdx].price = price;
  }
  renderRouteTickets();
  hideModal('m-ed-flatfare');
}

// ── FARE CHART EDITING ──
function openFareChart(idx) {
  currentEditTicketIdx = idx;
  var route = editorRoutes[currentRouteIndex];
  var tt = route.tickets[idx];
  var hdr = document.querySelector('#s-ed-farechart .ed-hdr .title');
  if (hdr) hdr.textContent = tt.name + ' – fare chart';
  renderFareChartTable();
  go('s-ed-farechart');
}

function renderFareChartTable() {
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  var tt = route.tickets[currentEditTicketIdx];
  if (!tt) return;
  var stages = route.fareStages;
  var chart = tt.chart || {};
  var wrap = document.getElementById('fare-chart-table-wrap');
  if (!wrap) return;

  var html = '<table class="ftable"><tr><th>From ↓ / To →</th>';
  stages.forEach(function(s) { html += '<th>' + s + '</th>'; });
  html += '</tr>';
  stages.forEach(function(from, i) {
    html += '<tr><td class="orig">' + from + '</td>';
    stages.forEach(function(to, j) {
      var val = chart[from + '→' + to] != null ? chart[from + '→' + to] : chart[to + '→' + from];
      var disp = val != null ? val.toFixed(2) : '';
      if (i === j) {
        html += '<td class="local"><input type="text" data-from="' + from + '" data-to="' + to + '" value="' + disp + '" placeholder="—" style="background:transparent;"/></td>';
      } else if (j > i) {
        html += '<td class="blank" style="background:#e8e8e8;cursor:not-allowed;"></td>';
      } else {
        html += '<td><input type="text" data-from="' + from + '" data-to="' + to + '" value="' + disp + '" placeholder="—"/></td>';
      }
    });
    html += '</tr>';
  });
  html += '</table>';
  wrap.innerHTML = html;
}

function saveFareChart() {
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  var tt = route.tickets[currentEditTicketIdx];
  if (!tt) return;
  var chart = {};
  var wrap = document.getElementById('fare-chart-table-wrap');
  if (wrap) {
    wrap.querySelectorAll('input[data-from]').forEach(function(inp) {
      var val = parseFloat(inp.value);
      if (!isNaN(val) && val > 0) chart[inp.dataset.from + '→' + inp.dataset.to] = val;
    });
  }
  tt.chart = chart;
  renderRouteTickets();
  go('s-ed-routetickets');
}

// ── DUTIES ──
var currentDutyIndex = -1;
var currentEditEventIdx = -1;

function renderDutyList() {
  var list = document.getElementById('duty-list');
  if (!list) return;
  list.innerHTML = '';
  var typeLabels = { duty: 'Duty board', running: 'Running board' };
  editorDuties.forEach(function(duty, i) {
    var item = document.createElement('div');
    item.className = 'menu-btn';
    item.style.marginBottom = '6px';
    item.innerHTML = '<div><div class="mb-name">' + duty.name + '</div>'
      + '<div class="mb-sub">' + (typeLabels[duty.type] || 'Duty board') + (duty.description ? ' – ' + duty.description : '') + ' · ' + duty.events.length + ' events</div></div>'
      + '<div class="mb-arr">›</div>';
    item.onclick = function() { openDutyDetail(i); };
    list.appendChild(item);
  });
  var lbl = document.getElementById('duty-count-lbl');
  if (lbl) lbl.textContent = editorDuties.length + ' defined';
}

function openDutyDetail(i) {
  currentDutyIndex = i;
  var duty = editorDuties[i];
  var ni = document.getElementById('duty-name-inp');
  var ti = document.getElementById('duty-type-sel');
  var di = document.getElementById('duty-desc-inp');
  if (ni) ni.value = duty.name || '';
  if (ti) ti.value = duty.type || 'duty';
  if (di) di.value = duty.description || '';
  renderDutyEvents();
  go('s-ed-dutydetail');
}

function updateDutyField(field, value) {
  var duty = editorDuties[currentDutyIndex];
  if (duty) duty[field] = value;
}

function renderDutyEvents() {
  var duty = editorDuties[currentDutyIndex];
  if (!duty) return;
  var list = document.getElementById('duty-event-list');
  if (!list) return;
  list.innerHTML = '';
  if (!duty.events.length) {
    list.innerHTML = '<div style="padding:14px 16px;font-size:13px;color:#888;">No events added yet.</div>';
    return;
  }
  var colours = { trip: '#2c5f9e', dead: '#c0392b', break: '#1e8449', fuel: '#b07d00' };
  duty.events.forEach(function(ev, i) {
    var col  = colours[ev.type] || '#555';
    var top  = '', bot = '';
    if (ev.type === 'trip') {
      var route = editorRoutes.find(function(r) { return r.id === ev.routeId; });
      var fs   = route ? route.fareStages : [];
      var out  = (ev.direction || '').toLowerCase().match(/out|south|west|anti/);
      var from = out ? (fs[fs.length - 1] || '—') : (fs[0] || '—');
      var to   = out ? (fs[0] || '—') : (fs[fs.length - 1] || '—');
      var parts = [route ? route.name : (ev.routeId || '—'), ev.direction, ev.journeyId, ev.startTime].filter(Boolean);
      top = parts.join(' · ');
      bot = from + ' → ' + to;
    } else if (ev.type === 'dead') {
      top = 'Dead' + (ev.startTime ? ' · ' + ev.startTime : '');
      bot = ev.notes || 'Not in service';
    } else if (ev.type === 'break') {
      top = 'Break' + (ev.startTime ? ' · ' + ev.startTime : '');
      bot = ev.duration ? ev.duration + ' min scheduled' : '';
    } else if (ev.type === 'fuel') {
      top = 'Fuel' + (ev.startTime ? ' · ' + ev.startTime : '');
      bot = 'Fuel stop';
    }
    var row = document.createElement('div');
    row.style.cssText = 'margin-bottom:6px;background:#fff;border:1.5px solid #e0e0e0;border-left:4px solid ' + col + ';border-radius:10px;display:flex;align-items:center;gap:8px;padding:8px 10px;';
    row.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:3px;flex-shrink:0;">'
      + '<button class="arr-btn" onclick="moveDutyEvent(' + i + ',-1)"' + (i === 0 ? ' disabled' : '') + '>▲</button>'
      + '<button class="arr-btn" onclick="moveDutyEvent(' + i + ',1)"' + (i === duty.events.length - 1 ? ' disabled' : '') + '>▼</button>'
      + '</div>'
      + '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:12px;font-weight:600;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + top + '</div>'
      + '<div style="font-size:11px;color:#888;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + bot + '</div>'
      + '</div>'
      + '<button class="btn-sm blue" onclick="editDutyEvent(' + i + ')">Edit</button>'
      + '<button class="btn-sm red" onclick="removeDutyEvent(' + i + ')">✕</button>';
    list.appendChild(row);
  });
}

function moveDutyEvent(i, dir) {
  var duty = editorDuties[currentDutyIndex];
  if (!duty) return;
  var j = i + dir;
  if (j < 0 || j >= duty.events.length) return;
  var tmp = duty.events[i]; duty.events[i] = duty.events[j]; duty.events[j] = tmp;
  renderDutyEvents();
}

function removeDutyEvent(i) {
  var duty = editorDuties[currentDutyIndex];
  if (!duty) return;
  duty.events.splice(i, 1);
  renderDutyEvents();
}

function showAddEventScreen() {
  currentEditEventIdx = -1;
  _openEventScreen(null);
}

function editDutyEvent(i) {
  currentEditEventIdx = i;
  var duty = editorDuties[currentDutyIndex];
  _openEventScreen(duty ? duty.events[i] : null);
}

function _openEventScreen(ev) {
  var sel = document.getElementById('event-type-sel');
  if (sel) sel.value = ev ? ev.type : 'trip';
  var rSel = document.getElementById('event-route-sel');
  if (rSel) {
    rSel.innerHTML = '';
    editorRoutes.forEach(function(r) {
      var o = document.createElement('option'); o.value = r.id; o.textContent = r.name;
      rSel.appendChild(o);
    });
    if (ev && ev.routeId) rSel.value = ev.routeId;
  }
  updateEventFields();
  updateEventDirections();
  var e = ev || {};
  document.getElementById('event-time').value        = e.startTime  || '';
  document.getElementById('event-journey-id').value  = e.journeyId  || '';
  document.getElementById('event-notes').value       = e.notes      || '';
  document.getElementById('event-duration').value    = e.duration   || '';
  if (ev && ev.direction) {
    var dSel = document.getElementById('event-dir-sel');
    if (dSel) dSel.value = ev.direction;
  }
  var titleEl = document.getElementById('addevent-title');
  if (titleEl) titleEl.textContent = currentEditEventIdx >= 0 ? 'Edit event' : 'Add event';
  var saveBtn = document.getElementById('event-save-btn');
  if (saveBtn) saveBtn.textContent = currentEditEventIdx >= 0 ? 'Update event' : 'Add event';
  go('s-ed-addevent');
}

function updateEventFields() {
  var type = (document.getElementById('event-type-sel') || {}).value;
  document.getElementById('event-trip-fields').style.display  = type === 'trip'  ? '' : 'none';
  document.getElementById('event-dead-fields').style.display  = type === 'dead'  ? '' : 'none';
  document.getElementById('event-break-fields').style.display = type === 'break' ? '' : 'none';
}

function updateEventDirections() {
  var rSel = document.getElementById('event-route-sel');
  var dSel = document.getElementById('event-dir-sel');
  if (!rSel || !dSel) return;
  var route = editorRoutes.find(function(r) { return r.id === rSel.value; });
  dSel.innerHTML = '';
  if (route) {
    [route.dir1, route.dir2].forEach(function(d) {
      var o = document.createElement('option'); o.value = o.textContent = d; dSel.appendChild(o);
    });
  }
}

function saveDutyEvent() {
  var duty = editorDuties[currentDutyIndex];
  if (!duty) return;
  var type = document.getElementById('event-type-sel').value;
  var startTime = document.getElementById('event-time').value;
  if (!startTime) { alert('Start time is required.'); return; }
  if (type === 'trip') {
    if (!document.getElementById('event-route-sel').value) { alert('Route is required.'); return; }
    if (!document.getElementById('event-dir-sel').value)   { alert('Direction is required.'); return; }
  }
  if (type === 'break') {
    if (!document.getElementById('event-duration').value)  { alert('Duration is required.'); return; }
  }
  var ev = { type: type, startTime: startTime };
  if (type === 'trip') {
    ev.journeyId = (document.getElementById('event-journey-id').value || '').trim();
    ev.routeId   = document.getElementById('event-route-sel').value;
    ev.direction = document.getElementById('event-dir-sel').value;
  } else if (type === 'dead') {
    ev.notes = (document.getElementById('event-notes').value || '').trim();
  } else if (type === 'break') {
    ev.duration = parseInt(document.getElementById('event-duration').value) || 0;
  }
  if (currentEditEventIdx >= 0) {
    duty.events[currentEditEventIdx] = ev;
  } else {
    duty.events.push(ev);
  }
  currentEditEventIdx = -1;
  renderDutyEvents();
  go('s-ed-dutydetail');
}

function cloneDuty() {
  var duty = editorDuties[currentDutyIndex];
  if (!duty) return;
  var clone = JSON.parse(JSON.stringify(duty));
  clone.id = 'd' + Date.now();
  clone.name = duty.name + ' (copy)';
  editorDuties.push(clone);
  renderDutyList();
  openDutyDetail(editorDuties.length - 1);
}

function deleteDuty() {
  editorDuties.splice(currentDutyIndex, 1);
  currentDutyIndex = -1;
  renderDutyList();
  go('s-ed-duties');
}

function saveNewDuty() {
  editorDuties.push({ id: 'd' + Date.now(), name: 'New duty', type: 'duty', description: '', events: [] });
  renderDutyList();
  openDutyDetail(editorDuties.length - 1);
}

// ── ROUTE FARE STAGE: CREATE & ASSIGN ──
function createAndAssignFs() {
  var inp = document.getElementById('create-fs-name-inp');
  var name = (inp ? inp.value : '').trim();
  if (!name) return;
  if (editorFareStages.indexOf(name) === -1) {
    editorFareStages.push(name);
    renderFareStageList();
  }
  var route = editorRoutes[currentRouteIndex];
  if (route && route.fareStages.indexOf(name) === -1) {
    route.fareStages.push(name);
    renderRouteFsList();
  }
  if (inp) inp.value = '';
  hideModal('m-ed-createfs');
}

// ── STOP MAP ──
var stopEditMapInst  = null;
var stopEditMarker   = null;
var stopEditCircle   = null;
var stopEditIdx      = -1;
var _stopEditBearing = null; // null = any direction, 0-359 = specific bearing
var _createStopFromRouteDir = null;

var _legacyBearingMap = { N:0, NE:45, E:90, SE:135, S:180, SW:225, W:270, NW:315 };
function _resolveBearing(dir) {
  if (dir == null || dir === 'any') return null;
  if (typeof dir === 'number') return dir;
  return _legacyBearingMap[dir] != null ? _legacyBearingMap[dir] : null;
}
function _bearingLabel(b) {
  if (b == null) return 'Any direction';
  var snap = [[0,'N'],[45,'NE'],[90,'E'],[135,'SE'],[180,'S'],[225,'SW'],[270,'W'],[315,'NW']];
  var best = snap.reduce(function(a,c) {
    var d = Math.abs(b - c[0]); d = Math.min(d, 360 - d);
    return d < a.d ? { d:d, lbl:c[1] } : a;
  }, { d:999, lbl:'N' });
  return b + '° · ' + best.lbl;
}

function renderStopCompass(bearing) {
  _stopEditBearing = (bearing === null || bearing === undefined || bearing === 'any') ? null : Math.round(((parseInt(bearing, 10) % 360) + 360) % 360);
  var container = document.getElementById('stop-compass');
  if (!container) return;

  var cx = 100, cy = 100, rOut = 88, rIn = 22;
  var parts = ['<svg width="200" height="200" viewBox="0 0 200 200" style="display:block;margin:auto;cursor:pointer;" onclick="compassClick(event)">'];

  // Background
  parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rOut + '" fill="#16213e" stroke="#0d0d1a" stroke-width="2"/>');

  // Tick marks every 5°
  for (var t = 0; t < 360; t += 5) {
    var isCard = t % 90 === 0;
    var isMajor = t % 45 === 0;
    var tickLen = isCard ? 14 : (isMajor ? 10 : 5);
    var strokeW = isCard ? 2 : (isMajor ? 1.5 : 0.8);
    var strokeC = isCard ? '#7799bb' : (isMajor ? '#445566' : '#2a3344');
    var a = (t - 90) * Math.PI / 180;
    var x1 = cx + rOut * Math.cos(a), y1 = cy + rOut * Math.sin(a);
    var x2 = cx + (rOut - tickLen) * Math.cos(a), y2 = cy + (rOut - tickLen) * Math.sin(a);
    parts.push('<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + strokeC + '" stroke-width="' + strokeW + '" pointer-events="none"/>');
  }

  // Cardinal labels
  var rLbl = rOut - 24;
  [{t:0,lbl:'N',col:'#e74c3c',sz:13},{t:90,lbl:'E',col:'#8ab0cc',sz:11},{t:180,lbl:'S',col:'#8ab0cc',sz:11},{t:270,lbl:'W',col:'#8ab0cc',sz:11}].forEach(function(c) {
    var a = (c.t - 90) * Math.PI / 180;
    var x = (cx + rLbl * Math.cos(a)).toFixed(1), y = (cy + rLbl * Math.sin(a) + 4).toFixed(1);
    parts.push('<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + c.sz + '" font-weight="900" fill="' + c.col + '" pointer-events="none">' + c.lbl + '</text>');
  });
  [{t:45,lbl:'NE'},{t:135,lbl:'SE'},{t:225,lbl:'SW'},{t:315,lbl:'NW'}].forEach(function(c) {
    var a = (c.t - 90) * Math.PI / 180;
    var x = (cx + rLbl * Math.cos(a)).toFixed(1), y = (cy + rLbl * Math.sin(a) + 3.5).toFixed(1);
    parts.push('<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="8" font-weight="700" fill="#4d6e8a" pointer-events="none">' + c.lbl + '</text>');
  });

  // Selected bearing needle
  if (_stopEditBearing !== null) {
    var na = (_stopEditBearing - 90) * Math.PI / 180;
    var ntipx = (cx + (rOut - 5) * Math.cos(na)).toFixed(1), ntipy = (cy + (rOut - 5) * Math.sin(na)).toFixed(1);
    var nbasex = (cx + (rIn + 6) * Math.cos(na)).toFixed(1), nbasey = (cy + (rIn + 6) * Math.sin(na)).toFixed(1);
    var px = (Math.sin(na) * 5).toFixed(1), py = (-Math.cos(na) * 5).toFixed(1);
    var bmx = (cx + (rIn + 14) * Math.cos(na)).toFixed(1), bmy = (cy + (rIn + 14) * Math.sin(na)).toFixed(1);
    parts.push('<polygon points="' + ntipx + ',' + ntipy + ' ' + (+bmx - +px).toFixed(1) + ',' + (+bmy - +py).toFixed(1) + ' ' + (+bmx + +px).toFixed(1) + ',' + (+bmy + +py).toFixed(1) + '" fill="#4a90d9" pointer-events="none"/>');
    parts.push('<line x1="' + nbasex + '" y1="' + nbasey + '" x2="' + ntipx + '" y2="' + ntipy + '" stroke="#4a90d9" stroke-width="2.5" pointer-events="none"/>');
    parts.push('<circle cx="' + ntipx + '" cy="' + ntipy + '" r="4.5" fill="#4a90d9" stroke="#fff" stroke-width="1.5" pointer-events="none"/>');
  }

  // Center ANY circle
  var anyActive = _stopEditBearing === null;
  parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rIn + '" fill="' + (anyActive ? '#2c5f9e' : '#0d1526') + '" stroke="#334" stroke-width="1.5" onclick="event.stopPropagation();selectStopDir(null)" style="cursor:pointer;"/>');
  parts.push('<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="8" font-weight="800" fill="' + (anyActive ? '#fff' : '#445') + '" pointer-events="none">ANY</text>');

  parts.push('</svg>');
  container.innerHTML = parts.join('');

  var bearingEl = document.getElementById('stop-bearing-display');
  if (bearingEl) bearingEl.textContent = _bearingLabel(_stopEditBearing);
}

function compassClick(evt) {
  var svg = evt.currentTarget;
  var rect = svg.getBoundingClientRect();
  var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  var dx = evt.clientX - cx, dy = evt.clientY - cy;
  var dist = Math.sqrt(dx * dx + dy * dy);
  var rCenterScaled = 22 * (rect.width / 200);
  if (dist < rCenterScaled) return;
  var bearing = Math.round(((Math.atan2(dy, dx) * 180 / Math.PI + 90) % 360 + 360) % 360);
  selectStopDir(bearing);
}

function selectStopDir(bearing) {
  _stopEditBearing = (bearing === null || bearing === 'any') ? null : Math.round(((parseInt(bearing, 10) % 360) + 360) % 360);
  renderStopCompass(_stopEditBearing);
  var lat = parseFloat(document.getElementById('new-stop-lat').value);
  var lng = parseFloat(document.getElementById('new-stop-lng').value);
  if (!isNaN(lat) && !isNaN(lng) && stopEditMapInst) _placeStopEditMarker(lat, lng);
}

function openAddStop() {
  _createStopFromRouteDir = null;
  var assignSection = document.getElementById('stop-route-assign-row');
  if (assignSection) assignSection.style.display = 'none';
  stopEditIdx = -1;
  _stopEditBearing = null;
  document.getElementById('new-stop-name').value    = '';
  document.getElementById('new-stop-lat').value     = '';
  document.getElementById('new-stop-lng').value     = '';
  document.getElementById('new-stop-radius').value  = '50';
  document.getElementById('add-stop-title').textContent = 'Add stop';
  go('s-ed-addstop');
  setTimeout(function() { initStopEditMap(); renderStopCompass(null); }, 100);
}

function openCreateStopFromRoute(dir) {
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  _createStopFromRouteDir = dir;
  stopEditIdx = -1;
  _stopEditBearing = null;
  document.getElementById('new-stop-name').value    = '';
  document.getElementById('new-stop-lat').value     = '';
  document.getElementById('new-stop-lng').value     = '';
  document.getElementById('new-stop-radius').value  = '50';
  document.getElementById('add-stop-title').textContent = 'Create stop';
  var assignSection = document.getElementById('stop-route-assign-row');
  var fsSelect = document.getElementById('stop-route-fs-select');
  if (assignSection && fsSelect) {
    fsSelect.innerHTML = '';
    (route.fareStages || []).forEach(function(fs) {
      var opt = document.createElement('option'); opt.value = fs; opt.textContent = fs;
      fsSelect.appendChild(opt);
    });
    assignSection.style.display = '';
  }
  go('s-ed-addstop');
  setTimeout(function() { initStopEditMap(); renderStopCompass(null); }, 100);
}

function cancelAddStop() {
  if (_createStopFromRouteDir) {
    var routeDir = _createStopFromRouteDir;
    _createStopFromRouteDir = null;
    var assignSection = document.getElementById('stop-route-assign-row');
    if (assignSection) assignSection.style.display = 'none';
    go(routeDir === 'inbound' ? 's-ed-instops' : 's-ed-outstops');
    return;
  }
  go('s-ed-stops');
}

function viewRouteStopsOnMap(dir) {
  var route = editorRoutes[currentRouteIndex];
  if (!route) return;
  showModal('m-route-stops-map');
  setTimeout(function() {
    var container = document.getElementById('route-stops-map-view');
    if (!container) return;
    if (window._routeStopsMapInst) { window._routeStopsMapInst.remove(); window._routeStopsMapInst = null; }
    var stopsObj = (route.stops && route.stops[dir]) || {};
    var allStopNames = [];
    Object.keys(stopsObj).forEach(function(stage) {
      (stopsObj[stage] || []).forEach(function(s) { if (allStopNames.indexOf(s) < 0) allStopNames.push(s); });
    });
    var stopObjs = allStopNames.map(function(n) {
      return editorStops.find(function(s) { return s.name === n; });
    }).filter(function(s) { return s && s.lat && s.lng; });
    var center = stopObjs.length ? [parseFloat(stopObjs[0].lat), parseFloat(stopObjs[0].lng)] : [51.5, -0.12];
    var map = L.map(container).setView(center, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
    window._routeStopsMapInst = map;
    var bounds = [];
    stopObjs.forEach(function(s, i) {
      var lat = parseFloat(s.lat), lng = parseFloat(s.lng);
      bounds.push([lat, lng]);
      var b = _resolveBearing(s.direction);
      var html;
      if (b !== null) {
        html = '<svg width="34" height="34" viewBox="0 0 34 34">'
          + '<circle cx="17" cy="17" r="13" fill="#2c5f9e" stroke="#fff" stroke-width="2"/>'
          + '<g transform="rotate(' + b + ',17,17)"><polygon points="17,3 14,14 17,11 20,14" fill="#e74c3c"/></g>'
          + '<text x="17" y="21" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">' + (i + 1) + '</text>'
          + '</svg>';
      } else {
        html = '<div style="width:30px;height:30px;background:#2c5f9e;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;">' + (i + 1) + '</div>';
      }
      var m = L.marker([lat, lng], { icon: L.divIcon({ html: html, iconSize: [34, 34], iconAnchor: [17, 17], className: '' }) }).addTo(map);
      m.bindTooltip((i + 1) + '. ' + s.name, { permanent: false });
    });
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [20, 20] });
    else if (bounds.length === 1) map.setView(bounds[0], 16);
    map.invalidateSize();
  }, 150);
}

function openEditStop(i) {
  var stop = editorStops[i];
  if (!stop) return;
  stopEditIdx = i;
  _stopEditBearing = _resolveBearing(stop.direction);
  document.getElementById('new-stop-name').value    = stop.name   || '';
  document.getElementById('new-stop-lat').value     = stop.lat    || '';
  document.getElementById('new-stop-lng').value     = stop.lng    || '';
  document.getElementById('new-stop-radius').value  = stop.radius != null ? stop.radius : 50;
  document.getElementById('add-stop-title').textContent = 'Edit stop';
  go('s-ed-addstop');
  setTimeout(function() { initStopEditMap(); renderStopCompass(_stopEditBearing); }, 100);
}

function initStopEditMap() {
  var container = document.getElementById('stop-edit-map');
  if (!container) return;
  if (stopEditMapInst) { stopEditMapInst.remove(); stopEditMapInst = null; stopEditMarker = null; stopEditCircle = null; }

  var latStr = document.getElementById('new-stop-lat').value.trim();
  var lngStr = document.getElementById('new-stop-lng').value.trim();
  var hasCoords = !!(latStr && lngStr);
  var lat = parseFloat(latStr) || 51.5;
  var lng = parseFloat(lngStr) || -0.12;

  stopEditMapInst = L.map(container, { zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19
  }).addTo(stopEditMapInst);

  if (hasCoords) {
    stopEditMapInst.setView([lat, lng], 17);
    _placeStopEditMarker(lat, lng);
  } else if (navigator.geolocation) {
    stopEditMapInst.setView([51.5, -0.12], 13);
    navigator.geolocation.getCurrentPosition(function(pos) {
      if (stopEditMapInst) stopEditMapInst.setView([pos.coords.latitude, pos.coords.longitude], 15);
    }, null, { timeout: 5000 });
  } else {
    stopEditMapInst.setView([51.5, -0.12], 13);
  }

  // Long-press to set location
  var pressTimer = null, pressStart = null;
  function onPressStart(e) {
    pressStart = e.latlng;
    pressTimer = setTimeout(function() {
      if (pressStart) _setStopEditCoords(pressStart.lat, pressStart.lng);
    }, 600);
  }
  function onPressEnd() { clearTimeout(pressTimer); pressStart = null; }
  stopEditMapInst.on('mousedown',  onPressStart);
  stopEditMapInst.on('touchstart', onPressStart);
  stopEditMapInst.on('mouseup',    onPressEnd);
  stopEditMapInst.on('mousemove',  onPressEnd);
  stopEditMapInst.on('touchend',   onPressEnd);
  stopEditMapInst.on('touchmove',  onPressEnd);
  stopEditMapInst.invalidateSize();
}

function _placeStopEditMarker(lat, lng) {
  var radius = parseInt(document.getElementById('new-stop-radius').value) || 50;
  if (stopEditMarker) { stopEditMarker.remove(); stopEditMarker = null; }
  if (stopEditCircle) { stopEditCircle.remove(); stopEditCircle = null; }

  stopEditCircle = L.circle([lat, lng], {
    radius: radius, color: '#2c5f9e', weight: 2,
    fillColor: '#4a90d9', fillOpacity: 0.18
  }).addTo(stopEditMapInst);

  if (_stopEditBearing !== null) {
    var arrowSvg = '<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">'
      + '<circle cx="20" cy="20" r="9" fill="#2c5f9e" stroke="#1a3f7a" stroke-width="2"/>'
      + '<g transform="rotate(' + _stopEditBearing + ',20,20)">'
      + '<polygon points="20,4 16,16 20,13 24,16" fill="#e74c3c"/>'
      + '</g>'
      + '</svg>';
    stopEditMarker = L.marker([lat, lng], {
      icon: L.divIcon({ html: arrowSvg, iconSize: [40, 40], iconAnchor: [20, 20], className: '' })
    }).addTo(stopEditMapInst);
  } else {
    stopEditMarker = L.circleMarker([lat, lng], {
      radius: 9, color: '#1a3f7a', weight: 2,
      fillColor: '#2c5f9e', fillOpacity: 1
    }).addTo(stopEditMapInst);
  }
}

function _setStopEditCoords(lat, lng) {
  document.getElementById('new-stop-lat').value = lat.toFixed(6);
  document.getElementById('new-stop-lng').value = lng.toFixed(6);
  _placeStopEditMarker(lat, lng);
  stopEditMapInst.setView([lat, lng], Math.max(stopEditMapInst.getZoom(), 17));
}

function stopEditCoordsChanged() {
  var lat = parseFloat(document.getElementById('new-stop-lat').value);
  var lng = parseFloat(document.getElementById('new-stop-lng').value);
  if (!isNaN(lat) && !isNaN(lng) && stopEditMapInst) {
    _placeStopEditMarker(lat, lng);
    stopEditMapInst.setView([lat, lng], Math.max(stopEditMapInst.getZoom(), 17));
  }
}

function stopEditRadiusChanged() {
  var lat = parseFloat(document.getElementById('new-stop-lat').value);
  var lng = parseFloat(document.getElementById('new-stop-lng').value);
  if (!isNaN(lat) && !isNaN(lng) && stopEditMapInst && stopEditCircle) {
    stopEditCircle.setRadius(parseInt(document.getElementById('new-stop-radius').value) || 50);
  }
}

function searchStopLocation() {
  var query = (document.getElementById('stop-search-inp').value || '').trim();
  var resultsEl = document.getElementById('stop-search-results');
  if (!query) { if (resultsEl) resultsEl.innerHTML = ''; return; }
  if (resultsEl) resultsEl.innerHTML = '<div style="padding:8px 10px;font-size:12px;color:#888;">Searching…</div>';
  fetch('https://nominatim.openstreetmap.org/search?format=json&limit=5&q=' + encodeURIComponent(query))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!resultsEl) return;
      resultsEl.innerHTML = '';
      if (!data.length) {
        resultsEl.innerHTML = '<div style="padding:8px 10px;font-size:12px;color:#888;">No results found</div>';
        return;
      }
      data.forEach(function(item) {
        var row = document.createElement('div');
        row.style.cssText = 'padding:9px 10px;border-bottom:1px solid #eee;cursor:pointer;font-size:13px;line-height:1.3;';
        row.textContent = item.display_name;
        row.onmousedown = function() {
          var lat = parseFloat(item.lat), lng = parseFloat(item.lon);
          document.getElementById('new-stop-lat').value = lat.toFixed(6);
          document.getElementById('new-stop-lng').value = lng.toFixed(6);
          if (stopEditMapInst) { stopEditMapInst.setView([lat, lng], 17); _placeStopEditMarker(lat, lng); }
          resultsEl.innerHTML = '';
          document.getElementById('stop-search-inp').value = item.display_name.split(',')[0];
        };
        resultsEl.appendChild(row);
      });
    })
    .catch(function() {
      if (resultsEl) resultsEl.innerHTML = '<div style="padding:8px 10px;font-size:12px;color:#c00;">Search failed – check connection</div>';
    });
}

// ── TIMETABLES ──
var editorTimetables = (function() {
  // Home → Alfreton Bus Station (Southbound) via A61
  var offsets   = [0, 4, 10, 15, 20, 28, 34, 39];
  var stopNames = [
    'Home', 'Holmewood Village', 'Heath, Crown Inn',
    'Stretton, Badger Box', 'Clay Cross, High Street',
    'Shirland, White Horse', 'South Normanton, Hall Lane', 'Alfreton Bus Station'
  ];
  var timingPts = [0, 4, 7]; // Home, Clay Cross, Alfreton
  var trips = [];
  var departures = [];
  for (var t = 0; t < 19; t++) departures.push(21*60+30+t*5);   // 21:30–23:00, 5-min headway
  for (var t = 1; t <= 6; t++) departures.push(23*60+t*10);     // 23:10–00:00, 10-min headway
  departures.forEach(function(base) {
    var h = Math.floor(base / 60) % 24, mn = base % 60;
    var tripId = ('0' + h).slice(-2) + ('0' + mn).slice(-2);
    trips.push({
      id: 'ttp_c55_' + tripId, tripId: tripId, direction: 'Southbound',
      dateFrom: '', dateTo: '',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      stops: stopNames.map(function(name, i) {
        var m = base + offsets[i], sh = Math.floor(m / 60) % 24, sm = m % 60;
        return { name: name, time: ('0'+sh).slice(-2)+':'+('0'+sm).slice(-2), isTimingPoint: timingPts.indexOf(i) >= 0 };
      })
    });
  });
  return [{ id: 'tt_c55_sb', name: 'C55 – Southbound', routeId: 'r3', trips: trips }];
})();
var currentTimetableId = '';
var currentTTTripIdx = -1;
var _ttEditTrip = null;
var _ttFromRouteDetail = false;

function getRouteOrderedStops(routeId, direction) {
  var route = editorRoutes.find(function(r) { return r.id === routeId; });
  if (!route || !route.stops) return [];
  var dirKey = direction === route.dir1 ? 'inbound' : 'outbound';
  var stopsObj = route.stops[dirKey] || {};
  var result = [];
  Object.keys(stopsObj).forEach(function(stageKey) {
    (stopsObj[stageKey] || []).forEach(function(s) {
      if (result.indexOf(s) < 0) result.push(s);
    });
  });
  return result;
}

function renderTimetableList() {
  var list = document.getElementById('timetable-list');
  if (!list) return;
  var filtered = (_ttFromRouteDetail && currentRouteIndex >= 0)
    ? editorTimetables.filter(function(tt) { return tt.routeId === editorRoutes[currentRouteIndex].id; })
    : editorTimetables;
  var ttLbl = document.getElementById('tt-count-lbl');
  if (ttLbl) ttLbl.textContent = filtered.length + ' defined';
  list.innerHTML = '';
  if (!filtered.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:#aaa;font-size:13px;">No timetables yet</div>';
    return;
  }
  filtered.forEach(function(tt) {
    var route = editorRoutes.find(function(r) { return r.id === tt.routeId; });
    var div = document.createElement('div');
    div.className = 'menu-btn';
    div.innerHTML = '<div><div class="mb-name">' + tt.name + '</div>'
      + '<div class="mb-sub">Route ' + (route ? route.name : '—') + ' · ' + tt.trips.length + ' trip' + (tt.trips.length !== 1 ? 's' : '') + '</div></div>'
      + '<div class="mb-arr">›</div>';
    div.onclick = (function(id) { return function() { openTimetable(id); }; })(tt.id);
    list.appendChild(div);
  });
}

function openRouteTimetables() {
  _ttFromRouteDetail = true;
  renderTimetableList();
  go('s-ed-timetables');
}

function openNewTimetable() {
  currentTimetableId = '';
  _ttEditTrip = null;
  var routeField = document.getElementById('tt-route-field');
  if (_ttFromRouteDetail) {
    if (routeField) routeField.style.display = 'none';
  } else {
    if (routeField) routeField.style.display = '';
    populateTTRouteSelect();
  }
  document.getElementById('tt-name').value = '';
  document.getElementById('tt-detail-sub').textContent = 'New timetable';
  var tripList = document.getElementById('tt-trip-list');
  if (tripList) tripList.innerHTML = '';
  go('s-ed-ttdetail');
}

function openTimetable(id) {
  currentTimetableId = id;
  var tt = editorTimetables.find(function(t) { return t.id === id; });
  if (!tt) return;
  var routeField = document.getElementById('tt-route-field');
  if (_ttFromRouteDetail) {
    if (routeField) routeField.style.display = 'none';
  } else {
    if (routeField) routeField.style.display = '';
    populateTTRouteSelect();
    document.getElementById('tt-route-sel').value = tt.routeId;
  }
  document.getElementById('tt-name').value = tt.name;
  document.getElementById('tt-detail-sub').textContent = tt.name;
  renderTTTripList();
  go('s-ed-ttdetail');
}

function populateTTRouteSelect() {
  var sel = document.getElementById('tt-route-sel');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select a route…</option>';
  editorRoutes.forEach(function(r) {
    var opt = document.createElement('option');
    opt.value = r.id; opt.textContent = r.name;
    sel.appendChild(opt);
  });
}

function ttRouteChanged() { /* route change doesn't auto-clear trips */ }

function saveTimetable() {
  var name = (document.getElementById('tt-name').value || '').trim();
  var routeId = _ttFromRouteDetail && currentRouteIndex >= 0
    ? editorRoutes[currentRouteIndex].id
    : document.getElementById('tt-route-sel').value;
  if (!name) { alert('Please enter a timetable name'); return; }
  if (!routeId) { alert('Please select a route'); return; }
  if (currentTimetableId) {
    var tt = editorTimetables.find(function(t) { return t.id === currentTimetableId; });
    if (tt) { tt.name = name; tt.routeId = routeId; }
  } else {
    var newId = 'tt' + Date.now();
    editorTimetables.push({ id: newId, name: name, routeId: routeId, trips: [] });
    currentTimetableId = newId;
  }
  renderTimetableList();
  go('s-ed-timetables');
}

function renderTTTripList() {
  var list = document.getElementById('tt-trip-list');
  if (!list) return;
  list.innerHTML = '';
  var tt = currentTimetableId ? editorTimetables.find(function(t) { return t.id === currentTimetableId; }) : null;
  if (!tt || !tt.trips.length) return;
  sortTTTrips(tt);
  var lbl = document.createElement('div');
  lbl.style.cssText = 'font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.4px;margin:8px 0 6px;';
  lbl.textContent = 'Trips';
  list.appendChild(lbl);
  tt.trips.forEach(function(trip, idx) {
    var card = document.createElement('div');
    card.style.cssText = 'background:#fff;border:1.5px solid #ddd;border-radius:10px;padding:12px 14px;margin-bottom:8px;cursor:pointer;';
    var daysStr = trip.days && trip.days.length ? trip.days.join(', ') : 'No days set';
    var dateStr = trip.dateFrom || trip.dateTo ? (trip.dateFrom || '?') + ' → ' + (trip.dateTo || '?') : 'No dates set';
    card.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">'
      + '<div style="font-size:14px;font-weight:700;color:#333;">' + (trip.tripId || '—') + '</div>'
      + '<div style="font-size:12px;color:#2c5f9e;font-weight:500;">' + (trip.direction || '') + '</div>'
      + '</div>'
      + '<div style="font-size:11px;color:#666;">' + daysStr + '</div>'
      + '<div style="font-size:11px;color:#aaa;margin-top:1px;">' + dateStr + '</div>';
    card.onclick = (function(i) { return function() { openTTTripEditor(i); }; })(idx);
    list.appendChild(card);
  });
}

function openNewTTTrip() {
  var routeId = _ttFromRouteDetail && currentRouteIndex >= 0
    ? editorRoutes[currentRouteIndex].id
    : document.getElementById('tt-route-sel').value;
  if (!routeId) { alert('Please select a route first'); return; }
  var route = editorRoutes.find(function(r) { return r.id === routeId; });
  if (!route) return;
  var testStops = getRouteOrderedStops(routeId, route.dir1);
  if (!testStops.length) {
    alert('Please add stops to this route (inbound direction) before creating a timetable.');
    return;
  }
  if (!currentTimetableId) {
    var name = (document.getElementById('tt-name').value || '').trim();
    if (!name) { alert('Please give the timetable a name first'); return; }
    var newId = 'tt' + Date.now();
    editorTimetables.push({ id: newId, name: name, routeId: routeId, trips: [] });
    currentTimetableId = newId;
  }
  _showTTDirPicker(routeId, route);
}

function _showTTDirPicker(routeId, route) {
  var container = document.getElementById('tt-dir-pick-btns');
  if (!container) return;
  container.innerHTML = '';
  var dirs = route.dirType === 'io' ? [route.dir1, route.dir2] : [route.dir1];
  var fs = route.fareStages || [];
  dirs.forEach(function(dir) {
    var dLow = (dir || '').toLowerCase();
    var out = dLow.includes('out') || dLow.includes('south') || dLow.includes('west') || dLow.includes('anti');
    var from = out ? (fs[fs.length - 1] || dir) : (fs[0] || dir);
    var to   = out ? (fs[0] || dir)             : (fs[fs.length - 1] || dir);
    var btn = document.createElement('button');
    btn.style.cssText = 'width:100%;padding:16px;border:1.5px solid #ccc;border-radius:10px;background:#fff;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:10px;text-align:center;';
    btn.textContent = from + ' → ' + to;
    btn.onclick = (function(d, rid) { return function() { confirmTTDirection(d, rid); }; })(dir, routeId);
    container.appendChild(btn);
  });
  showModal('m-tt-dir-pick');
}

function confirmTTDirection(dir, routeId) {
  hideModal('m-tt-dir-pick');
  if (!routeId) {
    var tt = editorTimetables.find(function(t) { return t.id === currentTimetableId; });
    routeId = tt ? tt.routeId : '';
  }
  currentTTTripIdx = -1;
  _ttEditTrip = {
    tripId: '',
    direction: dir,
    dateFrom: '', dateTo: '',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    stops: getRouteOrderedStops(routeId, dir).map(function(n) {
      return { name: n, time: '', isTimingPoint: false };
    })
  };
  var route = editorRoutes.find(function(r) { return r.id === routeId; });
  renderTTTripEditor(route);
  go('s-ed-tttrip');
}

function openTTTripEditor(idx) {
  var tt = editorTimetables.find(function(t) { return t.id === currentTimetableId; });
  if (!tt || !tt.trips[idx]) return;
  currentTTTripIdx = idx;
  _ttEditTrip = JSON.parse(JSON.stringify(tt.trips[idx]));
  var route = editorRoutes.find(function(r) { return r.id === tt.routeId; });
  renderTTTripEditor(route);
  go('s-ed-tttrip');
}

function renderTTTripEditor(route) {
  if (!route || !_ttEditTrip) return;
  document.getElementById('tttrip-id').value = _ttEditTrip.tripId || '';
  document.getElementById('tttrip-datefrom').value = _ttEditTrip.dateFrom || '';
  document.getElementById('tttrip-dateto').value = _ttEditTrip.dateTo || '';
  document.getElementById('tt-trip-sub').textContent = currentTTTripIdx < 0 ? 'New trip' : 'Edit trip · ' + (_ttEditTrip.tripId || '');

  // Show current direction as read-only label (direction chosen at creation via picker)
  var dirLbl = document.getElementById('tttrip-dir-label');
  if (dirLbl) dirLbl.textContent = _ttEditTrip.direction || '—';

  renderTTDayPickers();
  renderTTStopTable();
}

var _DAYS_ALL = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function getDaysPreset(days) {
  var s = (days || []).slice().sort(function(a,b){ return _DAYS_ALL.indexOf(a)-_DAYS_ALL.indexOf(b); });
  var str = s.join(',');
  if (str === 'Mon,Tue,Wed,Thu,Fri') return 'mf';
  if (str === 'Mon,Tue,Wed,Thu,Fri,Sat') return 'ms';
  if (str === 'Mon,Tue,Wed,Thu,Fri,Sat,Sun') return 'daily';
  if (str === 'Sat,Sun') return 'weekends';
  return 'custom';
}

function daysFromPreset(val) {
  if (val === 'mf')       return ['Mon','Tue','Wed','Thu','Fri'];
  if (val === 'ms')       return ['Mon','Tue','Wed','Thu','Fri','Sat'];
  if (val === 'daily')    return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  if (val === 'weekends') return ['Sat','Sun'];
  return _ttEditTrip.days.slice();
}

function ttDaysPresetChanged() {
  var val = document.getElementById('tttrip-days-sel').value;
  var custom = document.getElementById('tttrip-days-custom');
  if (val === 'custom') {
    if (custom) custom.style.display = 'flex';
    renderTTCustomDays();
  } else {
    if (custom) custom.style.display = 'none';
    _ttEditTrip.days = daysFromPreset(val);
  }
}

function renderTTCustomDays() {
  var container = document.getElementById('tttrip-days-custom');
  if (!container) return;
  container.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';
  container.innerHTML = '';
  _DAYS_ALL.forEach(function(day) {
    var active = _ttEditTrip.days && _ttEditTrip.days.indexOf(day) >= 0;
    var btn = document.createElement('button');
    btn.textContent = day;
    btn.style.cssText = 'padding:8px 10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid '
      + (active ? '#2c5f9e;background:#2c5f9e;color:#fff;' : '#ccc;background:#fff;color:#888;');
    btn.onclick = (function(d) {
      return function() {
        var i = _ttEditTrip.days.indexOf(d);
        if (i >= 0) _ttEditTrip.days.splice(i, 1);
        else _ttEditTrip.days.push(d);
        renderTTCustomDays();
      };
    })(day);
    container.appendChild(btn);
  });
}

function renderTTDayPickers() {
  var container = document.getElementById('tttrip-days');
  if (!container || !_ttEditTrip) return;
  container.innerHTML = '';
  _DAYS_ALL.forEach(function(day) {
    var active = _ttEditTrip.days && _ttEditTrip.days.indexOf(day) >= 0;
    var btn = document.createElement('button');
    btn.textContent = day.substring(0, 2);
    btn.style.cssText = 'flex:1;padding:8px 2px;border-radius:8px;border:1.5px solid '
      + (active ? '#2c5f9e' : '#ccc') + ';background:' + (active ? '#2c5f9e' : '#fff')
      + ';color:' + (active ? '#fff' : '#555') + ';font-size:12px;font-weight:600;cursor:pointer;';
    btn.onclick = (function(d) {
      return function() {
        if (!_ttEditTrip.days) _ttEditTrip.days = [];
        var i = _ttEditTrip.days.indexOf(d);
        if (i >= 0) _ttEditTrip.days.splice(i, 1); else _ttEditTrip.days.push(d);
        renderTTDayPickers();
      };
    })(day);
    container.appendChild(btn);
  });
}

function toggleTTTools(btn) {
  var panel = document.getElementById('tt-tools-panel');
  if (!panel) return;
  var open = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'block';
  btn.textContent = open ? 'Tools ▾' : 'Tools ▲';
}

function openTTModify() {
  document.getElementById('tt-modify-mins').value = '';
  document.getElementById('tt-modify-sign').textContent = '+';
  var plus = document.getElementById('tt-modify-sign-plus');
  var minus = document.getElementById('tt-modify-sign-minus');
  if (plus) { plus.style.background = '#2c5f9e'; plus.style.color = '#fff'; }
  if (minus) { minus.style.background = '#f0f0f0'; minus.style.color = '#333'; }
  showModal('m-tt-modify');
}

function applyTTModify() {
  var sign = document.getElementById('tt-modify-sign').textContent;
  var mins = parseInt(document.getElementById('tt-modify-mins').value) || 0;
  if (mins <= 0) { alert('Enter a number of minutes'); return; }
  if (sign === '-') mins = -mins;
  if (!_ttEditTrip || !_ttEditTrip.stops) return;
  _ttEditTrip.stops.forEach(function(stop) {
    if (!stop.time) return;
    var parts = stop.time.split(':');
    var total = parseInt(parts[0]) * 60 + parseInt(parts[1]) + mins;
    total = ((total % 1440) + 1440) % 1440;
    stop.time = String(Math.floor(total / 60)).padStart(2,'0') + ':' + String(total % 60).padStart(2,'0');
  });
  hideModal('m-tt-modify');
  renderTTStopTable();
}

function openTTDuplicate() {
  if (!_ttEditTrip) return;
  // Save current edits first
  saveTTTrip();
  // Find what we just saved
  var tt = editorTimetables.find(function(t) { return t.id === currentTimetableId; });
  if (!tt || !tt.trips.length) return;
  var src = JSON.parse(JSON.stringify(tt.trips[tt.trips.length - 1]));
  currentTTTripIdx = -1;
  _ttEditTrip = src;
  _ttEditTrip.id = undefined;
  _ttEditTrip.tripId = 'Copy of ' + src.tripId;
  var tt2 = editorTimetables.find(function(t) { return t.id === currentTimetableId; });
  var route = editorRoutes.find(function(r) { return r.id === (tt2 ? tt2.routeId : ''); });
  renderTTTripEditor(route);
  go('s-ed-tttrip');
}

var _multiTripSlots = [];

function openTTMultiTrip() {
  if (!_ttEditTrip || !_ttEditTrip.stops.length) { alert('Add stop times first'); return; }
  var firstTime = _ttEditTrip.stops.find(function(s){ return s.time; });
  if (!firstTime) { alert('At least one stop needs a time to calculate headway from'); return; }
  document.getElementById('mt-headway').value = '';
  document.getElementById('mt-lasttime').value = '';
  document.getElementById('mt-trip-ids').innerHTML = '';
  document.getElementById('mt-save-btn').style.display = 'none';
  document.getElementById('mt-autoid-btn').style.display = 'none';
  _multiTripSlots = [];
  showModal('m-tt-multitrip');
}

function calcMultiTrip() {
  var headway = parseInt(document.getElementById('mt-headway').value) || 0;
  var lastTimeStr = document.getElementById('mt-lasttime').value;
  if (!headway || headway < 1) { alert('Enter a headway in minutes'); return; }
  if (!lastTimeStr) { alert('Enter a last departure time'); return; }

  var firstStop = _ttEditTrip.stops.find(function(s){ return s.time; });
  var fp = firstStop.time.split(':');
  var baseMinutes = parseInt(fp[0]) * 60 + parseInt(fp[1]);
  var lp = lastTimeStr.split(':');
  var lastMinutes = parseInt(lp[0]) * 60 + parseInt(lp[1]);

  if (lastMinutes <= baseMinutes) { alert('Last departure must be after the base trip start time'); return; }

  _multiTripSlots = [];
  var cur = baseMinutes + headway;
  while (cur <= lastMinutes) {
    _multiTripSlots.push(cur);
    cur += headway;
  }
  if (!_multiTripSlots.length) { alert('No additional trips fit within the time range'); return; }

  var container = document.getElementById('mt-trip-ids');
  container.innerHTML = '<div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px;">Assign trip IDs (' + _multiTripSlots.length + ' trips)</div>';
  _multiTripSlots.forEach(function(mins, idx) {
    var h = String(Math.floor(mins / 60)).padStart(2,'0');
    var m = String(mins % 60).padStart(2,'0');
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:8px;';
    row.innerHTML = '<div style="font-size:13px;font-weight:600;color:#555;width:45px;flex-shrink:0;">' + h + ':' + m + '</div>'
      + '<input type="text" id="mt-tid-' + idx + '" placeholder="Trip ID" style="flex:1;border:1.5px solid #ccc;border-radius:8px;padding:9px 10px;font-size:13px;"/>';
    container.appendChild(row);
  });
  document.getElementById('mt-save-btn').style.display = 'block';
  document.getElementById('mt-autoid-btn').style.display = 'block';
}

function saveMultiTrip() {
  var tt = editorTimetables.find(function(t) { return t.id === currentTimetableId; });
  if (!tt) return;
  var firstStop = _ttEditTrip.stops.find(function(s){ return s.time; });
  var fp = firstStop.time.split(':');
  var baseMinutes = parseInt(fp[0]) * 60 + parseInt(fp[1]);

  var allValid = _multiTripSlots.every(function(mins, idx) {
    return (document.getElementById('mt-tid-' + idx).value || '').trim() !== '';
  });
  if (!allValid) { alert('Please assign a trip ID to every trip'); return; }

  _multiTripSlots.forEach(function(mins, idx) {
    var tripId = document.getElementById('mt-tid-' + idx).value.trim();
    var offset = mins - baseMinutes;
    var newTrip = JSON.parse(JSON.stringify(_ttEditTrip));
    newTrip.id = 'ttp' + Date.now() + idx;
    newTrip.tripId = tripId;
    newTrip.stops = newTrip.stops.map(function(stop) {
      if (!stop.time) return stop;
      var p = stop.time.split(':');
      var t = parseInt(p[0]) * 60 + parseInt(p[1]) + offset;
      t = ((t % 1440) + 1440) % 1440;
      return Object.assign({}, stop, { time: String(Math.floor(t/60)).padStart(2,'0') + ':' + String(t%60).padStart(2,'0') });
    });
    tt.trips.push(newTrip);
  });
  sortTTTrips(tt);
  hideModal('m-tt-multitrip');
  renderTTTripList();
  go('s-ed-ttdetail');
}

function renderTTStopTable() {
  var container = document.getElementById('tt-stop-table');
  if (!container || !_ttEditTrip || !_ttEditTrip.stops) return;
  container.innerHTML = '';
  _ttEditTrip.stops.forEach(function(stop, idx) {
    var tp = stop.isTimingPoint;
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 10px;margin-bottom:5px;border-radius:8px;'
      + (tp ? 'background:#e8f0fe;border:2px solid #2c5f9e;' : 'background:#f5f5f5;border:1.5px solid #e0e0e0;');

    var circle = document.createElement('div');
    circle.style.cssText = 'width:24px;height:24px;border-radius:50%;flex-shrink:0;cursor:pointer;transition:background 0.15s;'
      + (tp ? 'background:#2c5f9e;' : 'background:#ddd;border:2px solid #bbb;');
    circle.title = tp ? 'Timing point — tap to make stop' : 'Stop — tap to make timing point';
    circle.onclick = (function(i) {
      return function() {
        _ttEditTrip.stops[i].isTimingPoint = !_ttEditTrip.stops[i].isTimingPoint;
        renderTTStopTable();
      };
    })(idx);

    var nameDiv = document.createElement('div');
    nameDiv.style.cssText = 'flex:1;font-size:13px;'
      + (tp ? 'font-weight:700;color:#2c5f9e;' : 'font-weight:400;color:#555;');
    nameDiv.textContent = stop.name;

    var timeInp = document.createElement('input');
    timeInp.type = 'time';
    timeInp.value = stop.time || '';
    timeInp.style.cssText = 'border:1.5px solid #ccc;border-radius:6px;padding:6px 8px;font-size:13px;width:96px;';
    timeInp.addEventListener('change', (function(i) {
      return function() { _ttEditTrip.stops[i].time = this.value; };
    })(idx));

    row.appendChild(circle);
    row.appendChild(nameDiv);
    row.appendChild(timeInp);
    container.appendChild(row);
  });
}

function ttTripDirChanged() {
  var newDir = document.getElementById('tttrip-dir').value;
  if (!_ttEditTrip || newDir === _ttEditTrip.direction) return;
  var hasTime = _ttEditTrip.stops.some(function(s) { return s.time; });
  if (hasTime && !confirm('Changing direction will reset stop times. Continue?')) {
    document.getElementById('tttrip-dir').value = _ttEditTrip.direction;
    return;
  }
  _ttEditTrip.direction = newDir;
  var tt = editorTimetables.find(function(t) { return t.id === currentTimetableId; });
  var routeId = tt ? tt.routeId : '';
  _ttEditTrip.stops = getRouteOrderedStops(routeId, newDir).map(function(n) {
    return { name: n, time: '', isTimingPoint: false };
  });
  renderTTStopTable();
}

function fillAutoTripIds() {
  _multiTripSlots.forEach(function(mins, idx) {
    var inp = document.getElementById('mt-tid-' + idx);
    if (inp) inp.value = String(Math.floor(mins / 60)).padStart(2,'0') + String(mins % 60).padStart(2,'0');
  });
}

function edTimeToMins(hhmm) {
  if (!hhmm) return 0;
  var p = hhmm.split(':');
  return parseInt(p[0]) * 60 + parseInt(p[1]);
}

function validateTripStopTimes(stops) {
  var timed = stops.filter(function(s) { return s.time && s.time.trim(); });
  for (var i = 1; i < timed.length; i++) {
    var prev = edTimeToMins(timed[i-1].time);
    var curr = edTimeToMins(timed[i].time);
    var diff = curr - prev;
    if (diff < 0) diff += 24 * 60; // midnight crossing
    if (diff === 0 || diff > 330) {
      return timed[i].name + ' (' + timed[i].time + ') must be 1 min – 5½ hours after ' + timed[i-1].name + ' (' + timed[i-1].time + ')';
    }
  }
  return null;
}

function sortTTTrips(tt) {
  if (!tt || !tt.trips) return;
  tt.trips.sort(function(a, b) {
    var as = a.stops && a.stops.find(function(s) { return s.time; });
    var bs = b.stops && b.stops.find(function(s) { return s.time; });
    return edTimeToMins(as ? as.time : '00:00') - edTimeToMins(bs ? bs.time : '00:00');
  });
}

function saveTTTrip() {
  var tripId = (document.getElementById('tttrip-id').value || '').trim();
  if (!tripId) {
    var errEl = document.getElementById('tttrip-err');
    if (errEl) { errEl.textContent = 'Please enter a trip ID'; errEl.style.display = 'block'; }
    return;
  }
  var err = validateTripStopTimes(_ttEditTrip.stops);
  if (err) {
    var errEl = document.getElementById('tttrip-err');
    if (errEl) { errEl.textContent = err; errEl.style.display = 'block'; }
    return;
  }
  var errEl2 = document.getElementById('tttrip-err');
  if (errEl2) errEl2.style.display = 'none';
  _ttEditTrip.tripId    = tripId;
  _ttEditTrip.dateFrom  = document.getElementById('tttrip-datefrom').value;
  _ttEditTrip.dateTo    = document.getElementById('tttrip-dateto').value;
  var tt = editorTimetables.find(function(t) { return t.id === currentTimetableId; });
  if (!tt) return;
  if (currentTTTripIdx >= 0) {
    tt.trips[currentTTTripIdx] = _ttEditTrip;
  } else {
    _ttEditTrip.id = 'ttp' + Date.now();
    tt.trips.push(_ttEditTrip);
  }
  sortTTTrips(tt);
  _ttEditTrip = null;
  renderTTTripList();
  go('s-ed-ttdetail');
}

// ── CONFIG ──
var _cfgPreviewTimer = null;
var _cfgSecTimer     = null;
var _cfgPreviewIdx   = 0;
var _cfgPreviewStates = ['ontime', 'late', 'early', 'matched', 'unmatched'];
var _cfgPreviewLabels = { ontime: 'On time', late: 'Late', early: 'Early', matched: 'Matched', unmatched: 'Unmatched' };
var _cfgFontPref = 'white';

function renderConfig() { /* no-op — now navigates to sub-screens */ }

function renderClockConfig() {
  var cfg = appConfig;
  document.getElementById('cfg-early-mins').value      = cfg.early.mins;
  document.getElementById('cfg-early-color').value      = cfg.early.color;
  document.getElementById('cfg-late-mins').value        = cfg.late.mins;
  document.getElementById('cfg-late-color').value       = cfg.late.color;
  document.getElementById('cfg-ontime-color').value     = cfg.ontime.color;
  document.getElementById('cfg-matched-color').value    = cfg.matched.color;
  document.getElementById('cfg-unmatched-color').value  = cfg.unmatched.color;
  _cfgFontPref = cfg.clockFont || 'white';
  _updateFontBtns();
  _startCfgPreview();
}

function renderUnitsConfig() {
  _updateUnitBtns();
}

function _updateFontBtns() {
  var isWhite = _cfgFontPref === 'white';
  function style(id, active) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.border = active ? '2px solid #2c5f9e' : '2px solid #ddd';
    el.style.background = active ? '#2c5f9e' : '#fff';
    el.style.color = active ? '#fff' : '#333';
  }
  style('cfg-font-white', isWhite);
  style('cfg-font-black', !isWhite);
}

function _updateUnitBtns() {
  var cfg = appConfig;
  function sel(id, active) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.border = active ? '2px solid #2c5f9e' : '2px solid #ddd';
    el.style.background = active ? '#2c5f9e' : '#fff';
    el.style.color = active ? '#fff' : '#333';
  }
  sel('cfg-dist-miles', cfg.units.distance === 'miles');
  sel('cfg-dist-km',    cfg.units.distance === 'km');
  sel('cfg-speed-mph',  cfg.units.speed === 'mph');
  sel('cfg-speed-kph',  cfg.units.speed === 'kph');
  sel('cfg-fuel-mpg',   cfg.units.fuel === 'mpg');
  sel('cfg-fuel-lp100', cfg.units.fuel === 'l/100km');
}

function setCfgFont(f) {
  _cfgFontPref = f;
  _updateFontBtns();
  _renderCfgPreviewState(_cfgPreviewStates[_cfgPreviewIdx]);
}

function setCfgUnit(type, val) {
  appConfig.units[type] = val;
  _updateUnitBtns();
  if (typeof refreshUnitsDisplay === 'function') refreshUnitsDisplay();
}

function _readCfgColors() {
  return {
    ontime:    (document.getElementById('cfg-ontime-color')    || {}).value || appConfig.ontime.color,
    late:      (document.getElementById('cfg-late-color')      || {}).value || appConfig.late.color,
    early:     (document.getElementById('cfg-early-color')     || {}).value || appConfig.early.color,
    matched:   (document.getElementById('cfg-matched-color')   || {}).value || appConfig.matched.color,
    unmatched: (document.getElementById('cfg-unmatched-color') || {}).value || appConfig.unmatched.color
  };
}

function _renderCfgPreviewState(state) {
  var ick      = document.getElementById('cfg-preview-ick');
  var statusEl = document.getElementById('cfg-preview-status');
  if (!ick) return;
  var colors  = _readCfgColors();
  var allBg   = { ontime: colors.ontime, late: colors.late, early: colors.early, matched: colors.matched, unmatched: colors.unmatched };
  var fontCol = _cfgFontPref === 'black' ? '#111111' : '#ffffff';
  var subCol  = fontCol === '#ffffff' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  ick.style.background = allBg[state] || '';
  var timeEl = ick.querySelector('.ct');
  var dateEl = ick.querySelector('.cd');
  if (timeEl) timeEl.style.color = fontCol;
  if (dateEl) dateEl.style.color = subCol;
  if (statusEl) { statusEl.textContent = _cfgPreviewLabels[state] || ''; statusEl.style.color = subCol; }
}

function _tickCfgPreviewTime() {
  var ick = document.getElementById('cfg-preview-ick');
  if (!ick) { _stopCfgPreview(); return; }
  var n = new Date();
  var hh = String(n.getHours()).padStart(2,'0');
  var mm = String(n.getMinutes()).padStart(2,'0');
  var ss = String(n.getSeconds()).padStart(2,'0');
  var dd = String(n.getDate()).padStart(2,'0');
  var mo = String(n.getMonth()+1).padStart(2,'0');
  var yyyy = n.getFullYear();
  var timeEl = ick.querySelector('.ct');
  var dateEl = ick.querySelector('.cd');
  if (timeEl) timeEl.textContent = hh + ':' + mm + ':' + ss;
  if (dateEl) dateEl.textContent = dd + '/' + mo + '/' + yyyy;
}

function previewConfig() {
  _renderCfgPreviewState(_cfgPreviewStates[_cfgPreviewIdx]);
}

function _startCfgPreview() {
  _stopCfgPreview();
  _cfgPreviewIdx = 0;
  _tickCfgPreviewTime();
  _renderCfgPreviewState(_cfgPreviewStates[0]);
  _cfgPreviewTimer = setInterval(function() {
    _cfgPreviewIdx = (_cfgPreviewIdx + 1) % _cfgPreviewStates.length;
    _renderCfgPreviewState(_cfgPreviewStates[_cfgPreviewIdx]);
  }, 3000);
  _cfgSecTimer = setInterval(_tickCfgPreviewTime, 1000);
}

function _stopCfgPreview() {
  if (_cfgPreviewTimer) { clearInterval(_cfgPreviewTimer); _cfgPreviewTimer = null; }
  if (_cfgSecTimer)     { clearInterval(_cfgSecTimer);     _cfgSecTimer     = null; }
}

function saveClockConfig() {
  appConfig.early.mins      = parseInt(document.getElementById('cfg-early-mins').value)  || 1;
  appConfig.early.color     = document.getElementById('cfg-early-color').value;
  appConfig.late.mins       = parseInt(document.getElementById('cfg-late-mins').value)   || 5;
  appConfig.late.color      = document.getElementById('cfg-late-color').value;
  appConfig.ontime.color    = document.getElementById('cfg-ontime-color').value;
  appConfig.matched.color   = document.getElementById('cfg-matched-color').value;
  appConfig.unmatched.color = document.getElementById('cfg-unmatched-color').value;
  appConfig.clockFont = _cfgFontPref;
  _stopCfgPreview();
  go('s-ed-config');
}

function resetClockConfig() {
  var d = _APP_CONFIG_DEFAULTS;
  appConfig.early   = JSON.parse(JSON.stringify(d.early));
  appConfig.late    = JSON.parse(JSON.stringify(d.late));
  appConfig.ontime  = JSON.parse(JSON.stringify(d.ontime));
  appConfig.matched = JSON.parse(JSON.stringify(d.matched));
  appConfig.unmatched = JSON.parse(JSON.stringify(d.unmatched));
  appConfig.clockFont = d.clockFont;
  renderClockConfig();
}

function resetUnitsConfig() {
  appConfig.units = JSON.parse(JSON.stringify(_APP_CONFIG_DEFAULTS.units));
  _updateUnitBtns();
  if (typeof refreshUnitsDisplay === 'function') refreshUnitsDisplay();
}

// ── EDITOR INIT ──
function editorInit() {
  renderFareStageList();
  renderStopList();
  renderTicketTypeList();
  renderRouteList();
  renderVehicleList();
  renderDriverList();
  renderDutyList();
  updateAllStopArrows();
}
