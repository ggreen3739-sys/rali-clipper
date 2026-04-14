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

var editorFareStages = ['Town Centre', 'Hospital', 'Bus Station'];

var editorStops = [
  { name: 'Bus Station',   lat: '51.5074', lng: '-0.1278' },
  { name: 'High Street',   lat: '51.5080', lng: '-0.1265' },
  { name: 'Market Square', lat: '51.5090', lng: '-0.1250' },
  { name: 'Town Centre',   lat: '51.5100', lng: '-0.1240' },
  { name: 'Hospital',      lat: '51.5060', lng: '-0.1290' }
];

var editorTicketTypes = [
  { name: 'Adult Single',   category: 'Single fare' },
  { name: 'Child Single',   category: 'Single fare' },
  { name: 'Adult donation', category: 'Donation'    },
  { name: 'Child donation', category: 'Donation'    }
];

var editorRoutes = [
  {
    id: 'r1',
    name: 'Route 45',
    dirType: 'io',
    dir1: 'Inbound',
    dir2: 'Outbound',
    notes: '',
    fareStages: ['Town Centre', 'Hospital', 'Bus Station']
  },
  {
    id: 'r2',
    name: 'Rally route',
    dirType: 'io',
    dir1: 'Inbound',
    dir2: 'Outbound',
    notes: 'Generic rally service',
    fareStages: ['Start', 'End']
  }
];

var editorVehicles = [
  { fleet: '1234', reg: 'ABC 123D', make: 'AEC Routemaster',  capacity: 64 },
  { fleet: '5678', reg: 'XYZ 456E', make: 'Bristol VRT',       capacity: 70 },
  { fleet: '9012', reg: 'DEF 789F', make: 'Leyland Atlantean', capacity: 68 },
  { fleet: '3456', reg: 'GHI 012G', make: 'Daimler Fleetline', capacity: 72 }
];

var editorDrivers = [
  { name: 'John Smith',  number: '1042', notes: '' },
  { name: 'Sarah Jones', number: '2301', notes: '' }
];

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
    card.innerHTML =
      '<div style="display:flex;align-items:center;padding:10px 12px;gap:8px;">'
      + '<div style="flex:1;">'
      + '<div style="font-size:14px;font-weight:500;">' + stop.name + '</div>'
      + '<div style="font-size:11px;color:#888;">' + stop.lat + ', ' + stop.lng + '</div>'
      + '</div>'
      + '<button class="btn-sm">Edit</button>'
      + '<button class="btn-sm red" onclick="deleteStop(' + i + ')">Delete</button>'
      + '</div>';
    list.appendChild(card);
  });
}

function saveNewStop() {
  var name = document.getElementById('new-stop-name').value.trim();
  var lat  = document.getElementById('new-stop-lat').value.trim();
  var lng  = document.getElementById('new-stop-lng').value.trim();
  if (!name || !lat || !lng) return;
  editorStops.push({ name: name, lat: lat, lng: lng });
  document.getElementById('new-stop-name').value = '';
  document.getElementById('new-stop-lat').value = '';
  document.getElementById('new-stop-lng').value = '';
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
  editorTicketTypes.forEach(function(tt, i) {
    var card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '6px';
    card.innerHTML =
      '<div style="display:flex;align-items:center;padding:10px 12px;gap:8px;">'
      + '<div style="flex:1;">'
      + '<div style="font-size:14px;font-weight:500;">' + tt.name + '</div>'
      + '<div style="font-size:11px;color:#888;">' + tt.category + '</div>'
      + '</div>'
      + '<button class="btn-sm">Edit</button>'
      + '<button class="btn-sm red" onclick="deleteTicketType(' + i + ')">Delete</button>'
      + '</div>';
    list.appendChild(card);
  });
}

function saveNewTicketType() {
  var name = document.getElementById('new-tt-name').value.trim();
  var cat  = document.getElementById('new-tt-cat').value;
  if (!name) return;
  editorTicketTypes.push({ name: name, category: cat });
  document.getElementById('new-tt-name').value = '';
  renderTicketTypeList();
  go('s-ed-tickettypes');
}

function deleteTicketType(i) {
  editorTicketTypes.splice(i, 1);
  renderTicketTypeList();
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
    fareStages: []
  });
  document.getElementById('new-route-name').value = '';
  document.getElementById('new-route-notes').value = '';
  renderRouteList();
  go('s-ed-routes');
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
    var allStops = Array.from(scroll.querySelectorAll('.stop-item-ed'));
    allStops.forEach(function(stop, i) {
      var btns = stop.querySelectorAll('.arr-btn');
      if (btns.length >= 2) {
        btns[0].disabled = (i === 0);
        btns[1].disabled = (i === allStops.length - 1);
      }
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

// ── APPLY RULE PREVIEW ──
function updatePreview() {
  var op      = document.getElementById('rule-op');
  var val     = document.getElementById('rule-val');
  var preview = document.getElementById('rule-preview');
  if (!op || !val || !preview) return;
  var v = parseFloat(val.value) || 0;
  var result = BASE_MAX;
  if      (op.value === 'multiply')  result = BASE_MAX * v;
  else if (op.value === 'divide')    result = v !== 0 ? BASE_MAX / v : 0;
  else if (op.value === 'add')       result = BASE_MAX + v;
  else if (op.value === 'subtract')  result = BASE_MAX - v;
  else if (op.value === 'cap')       result = Math.min(BASE_MAX, v);
  preview.textContent = '£' + BASE_MAX.toFixed(2) + ' → £' + Math.max(0, result).toFixed(2);
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

// ── EDITOR INIT ──
function editorInit() {
  renderFareStageList();
  renderStopList();
  renderTicketTypeList();
  renderRouteList();
  renderVehicleList();
  renderDriverList();
  updateAllStopArrows();
}
