import Control from './control.js';
import keys from './keysdata.js';
import './style.scss';

const wrapper = new Control(document.body, 'div', 'wrapper');
const signal = new Control(wrapper.node, 'div', 'signal');
signal.node.textContent = 'RS School Virtual Keyboard';
const editor = new Control(wrapper.node, 'textarea', 'editor');
editor.node.value = 'Начальный текст\nдля проверки\nСмена раскладки клавиатуры - левые Shift + Ctrl';
const info = new Control(document.body, 'div', 'info');
info.node.innerText = 'Клавиатура создана для операционной системы Windows\nДля переключения раскладки языка комбинация: левые Shift + Ctrl\n';
info.node.innerText += 'Клавиша Shift фиксируется на 1 нажатие кнопки\nCapsLock - первое нажатие включает, второе выключает';

let globEnglish = true; // true, если включен английский; false, если русский
let globShift = false;
let globCaps = false;
let shiftLeft = false;
let shiftRight = false;

const keyboard = new Control(wrapper.node, 'div', 'keyboard');
keys.forEach((keydata) => {
  const keyElem = new Control(keyboard.node, 'div', 'key');
  keyElem.node.dataset.keycode = keydata.code;
  if (keydata.width !== undefined) keyElem.node.classList.add(keydata.width);
  if (keydata.special !== undefined) keyElem.node.classList.add('key__special');
  keyElem.node.innerHTML = `<span class="noextra"><span class="span-eng">${keydata.charEng}</span><span class="span-rus">${keydata.charRus}</span></span>`;
  if (keydata.extraEng !== undefined) {
    keyElem.node.classList.add('key__extra');
    keyElem.node.innerHTML += `<span class="extra"><span class="span-eng">${keydata.extraEng}</span><span class="span-rus">${keydata.extraRus}</span></span>`;
  }
});

function switchLanguage() {
  globEnglish = !globEnglish;
  localStorage.setItem('keyb-lang', globEnglish);
  if (globEnglish) {
    signal.node.classList.add('switch-eng');
    signal.node.classList.remove('switch-rus');
  } else {
    signal.node.classList.add('switch-rus');
    signal.node.classList.remove('switch-eng');
  }
}

function getTextPosition() {
  const text = editor.node.value.split('\n');
  const cursorStart = editor.node.selectionStart;
  let countPos = cursorStart;
  let countLine = -1;
  while (countPos >= 0) {
    countLine += 1;
    countPos -= text[countLine].length + 1;
  }
  countPos += text[countLine].length + 1;
  return {
    line: countLine,
    pos: countPos,
    maxLine: text.length - 1,
    lastLineLastPos: text[text.length - 1].length,
  };
}

function setTextPosition(obj) {
  const text = editor.node.value.split('\n');
  let countPos = 0;
  for (let i = 0; i < obj.line; i += 1) {
    countPos += text[i].length + 1;
  }
  countPos += obj.pos > text[obj.line].length ? text[obj.line].length : obj.pos;
  return countPos;
}

function editEditor(key) {
  let char = '';
  let cursorStart = editor.node.selectionStart;
  let cursorEnd = editor.node.selectionEnd;
  if (key.special === undefined) {
    char = globEnglish ? key.charEng : key.charRus;
    char = globCaps ? char.toUpperCase() : char;
    if (globShift) {
      if (key.extraEng === undefined) {
        char = char.toUpperCase();
      } else {
        char = globEnglish ? key.extraEng : key.extraRus;
      }
    }
  } else {
    char = '';
    let curPos;
    switch (key.code) {
      case 'Enter':
        char = '\n';
        break;
      case 'Backspace':
        if (cursorStart === cursorEnd) cursorStart -= 1;
        break;
      case 'Delete':
        char = '';
        if (cursorStart === cursorEnd) cursorEnd += 1;
        break;
      case 'Space':
        char = ' ';
        break;
      case 'Tab':
        char = '    ';
        break;
      case 'ArrowLeft':
        if (cursorStart > 0) {
          cursorStart -= 1;
          cursorEnd = cursorStart;
        }
        break;
      case 'ArrowRight':
        if (cursorEnd < editor.node.value.length) {
          cursorEnd += 1;
          cursorStart = cursorEnd;
        }
        break;
      case 'ArrowUp':
        curPos = getTextPosition();
        if (curPos.line === 0) curPos.pos = 0;
        else curPos.line -= 1;
        cursorStart = setTextPosition(curPos);
        cursorEnd = cursorStart;
        break;
      case 'ArrowDown':
        curPos = getTextPosition();
        if (curPos.line >= curPos.maxLine) curPos.pos = curPos.lastLineLastPos;
        else curPos.line += 1;
        cursorStart = setTextPosition(curPos);
        cursorEnd = cursorStart;
        break;
      default:
    }
  }
  editor.node.setRangeText(char, cursorStart, cursorEnd, 'end');
  setTimeout(() => editor.node.focus());
}

function btnHandler(event) {
  const curKey = keys.find((elem) => elem.code === event.code);
  if (!curKey) return;
  event.preventDefault();
  const btn = document.querySelector(`[data-keycode="${curKey.code}"]`);
  if (event.type === 'keydown') {
    btn.classList.add('active');
    editEditor(curKey);
    if (event.code === 'ShiftLeft') {
      globShift = true;
      shiftLeft = true;
      shiftRight = false;
      signal.node.classList.add('switch-shift');
      document.querySelector('[data-keycode="ShiftRight"]').classList.remove('active');
    }
    if (event.code === 'ShiftRight') {
      globShift = true;
      shiftLeft = false;
      shiftRight = true;
      signal.node.classList.add('switch-shift');
      document.querySelector('[data-keycode="ShiftLeft"]').classList.remove('active');
    }
    if (event.key === 'CapsLock') {
      globCaps = !globCaps;
      if (globCaps) {
        signal.node.classList.add('switch-caps');
      } else {
        signal.node.classList.remove('switch-caps');
        btn.classList.remove('active');
      }
    }
    if (event.code === 'ControlLeft' && shiftLeft) {
      switchLanguage();
      document.querySelector('[data-keycode="ShiftLeft"]').classList.remove('active');
      shiftLeft = false;
      globShift = false;
      signal.node.classList.remove('switch-shift');
    }
  } else {
    if (event.key !== 'CapsLock') btn.classList.remove('active');
    if (event.key === 'Shift') {
      globShift = false;
      shiftLeft = false;
      shiftRight = false;
      signal.node.classList.remove('switch-shift');
    }
  }
}

keyboard.node.addEventListener('mousedown', (event) => {
  const curKey = event.target.closest('.key');
  if (!curKey) return;
  curKey.classList.add('active');
  const btn = keys.find((elem) => elem.code === curKey.dataset.keycode);
  editEditor(btn);
  if (curKey.dataset.keycode === 'ControlLeft') {
    if (shiftLeft) switchLanguage();
  }
  if (curKey.dataset.keycode === 'ShiftLeft' || curKey.dataset.keycode === 'ShiftRight') {
    if (curKey.dataset.keycode === 'ShiftLeft') {
      document.querySelector('[data-keycode="ShiftRight"]').classList.remove('active');
      shiftRight = false;
      shiftLeft = !shiftLeft;
      globShift = shiftLeft;
      if (!shiftLeft) curKey.classList.remove('active');
    }
    if (curKey.dataset.keycode === 'ShiftRight') {
      document.querySelector('[data-keycode="ShiftLeft"]').classList.remove('active');
      shiftLeft = false;
      shiftRight = !shiftRight;
      globShift = shiftRight;
      if (!shiftRight) curKey.classList.remove('active');
    }
  } else {
    globShift = false;
    if (shiftLeft) {
      shiftLeft = false;
      document.querySelector('[data-keycode="ShiftLeft"]').classList.remove('active');
    }
    if (shiftRight) {
      shiftRight = false;
      document.querySelector('[data-keycode="ShiftRight"]').classList.remove('active');
    }
  }
  if (globShift) {
    signal.node.classList.add('switch-shift');
  } else {
    signal.node.classList.remove('switch-shift');
  }
  if (curKey.dataset.keycode === 'CapsLock') {
    globCaps = !globCaps;
    if (globCaps) {
      signal.node.classList.add('switch-caps');
    } else {
      signal.node.classList.remove('switch-caps');
      curKey.classList.remove('active');
    }
  }
});

keyboard.node.addEventListener('mouseup', (event) => {
  const curKey = event.target.closest('.key');
  if (!curKey) return;
  if (curKey.dataset.keycode !== 'ShiftLeft' && curKey.dataset.keycode !== 'ShiftRight' && curKey.dataset.keycode !== 'CapsLock') curKey.classList.remove('active');
});

keyboard.node.addEventListener('mouseout', (event) => {
  const key = event.target.closest('.key');
  if (!key) return;
  const { keycode } = key.dataset;
  if (keycode === 'ShiftLeft' || keycode === 'ShiftRight' || keycode === 'CapsLock') return;
  const hover = key.parentNode.querySelector(':hover');
  if (hover === key) return;
  key.classList.remove('active');
});

window.addEventListener('keydown', btnHandler);
window.addEventListener('keyup', btnHandler);

let langStorage = localStorage.getItem('keyb-lang');
if (!langStorage) {
  langStorage = true;
  signal.node.classList.add('switch-eng');
  localStorage.setItem('keyb-lang', true);
} else if (langStorage === 'true') {
  signal.node.classList.add('switch-eng');
  globEnglish = true;
} else {
  signal.node.classList.add('switch-rus');
  globEnglish = false;
}

editor.node.focus();
