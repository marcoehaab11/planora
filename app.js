const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'أغلق القائمة' : 'افتح القائمة');
  mobileNav.hidden = !open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'افتح القائمة');
}));

const content = window.PLANORA_CONTENT;
document.querySelector('#sample-patient-name').textContent = content.patient.name;
document.querySelector('#sample-patient-avatar').textContent = content.patient.name.trim().charAt(0);
document.querySelector('#sample-patient-id').textContent = `#${content.patient.id}`;
document.querySelector('#sample-appointment-title').textContent = content.appointment.title;
document.querySelector('#sample-appointment-time').textContent = content.appointment.time;
const emailLink = document.querySelector('#contact-email');
emailLink.textContent = content.contactEmail;
emailLink.href = `mailto:${content.contactEmail}`;
document.querySelector('#contact-city').textContent = content.contactCity;

const statusColors = { existing:'#10b9c5', planned:'#8228a8', progress:'#2664bd', rejected:'#c63a54', completed:'#4cad83' };
const statusLabels = { existing:'موجود', planned:'مخطط', progress:'جارٍ', rejected:'مرفوض', completed:'مكتمل' };
const treatmentLabels = { none:'بدون إجراء', filling:'حشو', 'root-canal':'علاج عصب', crown:'تاج', extraction:'خلع', implant:'زرعة', bridge:'جسر', cleaning:'تنظيف' };
const surfaceLabels = { M:'إنسي', D:'بعيد', O:'إطباقي', B:'دهليزي', L:'لساني/حنكي' };
const surfacePaths = {
  B:'M9 10 Q21 3 33 10 L27 16 L15 16 Z', L:'M15 26 L27 26 L33 32 Q21 39 9 32 Z',
  M:'M9 10 L15 16 L15 26 L9 32 Q4 21 9 10 Z', D:'M33 10 Q38 21 33 32 L27 26 L27 16 Z',
  O:'M15 16 L27 16 L27 26 L15 26 Z'
};
const jaws = {
  upper:[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28],
  lower:[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]
};
const chart = document.querySelector('#odontogram');
const chartScroll = document.querySelector('.odontogram-scroll');
const nameEl = document.querySelector('#selected-tooth');
const procedureEl = document.querySelector('#selected-procedure');
const previewEl = document.querySelector('#selection-preview');
const noteEl = document.querySelector('#tooth-note');
const statusEl = document.querySelector('#tooth-status');
const editor = document.querySelector('#tooth-editor');
const editButton = document.querySelector('#edit-tooth');
const treatmentInput = document.querySelector('#tooth-treatment-input');
const statusInput = document.querySelector('#tooth-status-input');
const noteInput = document.querySelector('#tooth-note-input');
const surfaceFieldset = document.querySelector('#surface-fieldset');
const surfaceInputs = [...surfaceFieldset.querySelectorAll('input')];
const storageKey = 'planora-demo-odontogram-v2';
let changes = {};
try { changes = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { changes = {}; }
let selectedNumber = 16;

function toothType(number) {
  const position = number % 10;
  return position >= 6 ? 'molar' : position >= 4 ? 'premolar' : position === 3 ? 'canine' : 'incisor';
}
function toothName(number) {
  const type = toothType(number);
  const part = type === 'molar' ? 'ضرس' : type === 'premolar' ? 'ضاحك' : type === 'canine' ? 'ناب' : 'قاطع';
  const jaw = number < 30 ? 'علوي' : 'سفلي';
  const side = [1,4].includes(Math.floor(number / 10)) ? 'أيمن' : 'أيسر';
  return `${part} ${jaw} ${side}`;
}
function recordFor(number) {
  const source = { treatment:'none', status:'existing', surfaces:[], note:'لا توجد ملاحظات مسجلة.', ...content.toothExamples[number], ...changes[number] };
  const treatment = Object.hasOwn(treatmentLabels, source.treatment) ? source.treatment : 'none';
  const status = Object.hasOwn(statusLabels, source.status) ? source.status : 'existing';
  const surfaces = Array.isArray(source.surfaces) ? source.surfaces.filter(code => Object.hasOwn(surfaceLabels, code)) : [];
  return { treatment, status, surfaces, note:typeof source.note === 'string' ? source.note.slice(0,160) : '' };
}

function anatomySvg(number, record, lower) {
  const type = toothType(number), color = statusColors[record.status];
  const roots = type === 'molar'
    ? lower
      ? '<path d="M9 68 C7 54 5 32 5 11 Q5 5 8 7 C13 23 15 46 18 66 Z M24 66 C28 44 30 22 35 7 Q38 4 37 12 C37 33 35 55 33 68 Z"/><path class="pulp" d="M11 64 C9 41 8 22 8 15 L16 65 Z M26 65 L34 15 C34 32 32 52 31 65 Z"/>'
      : '<path d="M8 68 C6 54 4 31 5 12 Q5 5 8 7 C12 19 14 44 17 65 Z M17 67 C18 46 18 24 20 11 Q21 6 23 11 C25 33 24 54 25 67 Z M26 65 C30 42 32 19 35 7 Q38 4 37 13 C37 38 35 57 33 68 Z"/><path class="pulp" d="M10 63 C8 40 8 22 8 15 L15 64 Z M20 62 L21 17 L23 62 Z M28 64 L35 14 Q35 38 32 64 Z"/>'
    : type === 'premolar'
      ? lower
        ? '<path d="M15 69 C14 49 15 23 18 7 Q21 2 24 7 C27 26 28 49 27 69 Z"/><path class="pulp" d="M19 65 L20 15 Q21 11 22 16 L24 65 Z"/>'
        : '<path d="M14 69 C12 49 11 26 12 10 Q13 4 16 8 L21 58 L26 8 Q29 4 30 10 C31 29 30 50 28 69 Z"/><path class="pulp" d="M17 65 L16 15 L21 61 L26 15 L25 65 Z"/>'
      : type === 'canine'
        ? '<path d="M14 69 C15 46 17 19 19 5 Q21 1 23 5 C26 22 28 48 28 69 Z"/><path class="pulp" d="M19 65 C20 42 20 22 21 11 C23 31 24 49 24 65 Z"/>'
        : '<path d="M16 70 C16 46 18 22 19 7 Q21 2 23 7 C25 25 27 49 26 70 Z"/><path class="pulp" d="M19 65 L21 14 L23 65 Z"/>';
  const crown = type === 'molar'
    ? 'M5 67 C5 60 9 56 14 57 Q18 54 21 58 Q26 54 30 57 C36 56 38 63 37 70 L36 85 C35 92 31 95 25 94 Q21 92 17 94 C11 95 7 92 6 86 Z'
    : type === 'premolar'
      ? 'M10 67 Q11 60 17 57 Q21 52 25 57 Q31 59 32 67 L31 84 Q29 93 21 94 Q13 93 11 84 Z'
      : type === 'canine'
        ? 'M11 67 Q13 61 18 57 L21 51 L24 57 Q30 61 31 67 L29 86 Q26 93 21 95 Q16 93 13 86 Z'
        : 'M12 65 Q13 58 18 58 L25 58 Q30 59 31 65 L30 86 Q28 94 21 95 Q14 94 12 86 Z';
  let overlay = '';
  if (record.treatment === 'root-canal') overlay = `<path d="M21 84 L21 11 M16 80 L12 32 M26 80 L30 32" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>`;
  if (record.treatment === 'crown') overlay = `<path d="${crown}" fill="${color}" fill-opacity=".14" stroke="${color}" stroke-width="3"/>`;
  if (record.treatment === 'bridge') overlay = `<path d="${crown}" fill="${color}" fill-opacity=".12" stroke="${color}" stroke-width="2.7"/><path d="M3 70 H39" stroke="${color}" stroke-width="3"/>`;
  if (record.treatment === 'extraction') overlay = `<path d="M8 22 L34 86 M34 22 L8 86" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
  if (record.treatment === 'implant') overlay = `<path d="M17 18 L25 18 L25 69 L17 69 Z" fill="${color}" fill-opacity=".35" stroke="${color}" stroke-width="1.5"/><path d="M15 26 L27 32 M15 37 L27 43 M15 48 L27 54 M15 59 L27 65" stroke="${color}" stroke-width="1.8"/>`;
  if (record.treatment === 'filling') overlay = `<path d="M13 64 Q21 60 29 64 L27 71 Q21 68 15 71 Z" fill="${color}" fill-opacity=".8"/>`;
  if (record.treatment === 'cleaning') overlay = `<path d="M21 65 v13 M16 71 h10 M30 58 v8 M27 62 h6" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
  const chamber = type === 'molar'
    ? 'M11 65 Q16 62 21 65 Q26 62 32 65 L31 79 Q21 84 11 79 Z'
    : type === 'premolar' ? 'M16 64 Q21 61 26 64 L25 80 Q21 83 17 80 Z' : 'M19 65 Q21 63 23 65 L23 79 Q21 82 19 79 Z';
  return `<svg class="tooth-anatomy" viewBox="0 0 42 98" aria-hidden="true"><defs><linearGradient id="enamel-${number}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff"/><stop offset=".34" stop-color="#f8fbfb"/><stop offset=".72" stop-color="#e7f0f2"/><stop offset="1" stop-color="#cfdee3"/></linearGradient><linearGradient id="root-${number}" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#dfe9ed"/><stop offset=".45" stop-color="#fcffff"/><stop offset="1" stop-color="#dce8ed"/></linearGradient></defs><g${lower ? ' transform="translate(0 98) scale(1 -1)"' : ''}><g class="root-shape" fill="url(#root-${number})" stroke="#d3dfe3" stroke-width="1.2">${roots}</g><path d="${crown}" fill="url(#enamel-${number})" stroke="#c9d7dc" stroke-width="1.35"/><path d="${chamber}" fill="#e69da9" opacity=".48"/><path d="M10 78 Q21 83 32 78 M11 67 Q14 63 17 63" fill="none" stroke="#fff" stroke-width="1.6" opacity=".82" stroke-linecap="round"/>${overlay}</g></svg>`;
}

function surfaceSvg(record, type, number) {
  const color = statusColors[record.status];
  const outer = type === 'molar'
    ? 'M9 8 C13 5 17 7 21 8 C26 6 31 5 34 9 C38 13 36 18 36 21 C38 27 36 32 32 35 C27 38 24 36 21 35 C17 38 12 37 8 34 C5 30 6 25 6 21 C5 17 5 12 9 8 Z'
    : type === 'premolar'
      ? 'M13 8 C17 5 25 5 29 8 C34 12 35 18 34 23 C34 30 29 36 21 37 C13 36 8 30 8 23 C7 17 9 11 13 8 Z'
      : type === 'canine'
        ? 'M20 6 Q23 6 27 11 C32 16 34 24 29 31 Q25 37 21 38 Q17 37 13 31 C8 24 10 16 15 11 Q19 6 20 6 Z'
        : 'M16 7 Q21 5 26 7 C31 11 32 28 27 34 Q21 39 15 34 C10 28 11 11 16 7 Z';
  const grooves = type === 'molar'
    ? '<path d="M10 12 Q15 17 20 16 Q25 17 32 12 M11 31 Q16 26 21 27 Q27 26 32 31 M20 11 Q18 18 21 21 Q24 25 21 32 M11 21 Q16 20 21 21 Q27 20 32 21"/><path d="M12 14 Q15 12 17 15 M26 15 Q29 12 31 15 M12 28 Q15 31 17 28 M26 28 Q29 31 31 28" stroke="#fff"/>'
    : type === 'premolar'
      ? '<path d="M13 12 Q18 18 21 21 Q25 18 29 12 M12 30 Q18 25 21 22 Q25 25 30 30 M21 13 Q19 21 21 29"/><path d="M14 14 Q17 12 19 15 M24 15 Q27 12 29 14" stroke="#fff"/>'
      : type === 'canine'
        ? '<path d="M21 11 Q16 18 21 23 Q26 18 21 11 M13 25 Q20 28 21 31 Q23 28 29 25"/>'
        : '<path d="M16 12 Q21 15 26 12 M16 29 Q21 25 26 29 M21 14 Q19 21 21 28"/>';
  const regions = Object.entries(surfacePaths).map(([code, path]) => {
    const quadrant = Math.floor(number / 10);
    let physicalSurface = code;
    if ([1,4].includes(quadrant)) {
      if (code === 'M') physicalSurface = 'D';
      if (code === 'D') physicalSurface = 'M';
    }
    if ([3,4].includes(quadrant)) {
      if (code === 'B') physicalSurface = 'L';
      if (code === 'L') physicalSurface = 'B';
    }
    const filled = record.treatment === 'filling' && record.surfaces.includes(physicalSurface);
    return `<path d="${path}" fill="${filled ? color : 'transparent'}" fill-opacity="${filled ? '.88' : '1'}" stroke="#d7e2e5" stroke-opacity=".65" stroke-width=".7"/>`;
  }).join('');
  let overlay = '';
  if (record.treatment === 'root-canal') overlay = `<circle cx="21" cy="21" r="5" fill="${color}"/><path d="M21 10 V32 M10 21 H32" stroke="${color}" stroke-width="1.8"/>`;
  if (record.treatment === 'crown') overlay = `<path d="${outer}" fill="${color}" fill-opacity=".1" stroke="${color}" stroke-width="3"/>`;
  if (record.treatment === 'bridge') overlay = `<path d="M5 21 H37 M8 25 H34" stroke="${color}" stroke-width="2.5"/><path d="${outer}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
  if (record.treatment === 'extraction') overlay = `<path d="M10 10 L32 32 M32 10 L10 32" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
  if (record.treatment === 'implant') overlay = `<circle cx="21" cy="21" r="8" fill="${color}" fill-opacity=".2" stroke="${color}" stroke-width="2"/><circle cx="21" cy="21" r="3" fill="${color}"/>`;
  if (record.treatment === 'cleaning') overlay = `<path d="M21 9 v8 M17 13 h8 M30 24 v6 M27 27 h6" stroke="${color}" stroke-width="2"/>`;
  return `<svg class="tooth-surface type-${type}" viewBox="0 0 42 42" aria-hidden="true"><defs><radialGradient id="bite-${number}"><stop stop-color="#ffffff"/><stop offset=".55" stop-color="#f4f8f9"/><stop offset="1" stop-color="#d9e5e9"/></radialGradient><clipPath id="bite-clip-${number}"><path d="${outer}"/></clipPath></defs><path d="${outer}" fill="url(#bite-${number})" stroke="#c7d5d9" stroke-width="1.25"/><g fill="none" stroke="#c8d5d9" stroke-width="1.1" stroke-linecap="round" opacity=".83">${grooves}</g><g clip-path="url(#bite-clip-${number})">${regions}</g><path d="${outer}" fill="none" stroke="#d3e0e4" stroke-width=".8"/>${overlay}</svg>`;
}

function makeToothButton(number, lower) {
  const record = recordFor(number);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `odontogram-tooth type-${toothType(number)}`;
  button.dataset.tooth = number;
  button.dataset.status = record.treatment === 'none' ? 'none' : record.status;
  button.style.setProperty('--tooth-accent', record.treatment === 'none' ? '#d4dcde' : statusColors[record.status]);
  button.setAttribute('aria-pressed', String(number === selectedNumber));
  button.setAttribute('aria-label', `السن ${number}، ${toothName(number)}، ${treatmentLabels[record.treatment]}${record.treatment !== 'none' ? `، ${statusLabels[record.status]}` : ''}`);
  button.innerHTML = `<span class="tooth-marker" aria-hidden="true"></span>${lower ? `<span class="tooth-number">${number % 10}</span>${surfaceSvg(record,toothType(number),number)}${anatomySvg(number,record,true)}` : `${anatomySvg(number,record,false)}${surfaceSvg(record,toothType(number),number)}<span class="tooth-number">${number % 10}</span>`}`;
  button.addEventListener('click', () => selectTooth(number));
  return button;
}

function renderChart() {
  const scrollLeft = chartScroll.scrollLeft;
  chart.replaceChildren();
  for (const [jaw, numbers] of Object.entries(jaws)) {
    const group = document.createElement('div');
    group.className = `odontogram-jaw jaw-${jaw}`;
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', jaw === 'upper' ? 'الفك العلوي' : 'الفك السفلي');
    numbers.forEach(number => group.append(makeToothButton(number, jaw === 'lower')));
    chart.append(group);
  }
  chartScroll.scrollLeft = scrollLeft;
}

function updateSurfaceVisibility() {
  surfaceFieldset.hidden = treatmentInput.value !== 'filling';
  if (!surfaceFieldset.hidden && !surfaceInputs.some(input => input.checked)) {
    surfaceInputs.find(input => input.value === 'O').checked = true;
  }
}

function selectTooth(number) {
  selectedNumber = number;
  const record = recordFor(number);
  chart.querySelectorAll('.odontogram-tooth').forEach(button => {
    const selected = Number(button.dataset.tooth) === number;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  nameEl.textContent = `${toothName(number)} · ${number}`;
  procedureEl.textContent = record.treatment === 'filling' && record.surfaces.length
    ? `${treatmentLabels[record.treatment]} · ${record.surfaces.map(code => `${surfaceLabels[code]} (${code})`).join('، ')}`
    : treatmentLabels[record.treatment];
  previewEl.innerHTML = surfaceSvg(record, toothType(number), number);
  noteEl.textContent = record.note || 'لا توجد ملاحظات مسجلة.';
  statusEl.textContent = record.treatment === 'none' ? 'سليم' : statusLabels[record.status];
  statusEl.dataset.status = record.treatment === 'none' ? 'none' : record.status;
  treatmentInput.value = record.treatment;
  statusInput.value = record.status;
  noteInput.value = record.note === 'لا توجد ملاحظات مسجلة.' ? '' : record.note;
  surfaceInputs.forEach(input => { input.checked = record.surfaces.includes(input.value); });
  updateSurfaceVisibility();
  editor.hidden = true;
  editButton.setAttribute('aria-expanded', 'false');
}

renderChart();
selectTooth(selectedNumber);
editButton.addEventListener('click', () => {
  editor.hidden = !editor.hidden;
  editButton.setAttribute('aria-expanded', String(!editor.hidden));
  if (!editor.hidden) treatmentInput.focus();
});
treatmentInput.addEventListener('change', updateSurfaceVisibility);
editor.addEventListener('submit', event => {
  event.preventDefault();
  const treatment = treatmentInput.value;
  const surfaces = treatment === 'filling' ? surfaceInputs.filter(input => input.checked).map(input => input.value) : [];
  changes[selectedNumber] = { treatment, status:statusInput.value, surfaces, note:noteInput.value.trim() };
  try { localStorage.setItem(storageKey, JSON.stringify(changes)); } catch {}
  renderChart();
  selectTooth(selectedNumber);
  editButton.focus();
});

const voiceButton = document.querySelector('#voice-note');
const voiceFeedback = document.querySelector('#voice-feedback');
voiceButton.addEventListener('click', () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceFeedback.textContent = 'الإملاء الصوتي غير متاح في هذا المتصفح؛ يمكنك كتابة الملاحظة.';
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'ar-EG';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onresult = event => {
    const spoken = event.results[0][0].transcript.trim();
    noteInput.value = [noteInput.value.trim(), spoken].filter(Boolean).join(' ').slice(0, 160);
    editor.hidden = false;
    editButton.setAttribute('aria-expanded', 'true');
    voiceFeedback.textContent = 'تمت إضافة الكلام للملاحظة. راجعها ثم احفظ.';
    noteInput.focus();
  };
  recognition.onerror = () => { voiceFeedback.textContent = 'تعذّر الإملاء الصوتي. يمكنك كتابة الملاحظة.'; };
  recognition.onend = () => { voiceButton.disabled = false; };
  try {
    recognition.start();
    voiceButton.disabled = true;
    voiceFeedback.textContent = 'أتحدث الآن...';
  } catch {
    voiceButton.disabled = false;
    voiceFeedback.textContent = 'تعذّر تشغيل الميكروفون في هذا المتصفح.';
  }
});
