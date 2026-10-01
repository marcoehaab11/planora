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
    ? '<path d="M9 68 C7 49 3 25 5 7 Q7 3 10 7 L18 58 Z M23 58 L31 7 Q34 3 36 7 C38 27 34 52 33 68 Z"/><path class="pulp" d="M10 63 Q7 29 8 13 L17 66 Z M25 66 L34 13 Q35 35 32 63 Z"/>'
    : type === 'premolar'
      ? '<path d="M15 69 Q11 43 12 7 Q14 3 17 8 L21 56 L25 8 Q28 3 30 7 Q31 42 27 69 Z"/><path class="pulp" d="M17 64 L16 14 L21 62 L26 14 L25 64 Z"/>'
      : '<path d="M15 70 Q16 31 19 6 Q21 2 23 6 Q27 35 27 70 Z"/><path class="pulp" d="M19 67 Q20 34 21 13 Q23 35 24 67 Z"/>';
  const crown = type === 'molar'
    ? 'M6 63 Q7 55 14 55 Q21 58 28 55 Q35 54 36 63 L36 84 Q34 92 26 93 L15 93 Q7 91 6 84 Z'
    : type === 'premolar'
      ? 'M10 63 Q12 55 21 54 Q30 55 32 63 L31 84 Q28 93 21 93 Q14 93 11 84 Z'
      : type === 'canine'
        ? 'M11 65 Q15 58 21 52 Q27 58 31 65 L29 86 Q25 93 21 94 Q17 93 13 86 Z'
        : 'M12 64 Q14 58 21 58 Q28 58 30 64 L30 87 Q26 94 21 94 Q16 94 12 87 Z';
  let overlay = '';
  if (record.treatment === 'root-canal') overlay = `<path d="M21 84 L21 11 M16 80 L12 32 M26 80 L30 32" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>`;
  if (record.treatment === 'crown') overlay = `<path d="${crown}" fill="${color}" fill-opacity=".14" stroke="${color}" stroke-width="3"/>`;
  if (record.treatment === 'bridge') overlay = `<path d="${crown}" fill="${color}" fill-opacity=".12" stroke="${color}" stroke-width="2.7"/><path d="M3 70 H39" stroke="${color}" stroke-width="3"/>`;
  if (record.treatment === 'extraction') overlay = `<path d="M8 22 L34 86 M34 22 L8 86" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
  if (record.treatment === 'implant') overlay = `<path d="M17 18 L25 18 L25 69 L17 69 Z" fill="${color}" fill-opacity=".35" stroke="${color}" stroke-width="1.5"/><path d="M15 26 L27 32 M15 37 L27 43 M15 48 L27 54 M15 59 L27 65" stroke="${color}" stroke-width="1.8"/>`;
  if (record.treatment === 'filling') overlay = `<path d="M13 64 Q21 60 29 64 L27 71 Q21 68 15 71 Z" fill="${color}" fill-opacity=".8"/>`;
  if (record.treatment === 'cleaning') overlay = `<path d="M21 65 v13 M16 71 h10 M30 58 v8 M27 62 h6" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
  return `<svg class="tooth-anatomy" viewBox="0 0 42 98" aria-hidden="true"><defs><linearGradient id="enamel-${number}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff"/><stop offset=".55" stop-color="#eef4f5"/><stop offset="1" stop-color="#d6e1e5"/></linearGradient></defs><g${lower ? ' transform="translate(0 98) scale(1 -1)"' : ''}><g class="root-shape" fill="#eff3f5" stroke="#d2dcdf" stroke-width="1.3">${roots}</g><path d="${crown}" fill="url(#enamel-${number})" stroke="#cbd6da" stroke-width="1.5"/><path d="M10 77 Q21 83 32 77" fill="none" stroke="#fff" stroke-width="2" opacity=".9"/>${overlay}</g></svg>`;
}

function surfaceSvg(record, type, number) {
  const color = statusColors[record.status];
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
    return `<path d="${path}" fill="${filled ? color : '#f5f8f9'}" fill-opacity="${filled ? '.88' : '1'}" stroke="#d8e2e5" stroke-width=".9"/>`;
  }).join('');
  let overlay = '';
  if (record.treatment === 'root-canal') overlay = `<circle cx="21" cy="21" r="5" fill="${color}"/><path d="M21 10 V32 M10 21 H32" stroke="${color}" stroke-width="1.8"/>`;
  if (record.treatment === 'crown') overlay = `<path d="M8 10 Q21 3 34 10 Q39 21 34 33 Q21 40 8 33 Q3 21 8 10 Z" fill="none" stroke="${color}" stroke-width="3"/>`;
  if (record.treatment === 'bridge') overlay = `<path d="M5 21 H37 M8 10 Q21 3 34 10 Q39 21 34 33 Q21 40 8 33 Q3 21 8 10 Z" fill="none" stroke="${color}" stroke-width="2.5"/>`;
  if (record.treatment === 'extraction') overlay = `<path d="M10 10 L32 32 M32 10 L10 32" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
  if (record.treatment === 'implant') overlay = `<circle cx="21" cy="21" r="8" fill="${color}" fill-opacity=".2" stroke="${color}" stroke-width="2"/><circle cx="21" cy="21" r="3" fill="${color}"/>`;
  if (record.treatment === 'cleaning') overlay = `<path d="M21 9 v8 M17 13 h8 M30 24 v6 M27 27 h6" stroke="${color}" stroke-width="2"/>`;
  return `<svg class="tooth-surface type-${type}" viewBox="0 0 42 42" aria-hidden="true"><path d="M8 10 Q21 3 34 10 Q39 21 34 33 Q21 40 8 33 Q3 21 8 10 Z" fill="#fff" stroke="#cbd7da" stroke-width="1.4"/>${regions}${overlay}</svg>`;
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
