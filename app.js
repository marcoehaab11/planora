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

const teeth = {
  upper: [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28],
  lower: [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]
};
const examples = {
  11: ['قاطع علوي أيمن', 'فحص دوري · لا توجد ملاحظات', 'سليم'],
  16: ['ضرس علوي أيمن', 'حشو سابق · متابعة في الزيارة القادمة', 'متابعة'],
  24: ['ضاحك علوي أيسر', 'خطة علاج تجريبية · مراجعة الأشعة', 'خطة علاج'],
  36: ['ضرس سفلي أيسر', 'جلسة علاج جذور · مرحلة أولى', 'قيد العلاج'],
  46: ['ضرس سفلي أيمن', 'حشو تجريبي · مراجعة بعد شهر', 'متابعة']
};
const nameEl = document.querySelector('#selected-tooth');
const noteEl = document.querySelector('#tooth-note');
const statusEl = document.querySelector('#tooth-status');
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
  const example = examples[number] || [`السن رقم ${number}`, 'لا توجد ملاحظات مسجلة في هذا المثال', 'سليم'];
  nameEl.textContent = `${example[0]} · ${number}`;
  noteEl.textContent = example[1];
  statusEl.textContent = example[2];
}

Object.entries(teeth).forEach(([jaw, numbers]) => {
  const row = document.querySelector(`#${jaw}-teeth`);
  numbers.forEach(number => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tooth-button${examples[number] ? ' has-note' : ''}`;
    button.dataset.tooth = number;
    button.setAttribute('aria-label', `السن رقم ${number}`);
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `<span>${number}</span>`;
    button.addEventListener('click', () => selectTooth(button));
    row.append(button);
  });
});

selectTooth(document.querySelector('[data-tooth="16"]'));
