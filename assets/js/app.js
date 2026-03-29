// ── STATE ──
let currentStudent = '';
let courses = [];
let resultData = null;

const gradeLabel = { 5: 'A', 4: 'B', 3: 'C', 2: 'D', 1: 'E', 0: 'F' };

// ── INIT ──
window.onload = () => {
  renderHistory();
};

// ── HISTORY ──
function getHistory() {
  try { return JSON.parse(sessionStorage.getItem('cgpa_history') || '[]'); }
  catch { return []; }
}
function saveHistory(arr) {
  sessionStorage.setItem('cgpa_history', JSON.stringify(arr));
}
function renderHistory() {
  const history = getHistory();
  const sec = document.getElementById('history-section');
  const list = document.getElementById('history-list');
  if (!history.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  list.innerHTML = history.map((r, i) => `
      <div class="history-item">
        <div>
          <div class="hi-name">${esc(r.name)}</div>
          <div class="hi-meta">${r.courses} course(s) · ${r.units} unit(s) · ${r.timestamp}</div>
        </div>
        <div style="display:flex;align-items:center;gap:14px">
          <div class="hi-cgpa">${r.cgpa}</div>
          <button class="btn btn-danger btn-sm" onclick="deleteRecord(${i})">✕</button>
        </div>
      </div>
    `).join('');
}
function deleteRecord(i) {
  const h = getHistory();
  h.splice(i, 1);
  saveHistory(h);
  renderHistory();
  toast('Record deleted.');
}

// ── STEP 1: NAME ──
function startSession() {
  const val = document.getElementById('student-name').value.trim();
  const err = document.getElementById('name-err');
  if (!val) { err.classList.add('visible'); return; }
  err.classList.remove('visible');
  currentStudent = val;
  courses = [];
  resultData = null;
  document.getElementById('owner-tag').textContent = '→ ' + val;
  document.getElementById('name-section').style.display = 'none';
  document.getElementById('courses-section').style.display = 'block';
  document.getElementById('result-section').style.display = 'none';
  renderTable();
}

function switchStudent() {
  document.getElementById('name-section').style.display = 'block';
  document.getElementById('courses-section').style.display = 'none';
  document.getElementById('student-name').value = '';
  renderHistory();
}

// ── STEP 2: COURSES ──
function addCourse() {
  const code = document.getElementById('course-code').value.trim().toUpperCase();
  const units = parseInt(document.getElementById('course-units').value);
  const grade = parseInt(document.getElementById('course-grade').value);
  const err = document.getElementById('course-err');

  if (!code || code.length < 2) { err.classList.add('visible'); return; }
  err.classList.remove('visible');

  // prevent duplicate
  if (courses.find(c => c.code === code)) {
    err.textContent = '⚠ Course already added.';
    err.classList.add('visible');
    setTimeout(() => err.classList.remove('visible'), 2000);
    return;
  }
  err.textContent = '⚠ Enter a valid course code.';

  courses.push({ code, units, grade, points: units * grade });
  document.getElementById('course-code').value = '';
  renderTable();
  document.getElementById('result-section').style.display = 'none';
}

function removeCourse(i) {
  courses.splice(i, 1);
  renderTable();
  document.getElementById('result-section').style.display = 'none';
}

function clearCourses() {
  if (!courses.length) return;
  courses = [];
  renderTable();
  document.getElementById('result-section').style.display = 'none';
}

function renderTable(editingIndex = -1) {
  const tbody = document.getElementById('course-tbody');
  if (!courses.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">— No courses added yet —</td></tr>';
    return;
  }
  tbody.innerHTML = courses.map((c, i) => {
    if (i === editingIndex) {
      // ── EDIT ROW ──
      const unitOpts = [1, 2, 3, 4, 5, 6].map(u =>
        `<option value="${u}" ${c.units === u ? 'selected' : ''}>${u}</option>`).join('');
      const gradeOpts = [[5, 'A'], [4, 'B'], [3, 'C'], [2, 'D'], [1, 'E'], [0, 'F']].map(([v, l]) =>
        `<option value="${v}" ${c.grade === v ? 'selected' : ''}>${l} — ${v}</option>`).join('');
      return `
          <tr class="editing" id="edit-row-${i}">
            <td style="color:var(--text-mute);font-family:'IBM Plex Mono',monospace;font-size:.75rem">${i + 1}</td>
            <td><input class="edit-code-input" id="ei-code" value="${esc(c.code)}" maxlength="10" /></td>
            <td><select class="edit-select" id="ei-units" style="width:60px">${unitOpts}</select></td>
            <td><select class="edit-select" id="ei-grade" style="width:80px">${gradeOpts}</select></td>
            <td style="font-family:'IBM Plex Mono',monospace;color:var(--text-mute)">—</td>
            <td>
              <div class="row-actions">
                <button class="btn-save-row" onclick="saveEdit(${i})">✓ Save</button>
                <button class="btn-edit" onclick="renderTable()">Cancel</button>
              </div>
            </td>
          </tr>`;
    }
    // ── NORMAL ROW ──
    return `
        <tr>
          <td style="color:var(--text-mute);font-family:'IBM Plex Mono',monospace;font-size:.75rem">${i + 1}</td>
          <td class="code-cell">${esc(c.code)}</td>
          <td>${c.units}</td>
          <td><span class="grade-badge g-${gradeLabel[c.grade]}">${gradeLabel[c.grade]}</span></td>
          <td style="font-family:'IBM Plex Mono',monospace;font-weight:500">${c.points}</td>
          <td>
            <div class="row-actions">
              <button class="btn-edit" onclick="editCourse(${i})">✎ Edit</button>
              <button class="btn btn-danger btn-sm" onclick="removeCourse(${i})">✕</button>
            </div>
          </td>
        </tr>`;
  }).join('');
}

function editCourse(i) {
  document.getElementById('result-section').style.display = 'none';
  renderTable(i);
  // focus the code input
  setTimeout(() => {
    const el = document.getElementById('ei-code');
    if (el) { el.focus(); el.select(); }
  }, 30);
}

function saveEdit(i) {
  const code = (document.getElementById('ei-code').value || '').trim().toUpperCase();
  const units = parseInt(document.getElementById('ei-units').value);
  const grade = parseInt(document.getElementById('ei-grade').value);

  if (!code || code.length < 2) { toast('⚠ Course code cannot be empty.'); return; }

  // check duplicate (excluding self)
  const dup = courses.find((c, idx) => c.code === code && idx !== i);
  if (dup) { toast('⚠ That course code already exists.'); return; }

  courses[i] = { code, units, grade, points: units * grade };
  renderTable();
  document.getElementById('result-section').style.display = 'none';
  toast('Course updated ✓');
}

// ── CALCULATE ──
function calculate() {
  const err = document.getElementById('calc-err');
  if (!courses.length) { err.classList.add('visible'); return; }
  err.classList.remove('visible');

  const totalUnits = courses.reduce((s, c) => s + c.units, 0);
  const totalPoints = courses.reduce((s, c) => s + c.points, 0);
  const cgpa = totalPoints / totalUnits;

  resultData = {
    name: currentStudent,
    cgpa: cgpa.toFixed(2),
    units: totalUnits,
    points: totalPoints,
    courses: courses.length,
    timestamp: new Date().toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  };

  document.getElementById('res-cgpa').textContent = cgpa.toFixed(2);
  document.getElementById('res-units').textContent = totalUnits;
  document.getElementById('res-points').textContent = totalPoints;
  document.getElementById('res-count').textContent = courses.length;

  const cls = classify(cgpa);
  const el = document.getElementById('res-class');
  el.textContent = cls.label;
  el.className = 'classification ' + cls.css;

  document.getElementById('result-section').style.display = 'block';
  document.getElementById('result-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function classify(cgpa) {
  if (cgpa >= 4.50) return { label: 'First Class', css: 'cls-first' };
  if (cgpa >= 3.50) return { label: 'Second Class Upper', css: 'cls-second-u' };
  if (cgpa >= 2.40) return { label: 'Second Class Lower', css: 'cls-second-l' };
  if (cgpa >= 1.50) return { label: 'Third Class', css: 'cls-third' };
  if (cgpa >= 1.00) return { label: 'Pass', css: 'cls-pass' };
  return { label: 'Fail', css: 'cls-fail' };
}

function resetResult() {
  document.getElementById('result-section').style.display = 'none';
}

// ── SAVE ──
function saveResult() {
  if (!resultData) return;
  const history = getHistory();
  // avoid exact duplicate (same name + same cgpa + same timestamp)
  const exists = history.find(r => r.name === resultData.name && r.cgpa === resultData.cgpa && r.timestamp === resultData.timestamp);
  if (exists) { toast('Already saved.'); return; }
  history.unshift(resultData);
  saveHistory(history);
  toast('Result saved to session ✓');
}

// ── HELPERS ──
function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// Allow Enter key on name input
document.getElementById('student-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') startSession();
});

// Allow Enter key to save edit row
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.querySelector('tr.editing')) {
    const idx = [...document.querySelectorAll('tbody tr')].findIndex(r => r.classList.contains('editing'));
    if (idx >= 0) saveEdit(idx);
  }
  if (e.key === 'Escape' && document.querySelector('tr.editing')) {
    renderTable();
  }
});