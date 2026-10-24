const STORAGE_KEY = 'mockmate-local-preview-v2';
const SAMPLE = {
  jd: 'Software Engineer — Build user-facing products, collaborate across design and engineering, improve application performance, and communicate technical decisions clearly.',
  resume: 'Alex Morgan — Software Engineer. Built a student event platform with React and Node.js. Designed search, improved load time, and wrote integration tests.',
  repo: 'https://github.com/example/student-events'
};
const state = { step: 'prepare', resumeMode: 'paste', jd: '', resume: '', fileName: '', repo: '', company: 'General Tech', focus: 'Technical', difficulty: 'Standard' };
const meeting = { phase: 'idle', token: 0, stream: null, recorder: null, chunks: [], question: 0, startedAt: 0, clock: null, url: null, stopPromise: null };
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function persist() {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Storage may be unavailable. */ }
}
function restore() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    for (const key of Object.keys(state)) if (Object.hasOwn(saved, key)) state[key] = saved[key];
  } catch { /* Start fresh. */ }
  state.fileName = '';
  state.step = 'prepare';
  if (!['Warm-up', 'Standard', 'Challenge'].includes(state.difficulty)) state.difficulty = 'Standard';
  if (!['paste', 'pdf'].includes(state.resumeMode)) state.resumeMode = 'paste';
  if (!['General Tech', 'Amazon-style'].includes(state.company)) state.company = 'General Tech';
  if (!['Technical', 'Behavioral'].includes(state.focus)) state.focus = 'Technical';
}
function releaseRecording() {
  $('#feedback-cards').replaceChildren();
  if (meeting.url) URL.revokeObjectURL(meeting.url);
  meeting.url = null;
}
function stopTracks() {
  if (meeting.stream) meeting.stream.getTracks().forEach(track => track.stop());
  meeting.stream = null;
  $('#self-video').srcObject = null;
}
function resetControls() {
  $('#end-practice').disabled = false;
  $('#toggle-mic').disabled = true;
  $('#toggle-camera').disabled = true;
  $('#next-question').disabled = true;
  $('#toggle-mic').setAttribute('aria-pressed', 'false');
  $('#toggle-camera').setAttribute('aria-pressed', 'false');
  $('#toggle-mic').textContent = '🎙 Mic on';
  $('#toggle-camera').textContent = '▣ Camera on';
  $('#camera-placeholder').hidden = true;
  $('#record-indicator').classList.remove('is-recording');
  $('#record-indicator').textContent = 'WAITING';
  $('#countdown-overlay').hidden = true;
  clearInterval(meeting.clock);
  meeting.clock = null;
}
function cancelMeeting() {
  meeting.token++;
  if (meeting.recorder && meeting.recorder.state !== 'inactive') {
    try { meeting.recorder.stop(); } catch { /* Recorder may already have stopped. */ }
  }
  meeting.recorder = null;
  meeting.chunks = [];
  meeting.stopPromise = null;
  stopTracks();
  resetControls();
  meeting.phase = 'idle';
}
function resetPractice() {
  cancelMeeting();
  releaseRecording();
  meeting.question = 0;
  renderPractice();
  buildFeedback();
}
function showStep(step, scroll = true) {
  if (!['prepare', 'plan', 'practice', 'feedback'].includes(step)) return;
  if (state.step === 'practice' && step !== 'practice' && ['connecting', 'countdown', 'recording', 'stopping'].includes(meeting.phase)) cancelMeeting();
  state.step = step;
  $$('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== step; });
  const order = ['prepare', 'plan', 'practice', 'feedback'];
  $$('.step').forEach(button => {
    const index = order.indexOf(button.dataset.step);
    button.classList.toggle('active', button.dataset.step === step);
    button.classList.toggle('complete', index < order.indexOf(step));
    button.setAttribute('aria-current', button.dataset.step === step ? 'step' : 'false');
  });
  history.replaceState(null, '', `#${step}`);
  persist();
  if (scroll) {
    const heading = $(`[data-panel="${step}"] h2`);
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    $('#workflow').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
function setResumeMode(mode) {
  if (mode !== state.resumeMode) resetPractice();
  state.resumeMode = mode;
  $('#resume-paste').hidden = mode !== 'paste';
  $('#resume-pdf').hidden = mode !== 'pdf';
  $$('[data-resume-mode]').forEach(button => {
    const active = button.dataset.resumeMode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#resume-error').textContent = '';
  persist();
}
function readForm() {
  const previous = JSON.stringify([state.jd, state.resume, state.repo, state.company, state.focus, state.difficulty]);
  state.jd = $('#job-description').value;
  state.resume = $('#resume-text').value;
  state.repo = $('#github-url').value.trim();
  state.company = $('input[name="company"]:checked').value;
  state.focus = $('input[name="focus"]:checked').value;
  state.difficulty = $('#difficulty').value;
  if (previous !== JSON.stringify([state.jd, state.resume, state.repo, state.company, state.focus, state.difficulty])) resetPractice();
  persist();
}
function validRepo(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.toLowerCase() === 'github.com' && !url.username && !url.password && !url.port && !url.search && !url.hash && /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.pathname);
  } catch { return false; }
}
function validate() {
  readForm();
  const file = $('#resume-file').files[0];
  const pdfError = !file ? 'Choose a PDF file to continue.' :
    (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) ? 'Choose a PDF file.' :
    file.size > 2 * 1024 * 1024 ? 'Choose a PDF under 2 MB.' : '';
  const errors = {
    jd: state.jd.trim() ? '' : 'Add a job description to continue.',
    resume: state.resumeMode === 'paste' ? (state.resume.trim() ? '' : 'Paste your resume or a short background summary.') : pdfError,
    github: validRepo(state.repo) ? '' : 'Use one public repository URL: https://github.com/owner/repo.'
  };
  $('#jd-error').textContent = errors.jd;
  $('#resume-error').textContent = errors.resume;
  $('#github-error').textContent = errors.github;
  const first = Object.entries(errors).find(([, message]) => message);
  if (first) {
    if (state.step !== 'prepare') showStep('prepare');
    ({ jd: $('#job-description'), resume: state.resumeMode === 'paste' ? $('#resume-text') : $('#resume-file'), github: $('#github-url') })[first[0]].focus();
    return false;
  }
  return true;
}
function questionData() {
  if (state.focus === 'Behavioral') return [
    { skill: 'Ownership', why: 'Explain your individual contribution.', question: 'Tell me about a time you took ownership of a difficult project. What did you do personally?', note: 'Describe the situation, your action, and the outcome.' },
    { skill: 'Collaboration', why: 'Show how you work through different views.', question: 'Describe a disagreement with a teammate. How did you move the work forward?', note: 'Name both views and the decision you reached.' },
    { skill: 'Reflection', why: 'Show what you learned.', question: 'What would you do differently on that project today?', note: 'Choose one concrete change and explain why.' }
  ];
  return [
    { skill: 'Project decisions', why: 'Connect a project choice to a real constraint.', question: 'Walk me through a technical decision in your project. Why did you choose that approach?', note: 'Explain the constraint, options, and choice.' },
    { skill: 'Tradeoffs', why: 'Show how you choose under limits.', question: 'What tradeoff did you make between speed, quality, and scope?', note: 'Describe what you gained and what you gave up.' },
    { skill: 'Impact', why: 'Explain how you evaluate your work.', question: 'How did you know your solution worked, and what would you improve next?', note: 'Use a real test or observation if you have one.' }
  ];
}
function buildPlan() {
  const firstSentence = state.jd.trim().split(/[.!?\n]/)[0].trim();
  $('#plan-role').textContent = firstSentence.length > 60 ? `${firstSentence.slice(0, 57)}…` : (firstSentence || 'Your target role');
  $('#plan-meta').textContent = `${state.company} · ${state.focus} · ${state.difficulty}`;
  $('#company-angle').textContent = state.company === 'Amazon-style' ? 'Unofficial practice style: ownership and user impact.' : 'General Tech practice style: reasoning and impact.';
  $('#scope-jd').textContent = `${state.jd.trim().length} characters provided · not analyzed`;
  $('#scope-resume').textContent = state.resumeMode === 'pdf' ? `${state.fileName || 'PDF selected'} · filename only` : `${state.resume.trim().length} characters provided · not analyzed`;
  $('#scope-repo').textContent = `${state.repo.replace(/^https:\/\/github\.com\//, '') || 'No repository'} · not fetched`;
  $('#question-list').replaceChildren(...questionData().map((item, index) => {
    const card = document.createElement('article'); card.className = 'question-card';
    const number = document.createElement('span'); number.className = 'question-number'; number.textContent = `FOCUS 0${index + 1}`;
    const title = document.createElement('h3'); title.textContent = item.skill;
    const why = document.createElement('p'); why.textContent = item.why;
    card.append(number, title, why); return card;
  }));
}
function renderPractice() {
  const active = meeting.phase === 'recording';
  const index = Math.min(meeting.question, 2);
  const item = questionData()[index];
  $('#stage-mode').textContent = `${state.focus} · ${state.difficulty}`;
  $('#room-focus-note').textContent = state.focus === 'Behavioral' ? 'Use a specific event to show your action and the result.' : 'Use a project decision to show constraints, alternatives, and validation.';
  $('#prompt-panel').hidden = !active;
  $('#prompt-count').textContent = `QUESTION ${index + 1} OF 3`;
  $('#current-question').textContent = item.question;
  $('#prompt-note').textContent = item.note;
  $('#stage-caption').textContent = active ? item.question : 'Your coach is ready. The first question appears after recording begins.';
  $('#progress-count').textContent = active ? `${index + 1} / 3` : '— / 3';
  $('#progress-fill').style.width = active ? `${(index + 1) / 3 * 100}%` : '0%';
  $('#next-question').disabled = !active || index === 2;
}
function buildFeedback() {
  $('#feedback-headline').textContent = meeting.url ? 'Your meeting recording is ready.' : 'No recording yet.';
  $('#feedback-subhead').textContent = meeting.url ? 'Replay your local camera and microphone recording below.' : 'Enter an interview meeting to record an answer.';
  $('#feedback-cards').replaceChildren();
  if (!meeting.url) return;
  const card = document.createElement('section'); card.className = 'feedback-card';
  const title = document.createElement('h4'); title.textContent = 'Interview meeting · your camera and microphone';
  const video = document.createElement('video'); video.src = meeting.url; video.controls = true; video.playsInline = true; video.preload = 'metadata'; video.setAttribute('aria-label', 'Replay your local meeting recording');
  const note = document.createElement('small'); note.textContent = 'The illustrated interviewer and on-screen questions are not part of this recording.';
  card.append(title, video, note); $('#feedback-cards').append(card);
}
function meetingError(message) {
  cancelMeeting();
  $('#meeting-error').textContent = message;
  $('#meeting-error').hidden = false;
  $('#retry-meeting').hidden = false;
  $('#room-status').textContent = 'Could not start meeting';
  $('#record-indicator').textContent = 'NOT RECORDING';
  meeting.phase = 'error';
  renderPractice();
}
function recorderOptions() {
  const options = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  const supported = options.find(type => MediaRecorder.isTypeSupported(type));
  return supported ? { mimeType: supported } : undefined;
}
function waitSecond() { return new Promise(resolve => setTimeout(resolve, 1000)); }
async function enterMeeting() {
  if (['connecting', 'countdown', 'recording', 'stopping'].includes(meeting.phase)) return;
  cancelMeeting();
  releaseRecording();
  buildFeedback();
  meeting.question = 0;
  const token = ++meeting.token;
  meeting.phase = 'connecting';
  $('#meeting-error').hidden = true;
  $('#retry-meeting').hidden = true;
  $('#room-status').textContent = 'Connecting camera and microphone…';
  $('#record-indicator').textContent = 'CONNECTING';
  $('#stage-timer').textContent = '00:00';
  renderPractice();
  showStep('practice');
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    meetingError('This browser cannot record camera and microphone video. Try a current browser on localhost or HTTPS.');
    return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
    if (token !== meeting.token || state.step !== 'practice') { stream.getTracks().forEach(track => track.stop()); return; }
    meeting.stream = stream;
    $('#self-video').srcObject = stream;
    $('#self-video').play().catch(() => {});
    $('#toggle-mic').disabled = false;
    $('#toggle-camera').disabled = false;
    meeting.phase = 'countdown';
    $('#room-status').textContent = 'Get ready to answer';
    $('#record-indicator').textContent = 'STARTING SOON';
    $('#countdown-overlay').hidden = false;
    for (let number = 3; number >= 1; number--) {
      $('#countdown-number').textContent = String(number);
      await waitSecond();
      if (token !== meeting.token || state.step !== 'practice') return;
    }
    $('#countdown-overlay').hidden = true;
    meeting.chunks = [];
    let recorder;
    try { recorder = new MediaRecorder(stream, recorderOptions()); }
    catch { recorder = new MediaRecorder(stream); }
    if (token !== meeting.token) return;
    meeting.recorder = recorder;
    recorder.addEventListener('dataavailable', event => { if (event.data.size && token === meeting.token) meeting.chunks.push(event.data); });
    recorder.addEventListener('error', () => {
      if (token === meeting.token && meeting.phase !== 'stopping') meetingError('Recording stopped unexpectedly. Please retry the meeting.');
    });
    recorder.addEventListener('stop', () => {
      if (token === meeting.token && meeting.phase === 'recording') meetingError('Recording ended unexpectedly. Please retry the meeting.');
    });
    recorder.addEventListener('stop', () => {
      if (token === meeting.token && meeting.phase === 'recording') meetingError('Recording stopped unexpectedly. Please retry the meeting.');
    });
    recorder.start(1000);
    if (recorder.state !== 'recording') throw new Error('Recorder did not start');
    meeting.phase = 'recording';
    meeting.startedAt = Date.now();
    $('#record-indicator').textContent = '● RECORDING';
    $('#record-indicator').classList.add('is-recording');
    $('#room-status').textContent = 'Recording your camera and microphone';
    meeting.clock = setInterval(() => {
      const elapsed = Math.floor((Date.now() - meeting.startedAt) / 1000);
      $('#stage-timer').textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
    }, 1000);
    renderPractice();
  } catch (error) {
    if (token !== meeting.token) return;
    const message = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError'
      ? 'Camera or microphone access was denied. Allow both permissions in your browser, then retry.'
      : error?.name === 'NotFoundError'
        ? 'A camera and microphone are required for this meeting. Connect both devices, then retry.'
        : 'The meeting could not start recording. Check your camera and microphone, then retry.';
    meetingError(message);
  }
}
async function endMeeting() {
  if (meeting.phase === 'stopping') return meeting.stopPromise;
  if (meeting.phase !== 'recording' || !meeting.recorder || meeting.recorder.state === 'inactive') {
    cancelMeeting(); buildFeedback(); showStep('feedback'); return;
  }
  meeting.phase = 'stopping';
  clearInterval(meeting.clock);
  meeting.clock = null;
  $('#record-indicator').classList.remove('is-recording');
  $('#record-indicator').textContent = 'SAVING';
  $('#room-status').textContent = 'Finishing local recording…';
  $('#end-practice').disabled = true;
  const recorder = meeting.recorder;
  const token = meeting.token;
  meeting.stopPromise = new Promise(resolve => {
    let settled = false;
    const timeout = setTimeout(() => finish(true), 5000);
    function finish(failed = false) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (token === meeting.token) {
        if (!failed) {
          const blob = new Blob(meeting.chunks, { type: recorder.mimeType || meeting.chunks[0]?.type || 'video/webm' });
          if (blob.size) meeting.url = URL.createObjectURL(blob);
        }
        meeting.chunks = [];
        stopTracks();
        resetControls();
        meeting.recorder = null;
        meeting.phase = 'idle';
        buildFeedback();
        showStep('feedback');
      }
      resolve();
    }
    recorder.addEventListener('stop', () => finish(), { once: true });
    recorder.addEventListener('error', () => finish(true), { once: true });
    try { recorder.stop(); stopTracks(); }
    catch { finish(true); }
  });
  return meeting.stopPromise;
}
function init() {
  restore();
  $('#job-description').value = state.jd;
  $('#resume-text').value = state.resume;
  $('#github-url').value = state.repo;
  $('#difficulty').value = state.difficulty;
  $(`input[name="company"][value="${state.company}"]`).checked = true;
  $(`input[name="focus"][value="${state.focus}"]`).checked = true;
  setResumeMode(state.resumeMode);
  $('#intake-form').addEventListener('submit', event => { event.preventDefault(); if (validate()) { resetPractice(); buildPlan(); showStep('plan'); } });
  $('#intake-form').addEventListener('input', readForm);
  $('#intake-form').addEventListener('change', readForm);
  $$('[data-resume-mode]').forEach(button => button.addEventListener('click', () => setResumeMode(button.dataset.resumeMode)));
  $('#resume-file').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    if ((file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) || file.size > 2 * 1024 * 1024) {
      $('#resume-error').textContent = file.size > 2 * 1024 * 1024 ? 'Choose a PDF under 2 MB.' : 'Choose a PDF file.';
      event.target.value = ''; state.fileName = ''; $('#upload-title').textContent = 'Choose a PDF file'; return;
    }
    resetPractice(); state.fileName = file.name; $('#upload-title').textContent = file.name;
    $('#upload-caption').textContent = 'Selected · content is not read in this demo'; $('#resume-error').textContent = ''; persist();
  });
  $('#sample-fill').addEventListener('click', () => {
    $('#job-description').value = SAMPLE.jd; $('#resume-text').value = SAMPLE.resume; $('#github-url').value = SAMPLE.repo;
    setResumeMode('paste'); readForm(); $$('.error').forEach(error => { error.textContent = ''; });
  });
  $('.brand').addEventListener('click', event => { event.preventDefault(); showStep('prepare'); });
  $$('.step').forEach(button => button.addEventListener('click', async () => {
    const destination = button.dataset.step;
    if (destination === 'prepare') { showStep('prepare'); return; }
    if (!validate()) return;
    if (destination === 'plan') { buildPlan(); showStep('plan'); return; }
    if (destination === 'practice') { await enterMeeting(); return; }
    if (state.step === 'practice') await endMeeting();
    else { buildFeedback(); showStep('feedback'); }
  }));
  $$('[data-go]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.go === 'practice') enterMeeting();
    else { resetPractice(); showStep(button.dataset.go); }
  }));
  $('#start-practice').addEventListener('click', enterMeeting);
  $('#retry-meeting').addEventListener('click', enterMeeting);
  $('#next-question').addEventListener('click', () => { if (meeting.phase === 'recording' && meeting.question < 2) { meeting.question++; renderPractice(); } });
  $('#toggle-mic').addEventListener('click', () => {
    const track = meeting.stream?.getAudioTracks()[0]; if (!track) return;
    track.enabled = !track.enabled;
    $('#toggle-mic').setAttribute('aria-pressed', String(!track.enabled));
    $('#toggle-mic').textContent = track.enabled ? '🎙 Mic on' : '◌ Mic off';
  });
  $('#toggle-camera').addEventListener('click', () => {
    const track = meeting.stream?.getVideoTracks()[0]; if (!track) return;
    track.enabled = !track.enabled;
    $('#toggle-camera').setAttribute('aria-pressed', String(!track.enabled));
    $('#toggle-camera').textContent = track.enabled ? '▣ Camera on' : '▣ Camera off';
    $('#camera-placeholder').hidden = track.enabled;
  });
  $('#end-practice').addEventListener('click', endMeeting);
  window.addEventListener('pagehide', () => { cancelMeeting(); releaseRecording(); });
  window.addEventListener('hashchange', () => {
    if (state.step === 'practice' && location.hash !== '#practice') { cancelMeeting(); showStep('prepare', false); }
  });
  buildPlan(); renderPractice(); buildFeedback(); showStep('prepare', false);
}
document.addEventListener('DOMContentLoaded', init);
