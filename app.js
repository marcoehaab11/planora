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

const teeth = {
  upper: [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28],
  lower: [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]
};
const examples = content.toothExamples;
const storageKey = 'planora-demo-teeth-v1';
let changes = {};
try { changes = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { changes = {}; }
const nameEl = document.querySelector('#selected-tooth');
const noteEl = document.querySelector('#tooth-note');
const statusEl = document.querySelector('#tooth-status');
const editor = document.querySelector('#tooth-editor');
const editButton = document.querySelector('#edit-tooth');
const noteInput = document.querySelector('#tooth-note-input');
const statusInput = document.querySelector('#tooth-status-input');
let selectedButton;

function selectTooth(button) {
  if (selectedButton) {
    selectedButton.classList.remove('selected');
    selectedButton.setAttribute('aria-pressed', 'false');
  }
  selectedButton = button;
  button.classList.add('selected');
  button.setAttribute('aria-pressed', 'true');
  const number = Number(button.dataset.tooth);
  const example = examples[number] || {name:`السن رقم ${number}`,note:'لا توجد ملاحظات مسجلة في هذا المثال',status:'سليم'};
  const record = changes[number] || example;
  nameEl.textContent = `${example.name} · ${number}`;
  noteEl.textContent = record.note;
  statusEl.textContent = record.status;
  noteInput.value = record.note;
  statusInput.value = record.status;
  editor.hidden = true;
  editButton.setAttribute('aria-expanded', 'false');
}

Object.entries(teeth).forEach(([jaw, numbers]) => {
  const row = document.querySelector(`#${jaw}-teeth`);
  numbers.forEach(number => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tooth-button${examples[number] || changes[number] ? ' has-note' : ''}`;
    button.dataset.tooth = number;
    button.setAttribute('aria-label', `السن رقم ${number}`);
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `<span>${number}</span>`;
    button.addEventListener('click', () => selectTooth(button));
    row.append(button);
  });
});

selectTooth(document.querySelector('[data-tooth="16"]'));

editButton.addEventListener('click', () => {
  editor.hidden = !editor.hidden;
  editButton.setAttribute('aria-expanded', String(!editor.hidden));
  if (!editor.hidden) noteInput.focus();
});
editor.addEventListener('submit', event => {
  event.preventDefault();
  if (!selectedButton) return;
  const note = noteInput.value.trim();
  if (!note) return;
  const number = selectedButton.dataset.tooth;
  changes[number] = {note,status:statusInput.value};
  try { localStorage.setItem(storageKey, JSON.stringify(changes)); } catch {}
  selectedButton.classList.add('has-note');
  selectTooth(selectedButton);
  editButton.focus();
});
