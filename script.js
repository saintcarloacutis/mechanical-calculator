/**
 * ============================================================================
 * 1. PROCEDURAL MECHANICAL KEYBOARD SOUND ENGINE (Web Audio API)
 * ============================================================================
 * Synthesizes real-time "Creamy" (deep lubed linear/POM switch thock) and
 * "Mechanical" (crisp click-jacket tactile switch) audio on key press & release.
 */
class SwitchSoundEngine {
  constructor() {
    this.ctx = null;
    this.noiseBuffer = null;
    this.mode = 'creamy'; // 'creamy' | 'mechanical' | 'mute'
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generate a short white-noise buffer for switch stem friction & housing impact
  createNoiseBuffer() {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 0.1; // 100ms
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  playDown(isHeavyKey = false) {
    if (this.mode === 'mute') return;
    this.init();

    // Subtle organic pitch variation per keystroke (+-4%)
    const variance = 0.96 + Math.random() * 0.08;
    // Larger keys (0, =, AC) have deeper acoustic resonance
    const sizePitch = isHeavyKey ? 0.84 : 1.0;
    const pitch = variance * sizePitch;

    if (this.mode === 'creamy') {
      this.synthCreamyDown(pitch);
    } else if (this.mode === 'mechanical') {
      this.synthMechanicalDown(pitch);
    }
  }

  playUp(isHeavyKey = false) {
    if (this.mode === 'mute' || !this.ctx) return;

    const variance = 0.96 + Math.random() * 0.08;
    const sizePitch = isHeavyKey ? 0.88 : 1.0;
    const pitch = variance * sizePitch;

    if (this.mode === 'creamy') {
      this.synthCreamyUp(pitch);
    } else if (this.mode === 'mechanical') {
      this.synthMechanicalUp(pitch);
    }
  }

  /**
   * CREAMY SWITCH PROFILE (Deep, rounded, lubed POM linear "thock" / "marbly" sound)
   */
  synthCreamyDown(pitch) {
    const now = this.ctx.currentTime;

    // 1. Deep PBT Keycap & Plate Resonance ("Thock" body)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(175 * pitch, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(52 * pitch, now + 0.048);

    bodyGain.gain.setValueAtTime(0.001, now);
    bodyGain.gain.linearRampToValueAtTime(0.55, now + 0.003);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.ctx.destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.058);

    // 2. Marbly Pop Harmonic (Warm mid-range transient)
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(430 * pitch, now);
    popOsc.frequency.exponentialRampToValueAtTime(135 * pitch, now + 0.022);

    popGain.gain.setValueAtTime(0.001, now);
    popGain.gain.linearRampToValueAtTime(0.28, now + 0.002);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.026);

    popOsc.connect(popGain);
    popGain.connect(this.ctx.destination);
    popOsc.start(now);
    popOsc.stop(now + 0.028);

    // 3. Dampened Lubed Stem Bottom-Out Cushion (Low-passed noise burst)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(680 * pitch, now);
    filter.Q.setValueAtTime(2.2, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.025);
  }

  synthCreamyUp(pitch) {
    const now = this.ctx.currentTime;

    // Soft top-out housing return
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(95 * pitch, now + 0.025);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * MECHANICAL CLICKY PROFILE (Crisp tactile click-bar snap + plate clack)
   */
  synthMechanicalDown(pitch) {
    const now = this.ctx.currentTime;

    // 1. Sharp Click Jacket Snap (High-frequency metal leaf/click bar)
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(2500 * pitch, now);
    clickOsc.frequency.exponentialRampToValueAtTime(680 * pitch, now + 0.011);

    clickGain.gain.setValueAtTime(0.18, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.014);

    // 2. Crisp Bright Plastic Clack (High-bandpass noise transient)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2900 * pitch, now);
    filter.Q.setValueAtTime(3.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.016);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.018);

    // 3. Switch Plate Bottom-Out Impact (12ms after tactile click)
    const impactOsc = this.ctx.createOscillator();
    const impactGain = this.ctx.createGain();
    impactOsc.type = 'triangle';
    impactOsc.frequency.setValueAtTime(320 * pitch, now + 0.01);
    impactOsc.frequency.exponentialRampToValueAtTime(95 * pitch, now + 0.038);

    impactGain.gain.setValueAtTime(0.001, now);
    impactGain.gain.setValueAtTime(0.32, now + 0.01);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);

    impactOsc.connect(impactGain);
    impactGain.connect(this.ctx.destination);
    impactOsc.start(now);
    impactOsc.stop(now + 0.045);
  }

  synthMechanicalUp(pitch) {
    const now = this.ctx.currentTime;

    // Secondary tactile reset tick on key release
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1900 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(520 * pitch, now + 0.009);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.011);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.013);
  }
}

/**
 * ============================================================================
 * 2. CALCULATOR ENGINE & UI CONTROLLER
 * ============================================================================
 */
const soundEngine = new SwitchSoundEngine();

const mainDisplay = document.getElementById('main-display');
const expressionDisplay = document.getElementById('expression-display');
const profileIndicator = document.getElementById('profile-indicator');
const soundLed = document.getElementById('sound-led');

let currentInput = '0';
let previousInput = '';
let operator = null;
let shouldResetScreen = false;

const operatorSymbols = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷'
};

// Format numbers cleanly and avoid floating-point errors (e.g., 0.1 + 0.2 = 0.3)
function formatDisplayNumber(numStr) {
  if (numStr === 'Error') return 'Error';
  if (numStr.endsWith('.')) {
    const intPart = Number(numStr.slice(0, -1)).toLocaleString('en-US');
    return `${intPart}.`;
  }
  const [integer, decimal] = numStr.split('.');
  const formattedInt = Number(integer).toLocaleString('en-US');
  return decimal !== undefined ? `${formattedInt}.${decimal}` : formattedInt;
}

function updateScreen() {
  mainDisplay.textContent = formatDisplayNumber(currentInput);

  if (operator && previousInput !== '') {
    expressionDisplay.textContent = `${formatDisplayNumber(previousInput)} ${operatorSymbols[operator]}`;
  } else {
    expressionDisplay.textContent = '';
  }

  // Highlight active operator keycap
  document.querySelectorAll('.key-op').forEach(btn => {
    const isCurrentOp = btn.dataset.value === operator && shouldResetScreen;
    btn.classList.toggle('active-op', isCurrentOp);
  });
}

function inputDigit(digit) {
  if (currentInput === 'Error') currentInput = '0';
  if (shouldResetScreen) {
    currentInput = digit;
    shouldResetScreen = false;
  } else {
    if (currentInput.replace(/[-.]/g, '').length >= 12) return;
    currentInput = currentInput === '0' ? digit : currentInput + digit;
  }
  updateScreen();
}

function inputDecimal() {
  if (currentInput === 'Error') currentInput = '0';
  if (shouldResetScreen) {
    currentInput = '0.';
    shouldResetScreen = false;
    updateScreen();
    return;
  }
  if (!currentInput.includes('.')) {
    currentInput += '.';
    updateScreen();
  }
}

function clearAll() {
  currentInput = '0';
  previousInput = '';
  operator = null;
  shouldResetScreen = false;
  updateScreen();
}

function deleteLast() {
  if (shouldResetScreen || currentInput === 'Error') {
    currentInput = '0';
    shouldResetScreen = false;
    updateScreen();
    return;
  }
  currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : '0';
  updateScreen();
}

function inputPercent() {
  if (currentInput === 'Error') return;
  const val = parseFloat(currentInput);
  if (isNaN(val)) return;
  currentInput = String(Number((val / 100).toPrecision(12)));
  updateScreen();
}

function handleOperator(nextOperator) {
  if (currentInput === 'Error') clearAll();

  if (operator && !shouldResetScreen) {
    calculateResult();
  }

  previousInput = currentInput;
  operator = nextOperator;
  shouldResetScreen = true;
  updateScreen();
}

function calculateResult() {
  if (!operator || previousInput === '') return;

  const prev = parseFloat(previousInput);
  const current = parseFloat(currentInput);
  if (isNaN(prev) || isNaN(current)) return;

  let result = 0;
  switch (operator) {
    case '+':
      result = prev + current;
      break;
    case '-':
      result = prev - current;
      break;
    case '*':
      result = prev * current;
      break;
    case '/':
      if (current === 0) {
        currentInput = 'Error';
        previousInput = '';
        operator = null;
        shouldResetScreen = true;
        updateScreen();
        return;
      }
      result = prev / current;
      break;
  }

  // Strip floating point inaccuracies (like 0.30000000000000004)
  const cleanResult = Number(Math.round(Number(result + 'e10')) + 'e-10');
  expressionDisplay.textContent = `${formatDisplayNumber(previousInput)} ${operatorSymbols[operator]} ${formatDisplayNumber(currentInput)} =`;
  currentInput = String(cleanResult).slice(0, 14);
  previousInput = '';
  operator = null;
  shouldResetScreen = true;
  mainDisplay.textContent = formatDisplayNumber(currentInput);

  document.querySelectorAll('.key-op').forEach(btn => btn.classList.remove('active-op'));
}

function triggerKeyAction(button) {
  const action = button.dataset.action;
  const value = button.dataset.value;

  switch (action) {
    case 'number':
      inputDigit(value);
      break;
    case 'decimal':
      inputDecimal();
      break;
    case 'clear':
      clearAll();
      break;
    case 'delete':
      deleteLast();
      break;
    case 'percent':
      inputPercent();
      break;
    case 'operator':
      handleOperator(value);
      break;
    case 'calculate':
      calculateResult();
      break;
  }
}

/**
 * ============================================================================
 * 3. POINTER & KEYBOARD EVENT LISTENERS (Physical Travel + Sound Triggers)
 * ============================================================================
 */
const keycaps = document.querySelectorAll('.keycap');

keycaps.forEach(button => {
  const isHeavy = button.dataset.size === 'heavy';

  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    button.classList.add('is-pressed');
    soundEngine.playDown(isHeavy);
    triggerKeyAction(button);
  });

  const releaseKey = () => {
    if (button.classList.contains('is-pressed')) {
      button.classList.remove('is-pressed');
      soundEngine.playUp(isHeavy);
    }
  };

  button.addEventListener('pointerup', releaseKey);
  button.addEventListener('pointercancel', releaseKey);
});

// Physical Keyboard Support
const activeKeyboardKeys = new Set();

function findButtonByKey(key) {
  if (key === '=') return document.querySelector('[data-key="Enter"]');
  if (key === 'c' || key === 'C') return document.querySelector('[data-key="Escape"]');
  return document.querySelector(`.keycap[data-key="${CSS.escape(key)}"]`);
}

window.addEventListener('keydown', (e) => {
  const button = findButtonByKey(e.key);
  if (!button) return;

  e.preventDefault();
  if (activeKeyboardKeys.has(e.key)) return; // Prevent OS key-repeat machine-gunning
  activeKeyboardKeys.add(e.key);

  const isHeavy = button.dataset.size === 'heavy';
  button.classList.add('is-pressed');
  soundEngine.playDown(isHeavy);
  triggerKeyAction(button);
});

window.addEventListener('keyup', (e) => {
  const button = findButtonByKey(e.key);
  if (!button) return;

  activeKeyboardKeys.delete(e.key);
  if (button.classList.contains('is-pressed')) {
    const isHeavy = button.dataset.size === 'heavy';
    button.classList.remove('is-pressed');
    soundEngine.playUp(isHeavy);
  }
});

/**
 * ============================================================================
 * 4. HARDWARE CONTROLS (Switch Sound Selector & Theme Toggle)
 * ============================================================================
 */
const soundButtons = document.querySelectorAll('.switch-opt');

soundButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    soundButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const selectedMode = btn.dataset.sound;
    soundEngine.mode = selectedMode;

    // Update LCD Badge & LED Indicator
    if (selectedMode === 'creamy') {
      profileIndicator.textContent = 'SW: CREAMY LINEAR';
      soundLed.classList.remove('muted');
      soundEngine.playDown(false);
    } else if (selectedMode === 'mechanical') {
      profileIndicator.textContent = 'SW: CLICKY TACTILE';
      soundLed.classList.remove('muted');
      soundEngine.playDown(false);
    } else {
      profileIndicator.textContent = 'SW: SILENT MUTE';
      soundLed.classList.add('muted');
    }
  });
});

// Colorway Theme Switcher (Retro Cream <-> Dark Mecha)
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  const currentTheme = document.body.getAttribute('data-theme');
  const nextTheme = currentTheme === 'cream' ? 'dark' : 'cream';
  document.body.setAttribute('data-theme', nextTheme);
  soundEngine.playDown(true);
});