const SUPABASE_URL = 'https://jozmawngshyoleulikgz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UhMsUc8MRGKcoKYB9bu11w_-f0XBGIw';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const LETTERS = ['أ', 'ب', 'ج', 'د'];
const DEFAULTS = { site_name: 'منصة الأستاذ محمد البديري', tagline: 'اختبارات الرياضيات', teacher_name: 'الأستاذ محمد البديري', logo_url: null, primary_color: '#102b43', accent_color: '#d9ad5b' };
const PRESETS = [['#102b43', '#d9ad5b'], ['#0f3d33', '#e0b24f'], ['#2d1b4e', '#f0b429'], ['#0b3a82', '#f59e0b'], ['#5b1226', '#e6b566'], ['#1f2933', '#14b8a6']];

let brand = { ...DEFAULTS }, state = { exams: [], attempts: [] }, editingId = null, runner = null, pendingLogo;

// ---------- أيقونات ----------
const IC = {
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  grid: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 17v-6M13 17V7M18 17v-3"/>',
  settings: '<path d="M4 6h9M19 6h1M4 12h3M13 12h7M4 18h11M21 18h-1"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5M4 21h16"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  repeat: '<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>'
};
const ico = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
const hydrateIcons = () => $$('[data-ic]:empty').forEach(el => el.innerHTML = ico(el.dataset.ic));

// ---------- أدوات ----------
function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) }
const ltr = v => `<bdi dir="ltr">${esc(v)}</bdi>`;
const fmtDate = d => { if (!d) return '—'; const x = new Date(d); return isNaN(x) ? '—' : x.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) };
const toLocalInput = iso => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) };
const sameId = (a, b) => String(a) === String(b);
let toastTimer;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3200) }

// ---------- المظهر (فاتح / داكن) ----------
function paintThemeIcons() { const t = document.documentElement.dataset.theme; $$('.theme-toggle').forEach(b => b.innerHTML = ico(t === 'dark' ? 'sun' : 'moon')) }
function toggleTheme() {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t; localStorage.setItem('theme', t); paintThemeIcons();
}

// ---------- هوية الموقع ----------
const lum = h => { const n = parseInt(h.slice(1), 16); return (.299 * (n >> 16) + .587 * (n >> 8 & 255) + .114 * (n & 255)) / 255 };
function applyColors(p, a) {
  const s = document.documentElement.style;
  s.setProperty('--brand', p); s.setProperty('--accent', a);
  s.setProperty('--on-brand', lum(p) > .6 ? '#102b43' : '#fff');
  s.setProperty('--on-accent', lum(a) > .55 ? '#1a2430' : '#fff');
  document.querySelector('meta[name=theme-color]').content = p;
}
function applyIdentity(b) {
  document.title = `${b.site_name} | ${b.tagline || ''}`.replace(/ \| $/, '');
  $$('.js-site-name').forEach(x => x.textContent = b.site_name);
  $$('.js-tagline').forEach(x => x.textContent = b.tagline || '');
  $$('.js-teacher').forEach(x => x.textContent = b.teacher_name || '');
  $$('.brand-mark:not(#logoPreview), .avatar').forEach(x => x.innerHTML = b.logo_url ? `<img src="${esc(b.logo_url)}" alt="">` : esc([...b.site_name][0] || 'م'));
  $('#year').textContent = new Date().getFullYear();
}
async function loadSettings() {
  const { data } = await supabaseClient.from('site_settings').select('*').eq('id', 1).maybeSingle();
  if (!data) return;
  brand = { ...DEFAULTS, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null)), logo_url: data.logo_url };
  localStorage.setItem('brand', JSON.stringify(brand));
  applyColors(brand.primary_color, brand.accent_color); applyIdentity(brand);
}

// ---------- التنقل بين الشاشات والمصادقة ----------
function show(id) { ['studentPortal', 'studentExamArea', 'teacherDashboard'].forEach(x => $('#' + x).classList.toggle('hidden', x !== id)) }
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  session ? showTeacherDashboard() : showStudentPortal();
}
function showStudentPortal() { show('studentPortal') }
function showTeacherDashboard() { show('teacherDashboard'); loadData() }

$('#openTeacherLogin').onclick = () => $('#loginModal').classList.add('show');
$('#teacherLoginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const { error } = await supabaseClient.auth.signInWithPassword({ email: $('#adminEmail').value.trim(), password: $('#adminPassword').value });
  if (error) { toast('البريد الإلكتروني أو كلمة المرور غير صحيحة'); return }
  $('#loginModal').classList.remove('show'); $('#adminPassword').value = '';
  toast('مرحباً بك ' + (brand.teacher_name || '')); showTeacherDashboard();
});
$('#logoutBtn').onclick = async () => { await supabaseClient.auth.signOut(); toast('تم تسجيل الخروج'); showStudentPortal() };

// =====================================================================
// رحلة الطالب
// =====================================================================
function startError(d) {
  switch (d.error) {
    case 'bad_name': return 'يرجى كتابة الاسم الثلاثي الكامل';
    case 'not_found': return 'رمز الامتحان غير صحيح أو أن الامتحان غير متاح حالياً';
    case 'not_open': return 'لم يحن موعد فتح هذا الامتحان بعد: ' + fmtDate(d.at);
    case 'closed': return 'انتهى موعد هذا الامتحان';
    case 'limit_reached': return `استنفدت عدد المحاولات المسموحة لهذا الامتحان (${d.max})`;
  }
  return 'حدث خطأ غير متوقع، حاول مرة أخرى';
}

$('#studentEntryForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#entryName').value.trim().replace(/\s+/g, ' '), code = $('#entryCode').value.trim().toUpperCase();
  if (name.split(' ').length < 3) { toast('يرجى كتابة الاسم الثلاثي الكامل'); return }
  const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
  const { data, error } = await supabaseClient.rpc('start_attempt', { p_code: code, p_name: name });
  btn.disabled = false;
  if (error || !data) { toast('تعذّر الاتصال بالخادم، حاول مرة أخرى'); return }
  if (data.error) { toast(startError(data)); return }
  startExam(data, name);
});

function startExam(d, name) {
  const key = 'ans_' + d.attempt_id;
  let saved = { a: [], f: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    if (Array.isArray(raw)) saved.a = raw;
    else if (raw) saved = raw;
  } catch { }

  runner = {
    id: d.attempt_id, token: d.token, name, key, qs: d.questions,
    idx: 0,
    answers: d.questions.map((_, i) => Number.isInteger(saved.a?.[i]) ? saved.a[i] : null),
    flagged: d.questions.map((_, i) => Boolean(saved.f?.[i])),
    end: Date.now() + d.remaining_seconds * 1000, submitting: false, retryAt: 0, timer: null
  };

  show('studentExamArea');
  $('#runWrap').classList.remove('hidden'); $('#studentResult').classList.add('hidden');
  $('#activeExamGrade').textContent = d.exam.grade; $('#activeExamTitle').textContent = d.exam.title;

  renderQuestionNav();
  renderCurrentQuestion();
  updateProgress();
  tick();
  runner.timer = setInterval(tick, 1000);
  window.onbeforeunload = e => { e.preventDefault(); e.returnValue = '' };
  window.scrollTo(0, 0);
  if (d.resumed) toast('تم استئناف محاولتك من حيث توقفت');
}

function saveRunnerLocal() {
  if (!runner) return;
  localStorage.setItem(runner.key, JSON.stringify({ a: runner.answers, f: runner.flagged }));
}

function renderQuestionNav() {
  $('#qNavGrid').innerHTML = runner.qs.map((_, i) => {
    const cls = [
      'q-pill',
      runner.answers[i] !== null ? 'answered' : '',
      runner.flagged[i] ? 'flagged' : '',
      i === runner.idx ? 'current' : ''
    ].filter(Boolean).join(' ');
    return `<button type="button" class="${cls}" data-goto="${i}">${i + 1}</button>`;
  }).join('');
}

function renderCurrentQuestion() {
  const i = runner.idx, q = runner.qs[i], isFlagged = runner.flagged[i];
  $('#singleQuestionBox').innerHTML = `
    <div class="student-q single-q-card ${runner.answers[i] !== null ? 'answered' : ''}">
      <div>
        ${isFlagged ? `<div class="q-badge-flagged">${ico('flag')} مؤجل للمراجعة</div>` : ''}
        <h4><span class="qn">${i + 1}</span><span>${esc(q.text)}</span></h4>
      </div>
      <div>
        ${q.options.map((o, j) => `
          <label class="student-option">
            <input type="radio" name="currQ" value="${j}" ${runner.answers[i] === j ? 'checked' : ''}>
            <span class="opt-letter">${LETTERS[j]}</span>
            <span>${esc(o)}</span>
          </label>`).join('')}
      </div>
    </div>`;

  $('#prevQBtn').disabled = i === 0;
  $('#nextQBtn').disabled = i === runner.qs.length - 1;
  const fBtn = $('#flagQBtn');
  fBtn.classList.toggle('active', isFlagged);
  fBtn.querySelector('span').textContent = isFlagged ? 'إلغاء التأجيل' : 'تأجيل السؤال';
  renderQuestionNav();
}

$('#singleQuestionBox').addEventListener('change', e => {
  const r = e.target; if (!runner || r.type !== 'radio') return;
  runner.answers[runner.idx] = Number(r.value);
  saveRunnerLocal();
  $('.single-q-card').classList.add('answered');
  renderQuestionNav();
  updateProgress();
});

$('#qNavGrid').addEventListener('click', e => {
  const b = e.target.closest('[data-goto]'); if (!b || !runner) return;
  runner.idx = Number(b.dataset.goto);
  renderCurrentQuestion();
});

$('#prevQBtn').onclick = () => { if (runner && runner.idx > 0) { runner.idx--; renderCurrentQuestion(); } };
$('#nextQBtn').onclick = () => { if (runner && runner.idx < runner.qs.length - 1) { runner.idx++; renderCurrentQuestion(); } };
$('#flagQBtn').onclick = () => {
  if (!runner) return;
  runner.flagged[runner.idx] = !runner.flagged[runner.idx];
  saveRunnerLocal();
  renderCurrentQuestion();
};

document.addEventListener('keydown', e => {
  if (!runner || $('#studentExamArea').classList.contains('hidden')) return;
  if (e.key === 'ArrowLeft') $('#nextQBtn').click();
  if (e.key === 'ArrowRight') $('#prevQBtn').click();
});

function updateProgress() {
  const n = runner.answers.filter(a => a !== null).length, t = runner.answers.length;
  $('#examProgressBar').style.width = (n / t * 100) + '%';
  $('#examProgressText').textContent = `${n} من ${t} مجاب عنها`;
}
const clock = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), p = n => String(n).padStart(2, '0'); return (h ? h + ':' : '') + p(m) + ':' + p(s % 60) };
function tick() {
  if (!runner) return;
  const left = Math.max(0, Math.round((runner.end - Date.now()) / 1000));
  $('#examTimer b').textContent = clock(left);
  $('#examTimer').classList.toggle('danger', left <= 60);
  if (left === 0 && !runner.submitting && Date.now() >= runner.retryAt) { toast('انتهى الوقت، يتم تسليم إجاباتك الآن'); submitExam(true) }
}

$('#submitStudentExam').onclick = () => submitExam(false);
async function submitExam(auto) {
  if (!runner || runner.submitting) return;
  const un = runner.answers.filter(a => a === null).length;
  const fl = runner.flagged.filter(Boolean).length;
  let warn = [];
  if (un) warn.push(`${un} سؤال بدون إجابة`);
  if (fl) warn.push(`${fl} سؤال مؤجل للمراجعة`);
  if (!auto && !confirm(warn.length ? `تنبيه: لديك ${warn.join(' و ')}. هل تريد التسليم النهائي؟` : 'هل أنت متأكد من تسليم إجاباتك؟')) return;

  runner.submitting = true; $('#submitStudentExam').disabled = true;
  const { data, error } = await supabaseClient.rpc('submit_attempt', { p_attempt_id: runner.id, p_token: runner.token, p_answers: runner.answers });
  if (error || !data || data.error) {
    runner.submitting = false; runner.retryAt = Date.now() + 5000; $('#submitStudentExam').disabled = false;
    toast('تعذّر إرسال الإجابات، تحقق من الاتصال وحاول مرة أخرى'); return;
  }
  clearInterval(runner.timer); localStorage.removeItem(runner.key); window.onbeforeunload = null;
  const qsSnapshot = runner.qs;
  showResult(data, runner.name, qsSnapshot); runner = null;
}

function showResult(r, name, qs) {
  $('#runWrap').classList.add('hidden');
  const box = $('#studentResult'); box.classList.remove('hidden'); window.scrollTo(0, 0);
  const p = r.percent, C = 2 * Math.PI * 54;
  const [msg, cls] = p >= 90 ? ['ممتاز، أداء رائع!', 'great'] : p >= 75 ? ['جيد جداً، استمر!', 'good'] : p >= 50 ? ['جيد، ويمكنك التحسّن أكثر', 'ok'] : ['تحتاج إلى مزيد من المراجعة', 'low'];

  let reviewHtml = '';
  if (r.show_answers && Array.isArray(r.review) && qs) {
    reviewHtml = `<div class="review-list"><h3>مراجعة إجاباتك</h3>` + qs.map((q, i) => {
      const rev = r.review[i] || {};
      return `<div class="student-q">
        <h4><span class="qn">${i + 1}</span><span>${esc(q.text)}</span></h4>
        ${q.options.map((o, j) => {
          const isCorr = j === rev.correct, isUser = j === rev.chosen;
          const optCls = isCorr ? 'correct' : (isUser ? 'wrong' : '');
          const badge = isCorr ? `<em>${ico('check')} الصحيحة</em>` : (isUser ? `<em>${ico('x')} إجابتك</em>` : '');
          return `<div class="student-option ${optCls}"><span class="opt-letter">${LETTERS[j]}</span><span>${esc(o)}</span>${badge}</div>`;
        }).join('')}
      </div>`;
    }).join('') + `</div>`;
  }

  box.innerHTML = `
    <div class="result-card ${cls}">
      <div class="ring"><svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="54"/><circle class="ring-fg" cx="60" cy="60" r="54" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg><strong dir="ltr">${p}%</strong></div>
      <h2>${msg}</h2>
      <p class="score-line">درجتك: ${ltr(r.score + ' / ' + r.total)}</p>
      ${r.expired ? '<p class="note-bad">انتهى الوقت قبل التسليم</p>' : ''}
      <p>شكراً ${esc(name.split(' ')[0])}، وصلت نتيجتك إلى ${esc(brand.teacher_name || 'المدرّس')}.</p>
      <button class="btn btn-outline" onclick="location.reload()">العودة للصفحة الرئيسية</button>
      ${reviewHtml}
    </div>`;
  setTimeout(() => { const f = $('.ring-fg'); if (f) f.style.strokeDashoffset = C * (1 - p / 100) }, 60);
}

// =====================================================================
// لوحة الأستاذ
// =====================================================================
const TITLES = { dashboard: 'لوحة التحكم', exams: 'إدارة الامتحانات', results: 'نتائج الطلاب', settings: 'إعدادات الموقع' };
function go(view) {
  $$('.view').forEach(x => x.classList.remove('active'));
  $('#' + view + 'View').classList.add('active');
  $$('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.view === view));
  $('#pageTitle').textContent = TITLES[view];
  $('#sidebar').classList.remove('open');
  if (view === 'settings') fillSettings(); else { applyColors(brand.primary_color, brand.accent_color); applyIdentity(brand) }
  window.scrollTo(0, 0);
}

async function loadData() {
  const [ex, at] = await Promise.all([
    supabaseClient.from('exams').select('*, questions(*)'),
    supabaseClient.from('attempts').select('*, exams(title)')
  ]);
  if (ex.error || at.error) toast('تعذّر تحميل البيانات، تحقق من تنفيذ سكربت SQL');
  state.exams = (ex.data || []).map(e => ({
    id: e.id, title: e.title, grade: e.grade, duration: e.duration, code: e.code, status: e.status,
    max_attempts: e.max_attempts ?? 1, opens_at: e.opens_at, closes_at: e.closes_at,
    shuffle_questions: e.shuffle_questions !== false, shuffle_options: e.shuffle_options !== false,
    show_answers: Boolean(e.show_answers),
    questions: (e.questions || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0))
      .map(q => ({ id: q.id, text: q.question_text, options: q.options, correct: q.correct_index }))
  }));
  state.attempts = (at.data || []).map(a => ({
    examId: a.exam_id, student: a.student_name, examTitle: a.exams?.title || 'امتحان محذوف',
    score: a.score, total: a.total, percent: a.percent, date: a.submitted_at || a.created_at || a.started_at, status: a.status || 'submitted',
    layout: a.layout, answers: a.answers,
  })).sort((x, y) => new Date(y.date) - new Date(x.date));
  render();
}

const tagPub = e => e.status === 'published' ? `<span class="tag live">${ico('globe')} عام</span>` : `<span class="tag">${ico('lock')} خاص</span>`;
const table = (head, rows) => `<table class="data-table"><thead><tr>${head.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

function render() {
  const done = state.attempts.filter(a => a.status !== 'in_progress');
  $('#statExams').textContent = state.exams.length;
  $('#statAttempts').textContent = done.length;
  $('#statAverage').textContent = done.length ? Math.round(done.reduce((s, a) => s + a.percent, 0) / done.length) + '%' : '—';
  renderRecent(); renderExamCards(); renderResults();
}

function renderRecent() {
  const list = state.exams.slice(-5).reverse();
  $('#recentExams').innerHTML = list.length
    ? table(['الامتحان', 'الصف', 'الأسئلة', 'الحالة'], list.map(e => [esc(e.title), esc(e.grade), ltr(e.questions.length), tagPub(e)]))
    : '<div class="empty">لا توجد امتحانات بعد. اضغط «إنشاء امتحان جديد» للبدء.</div>';
}

function renderExamCards() {
  const list = state.exams.slice().reverse();
  $('#examList').innerHTML = list.length ? list.map(e => {
    const n = state.attempts.filter(a => sameId(a.examId, e.id) && a.status !== 'in_progress').length, pub = e.status === 'published';
    const sched = (e.opens_at || e.closes_at) ? `<div class="sched">${e.opens_at ? 'يفتح: ' + ltr(fmtDate(e.opens_at)) : ''}${e.opens_at && e.closes_at ? ' — ' : ''}${e.closes_at ? 'يغلق: ' + ltr(fmtDate(e.closes_at)) : ''}</div>` : '';
    return `<article class="exam-card">
      <div class="exam-top">${tagPub(e)}<label class="switch" title="${pub ? 'اجعله خاصاً' : 'اجعله عاماً'}"><input type="checkbox" data-toggle="${esc(e.id)}" ${pub ? 'checked' : ''} aria-label="عام / خاص"><i></i></label></div>
      <h4>${esc(e.title)}</h4>
      <p>${esc(e.grade)} · رمز الدخول: <b dir="ltr">${esc(e.code)}</b></p>
      <div class="exam-meta">
        <span>${ico('clock')} ${ltr(e.duration)} دقيقة</span><span>${ico('list')} ${ltr(e.questions.length)} أسئلة</span>
        <span>${ico('users')} ${ltr(n)} تسليم</span><span>${ico('repeat')} ${ltr(e.max_attempts)} محاولة</span>
      </div>${sched}
      <div class="exam-actions">
        <button class="btn btn-outline btn-small" data-preview="${esc(e.id)}">${ico('eye')} معاينة</button>
        <button class="btn btn-outline btn-small" data-edit="${esc(e.id)}">${ico('edit')} تعديل</button>
        <button class="btn btn-outline btn-small" data-copy="${esc(e.code)}">${ico('copy')} نسخ الرمز</button>
        <button class="btn btn-outline btn-small btn-danger" data-delete="${esc(e.id)}">${ico('trash')} حذف</button>
      </div></article>`;
  }).join('') : '<div class="empty">لم تنشئ أي امتحان حتى الآن.</div>';
}

const STATUS_TXT = { submitted: 'مسلَّم', expired: 'انتهى الوقت', in_progress: 'قيد الحل' };
function renderResults() {
  // تحديث قائمة فلتر الامتحانات
  const sel = $('#filterExam'), curVal = sel.value;
  sel.innerHTML = '<option value="">كل الامتحانات</option>' + state.exams.map(e => `<option value="${esc(e.id)}">${esc(e.title)}</option>`).join('');
  sel.value = curVal;

  const q = ($('#searchStudent')?.value || '').trim().toLowerCase();
  const exId = sel.value;
  const st = $('#filterStatus')?.value || '';

  const filtered = state.attempts.filter(a => {
    if (q && !a.student.toLowerCase().includes(q)) return false;
    if (exId && !sameId(a.examId, exId)) return false;
    if (st && a.status !== st) return false;
    return true;
  });

  const rows = filtered.map(a => [
    esc(a.student), esc(a.examTitle), ltr(`${a.score} / ${a.total}`),
    `<span class="tag ${a.percent >= 50 ? 'live' : 'bad'}">${ltr(a.percent + '%')}</span>`,
    ltr(fmtDate(a.date)), esc(STATUS_TXT[a.status] || a.status)
  ]);
  $('#resultsTable').innerHTML = rows.length
    ? table(['اسم الطالب', 'الامتحان', 'الدرجة', 'النسبة', 'وقت التسليم', 'الحالة'], rows)
    : '<div class="empty">لا توجد نتائج مطابقة لخيارات البحث.</div>';
}

['#searchStudent', '#filterExam', '#filterStatus'].forEach(s => $(s)?.addEventListener('input', renderResults));

// استيراد الأسئلة النصي
$('#openBulkImport').onclick = () => { $('#bulkText').value = ''; $('#importModal').classList.add('show'); };
$('#runBulkImport').onclick = () => {
  const raw = $('#bulkText').value.trim();
  if (!raw) { toast('ألصق الأسئلة أولاً'); return; }
  const blocks = raw.split(/\n\s*\n/);
  let added = 0;
  blocks.forEach(b => {
    const lines = b.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 5) return;
    const text = lines[0];
    let correct = 0;
    const options = lines.slice(1, 5).map((opt, idx) => {
      if (opt.startsWith('*')) { correct = idx; return opt.slice(1).trim(); }
      return opt;
    });
    addQuestion({ text, options, correct });
    added++;
  });
  if (!added) { toast('تأكد من كتابة نص السؤال وتحته 4 خيارات'); return; }
  // حذف الحقول الفارغة الافتراضية إن وجدت
  $$('.question-editor').forEach(el => {
    if ($$('.question-editor').length > added && !el.querySelector('.q-text').value.trim()) el.remove();
  });
  renumber();
  $('#importModal').classList.remove('show');
  toast(`تم استيراد ${added} سؤال بنجاح`);
};

// تحليل صعوبة الأسئلة
$('#openAnalyticsBtn').onclick = () => {
  const sel = $('#analyticsExamSelect');
  if (!state.exams.length) { toast('لا توجد امتحانات لتحليلها'); return; }
  sel.innerHTML = state.exams.map(e => `<option value="${esc(e.id)}">${esc(e.title)}</option>`).join('');
  renderAnalytics();
  $('#analyticsModal').classList.add('show');
};
$('#analyticsExamSelect').onchange = renderAnalytics;

function renderAnalytics() {
  const ex = state.exams.find(x => sameId(x.id, $('#analyticsExamSelect').value));
  if (!ex) return;
  const subs = state.attempts.filter(a => sameId(a.examId, ex.id) && a.status === 'submitted' && Array.isArray(a.layout) && Array.isArray(a.answers));
  if (!subs.length) {
    $('#analyticsBody').innerHTML = '<div class="empty">لا توجد تسليمات مكتملة لهذا الامتحان لتحليلها بعد.</div>';
    return;
  }
  $('#analyticsBody').innerHTML = ex.questions.map((q, idx) => {
    let totalSeen = 0, correctCount = 0;
    subs.forEach(s => {
      const pos = s.layout.findIndex(item => sameId(item.q, q.id));
      if (pos !== -1) {
        totalSeen++;
        const chosen = s.answers[pos];
        if (chosen !== null && s.layout[pos].o[chosen] === q.correct) correctCount++;
      }
    });
    const rate = totalSeen ? Math.round((correctCount / totalSeen) * 100) : 0;
    const barCls = rate >= 70 ? '' : rate >= 40 ? 'mid' : 'low';
    return `<div class="student-q" style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;gap:10px;font-size:14px">
        <strong>${idx + 1}. ${esc(q.text)}</strong>
        <span class="tag ${rate >= 50 ? 'live' : 'bad'}" dir="ltr">${rate}% (${correctCount}/${totalSeen})</span>
      </div>
      <div class="an-bar-wrap"><div class="an-bar ${barCls}" style="width:${rate}%"></div></div>
    </div>`;
  }).join('');
}
// ---------- محرر الامتحان ----------
let qUid = 0;
function addQuestion(d = {}) {
  const uid = ++qUid, div = document.createElement('div');
  div.className = 'question-editor'; if (d.id != null) div.dataset.id = d.id;
  div.innerHTML = `
    <div class="question-editor-head"><span class="qnum"></span><button type="button" class="text-btn remove-q">${ico('trash')} حذف السؤال</button></div>
    <label>نص السؤال<input class="q-text" required placeholder="اكتب السؤال هنا" value="${esc(d.text || '')}"></label>
    <div class="opts-hint">اختر الدائرة بجانب الإجابة الصحيحة</div>
    ${[0, 1, 2, 3].map(i => `<div class="opt-row"><input type="radio" name="c${uid}" value="${i}" ${(d.correct ?? 0) === i ? 'checked' : ''} aria-label="الإجابة الصحيحة"><span class="opt-letter">${LETTERS[i]}</span><input class="q-opt" required placeholder="الخيار ${LETTERS[i]}" value="${esc(d.options?.[i] || '')}"></div>`).join('')}`;
  div.querySelector('.remove-q').onclick = () => {
    if ($$('.question-editor').length <= 1) { toast('يجب أن يحتوي الامتحان على سؤال واحد على الأقل'); return }
    div.remove(); renumber();
  };
  $('#questionFields').append(div); renumber();
}
const renumber = () => $$('.question-editor .qnum').forEach((x, i) => x.textContent = 'السؤال ' + (i + 1));

function openExam(e) {
  editingId = e ? e.id : null;
  const f = $('#examForm'), el = f.elements; f.reset();
  $('#examModalTitle').textContent = e ? 'تعديل الامتحان' : 'إنشاء امتحان';
  $('#examModalEyebrow').textContent = e ? 'تحديث بيانات الامتحان' : 'إعداد اختبار جديد';
  $('#questionFields').innerHTML = '';
  if (e) {
    el['title'].value = e.title; el['code'].value = e.code; el['duration'].value = e.duration; el['status'].value = e.status;
    el['max_attempts'].value = e.max_attempts; el['opens_at'].value = toLocalInput(e.opens_at); el['closes_at'].value = toLocalInput(e.closes_at);
    el['shuffle_questions'].checked = e.shuffle_questions; el['shuffle_options'].checked = e.shuffle_options;
    el['show_answers'].checked = Boolean(e.show_answers);
    const sel = $('#gradeSelect'); if (![...sel.options].some(o => o.value === e.grade)) sel.add(new Option(e.grade, e.grade)); sel.value = e.grade;
    e.questions.forEach(addQuestion);
  } else { addQuestion(); addQuestion() }
  $('#examModal').classList.add('show');
}

$('#examForm').addEventListener('submit', async ev => {
  ev.preventDefault();
  const f = new FormData(ev.target);
  const qs = $$('.question-editor').map((q, i) => ({
    id: q.dataset.id ?? null, position: i,
    question_text: q.querySelector('.q-text').value.trim(),
    options: [...q.querySelectorAll('.q-opt')].map(x => x.value.trim()),
    correct_index: Number(q.querySelector('input[type=radio]:checked')?.value ?? 0)
  }));
  if (!qs.length || qs.some(q => !q.question_text || q.options.some(x => !x))) { toast('أكمل جميع الأسئلة والخيارات أولاً'); return }
  const opens = f.get('opens_at') ? new Date(f.get('opens_at')) : null, closes = f.get('closes_at') ? new Date(f.get('closes_at')) : null;
  if (opens && closes && closes <= opens) { toast('موعد الإغلاق يجب أن يكون بعد موعد الفتح'); return }
  const examData = {
    
    title: f.get('title').trim(), grade: f.get('grade'), duration: Number(f.get('duration')),
    code: f.get('code').trim().toUpperCase(), status: f.get('status'), max_attempts: Math.max(1, Number(f.get('max_attempts')) || 1),
    opens_at: opens ? opens.toISOString() : null, closes_at: closes ? closes.toISOString() : null,
    shuffle_questions: f.has('shuffle_questions'), shuffle_options: f.has('shuffle_options'),
    show_answers: f.has('show_answers')
  };
  const btn = $('#saveExam'); btn.disabled = true;
  try {
    if (editingId != null) {
      const { error } = await supabaseClient.from('exams').update(examData).eq('id', editingId);
      if (error) { toast('رمز الامتحان مستخدم مسبقاً أو حدث خطأ'); return }
      const old = state.exams.find(x => sameId(x.id, editingId))?.questions || [], keep = new Set(qs.filter(q => q.id).map(q => String(q.id)));
      const gone = old.filter(q => !keep.has(String(q.id))).map(q => q.id), ops = [];
      if (gone.length) ops.push(supabaseClient.from('questions').delete().in('id', gone));
      qs.forEach(({ id, ...row }) => ops.push(id ? supabaseClient.from('questions').update(row).eq('id', id) : supabaseClient.from('questions').insert([{ ...row, exam_id: editingId }])));
      if ((await Promise.all(ops)).some(r => r.error)) { toast('تم حفظ الامتحان لكن تعذّر حفظ بعض الأسئلة، راجعها'); loadData(); return }
    } else {
      const { data: ins, error } = await supabaseClient.from('exams').insert([examData]).select().single();
      if (error) { toast('رمز الامتحان مستخدم مسبقاً أو حدث خطأ'); return }
      const { error: qe } = await supabaseClient.from('questions').insert(qs.map(({ id, ...row }) => ({ ...row, exam_id: ins.id })));
      if (qe) { toast('تم إنشاء الامتحان لكن تعذّر حفظ الأسئلة، افتحه وعدّله'); loadData(); return }
    }
    toast('تم حفظ الامتحان بنجاح'); $('#examModal').classList.remove('show'); go('exams'); loadData();
  } finally { btn.disabled = false }
});

// ---------- المعاينة ----------
function openPreview(id) {
  const e = state.exams.find(x => sameId(x.id, id)); if (!e) return;
  $('#previewTitle').textContent = e.title; $('#previewEdit').dataset.edit = e.id;
  $('#previewMeta').innerHTML = `${tagPub(e)}<span class="tag">${esc(e.grade)}</span><span class="tag">${ico('clock')} ${ltr(e.duration)} دقيقة</span><span class="tag">${ico('repeat')} ${ltr(e.max_attempts)} محاولة</span><span class="tag">${ico('list')} ${ltr(e.questions.length)} أسئلة</span>`;
  $('#previewBody').innerHTML = `<div class="pv-note">هذه معاينة للمدرّس بترتيبك الأصلي مع تمييز الإجابة الصحيحة. ${e.shuffle_options || e.shuffle_questions ? 'في الامتحان الفعلي يُخلط الترتيب لكل طالب ولا تظهر الإجابة الصحيحة.' : ''}</div>` +
    e.questions.map((q, i) => `<div class="student-q"><h4><span class="qn">${i + 1}</span><span>${esc(q.text)}</span></h4>${q.options.map((o, j) => `<div class="student-option ${j === q.correct ? 'correct' : ''}"><span class="opt-letter">${LETTERS[j]}</span><span>${esc(o)}</span>${j === q.correct ? `<em>${ico('check')} الصحيحة</em>` : ''}</div>`).join('')}</div>`).join('');
  $('#previewModal').classList.add('show');
}

// ---------- إعدادات الموقع ----------
function renderLogoPreview(url) { $('#logoPreview').innerHTML = url ? `<img src="${esc(url)}" alt="">` : esc([...($('#setName').value || brand.site_name)][0] || 'م') }
function fillSettings() {
  pendingLogo = undefined; $('#logoFile').value = '';
  $('#setName').value = brand.site_name; $('#setTagline').value = brand.tagline || ''; $('#setTeacher').value = brand.teacher_name || '';
  $('#setPrimary').value = brand.primary_color; $('#setAccent').value = brand.accent_color;
  renderLogoPreview(brand.logo_url);
}
$('#presets').innerHTML = PRESETS.map(([p, a]) => `<button type="button" style="--p:${p};--a:${a}" data-p="${p}" data-a="${a}" aria-label="لون جاهز"></button>`).join('');
$('#presets').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  $('#setPrimary').value = b.dataset.p; $('#setAccent').value = b.dataset.a; applyColors(b.dataset.p, b.dataset.a);
};
['#setPrimary', '#setAccent'].forEach(s => $(s).addEventListener('input', () => applyColors($('#setPrimary').value, $('#setAccent').value)));
$('#setName').addEventListener('input', () => { if (!pendingLogo && !(pendingLogo === undefined && brand.logo_url)) renderLogoPreview(null) });
$('#logoUpload').onclick = () => $('#logoFile').click();
$('#logoFile').onchange = e => {
  const file = e.target.files[0]; if (!file) return;
  if (!file.type.startsWith('image/')) { toast('اختر ملف صورة'); return }
  if (file.size > 2 * 1024 * 1024) { toast('حجم الصورة يجب ألا يتجاوز 2 ميغابايت'); return }
  pendingLogo = file; renderLogoPreview(URL.createObjectURL(file));
};
$('#logoRemove').onclick = () => { pendingLogo = null; renderLogoPreview(null) };
$('#resetBrand').onclick = () => {
  $('#setName').value = DEFAULTS.site_name; $('#setTagline').value = DEFAULTS.tagline; $('#setTeacher').value = DEFAULTS.teacher_name;
  $('#setPrimary').value = DEFAULTS.primary_color; $('#setAccent').value = DEFAULTS.accent_color;
  applyColors(DEFAULTS.primary_color, DEFAULTS.accent_color); pendingLogo = null; renderLogoPreview(null);
};
$('#settingsForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('#saveSettings'); btn.disabled = true;
  try {
    let logo_url = brand.logo_url;
    if (pendingLogo instanceof File) {
      const ext = (pendingLogo.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `logo-${Date.now()}.${ext}`;
      const { error } = await supabaseClient.storage.from('branding').upload(path, pendingLogo, { contentType: pendingLogo.type });
      if (error) { toast('تعذّر رفع الشعار، تحقق من تنفيذ سكربت SQL'); return }
      logo_url = supabaseClient.storage.from('branding').getPublicUrl(path).data.publicUrl;
    } else if (pendingLogo === null) logo_url = null;
    const payload = {
      id: 1, site_name: $('#setName').value.trim() || DEFAULTS.site_name, tagline: $('#setTagline').value.trim(),
      teacher_name: $('#setTeacher').value.trim(), logo_url, primary_color: $('#setPrimary').value, accent_color: $('#setAccent').value
    };
    const { error } = await supabaseClient.from('site_settings').upsert(payload);
    if (error) { toast('تعذّر حفظ الإعدادات'); return }
    brand = { ...DEFAULTS, ...payload }; localStorage.setItem('brand', JSON.stringify(brand));
    pendingLogo = undefined; applyColors(brand.primary_color, brand.accent_color); applyIdentity(brand);
    toast('تم حفظ إعدادات الموقع');
  } finally { btn.disabled = false }
});

// ---------- أحداث عامة ----------
document.addEventListener('click', async e => {
  const t = e.target;
  if (t.closest('.theme-toggle')) { toggleTheme(); return }
  const cl = t.closest('[data-close]'); if (cl) { $('#' + cl.dataset.close).classList.remove('show'); return }
  if (t.classList.contains('modal-backdrop') && t.id !== 'examModal') { t.classList.remove('show'); return }
  const nav = t.closest('[data-view]'); if (nav) { go(nav.dataset.view); return }
  if (t.closest('[data-action="new-exam"]')) { openExam(null); return }
  const pv = t.closest('[data-preview]'); if (pv) { openPreview(pv.dataset.preview); return }
  const ed = t.closest('[data-edit]');
  if (ed) { const ex = state.exams.find(x => sameId(x.id, ed.dataset.edit)); if (ex) { $('#previewModal').classList.remove('show'); openExam(ex) } return }
  const d = t.closest('[data-delete]');
  if (d) {
    if (!confirm('هل تريد حذف هذا الامتحان نهائياً مع كل أسئلته؟')) return;
    const { error } = await supabaseClient.from('exams').delete().eq('id', d.dataset.delete);
    if (error) toast('تعذّر حذف الامتحان'); else { toast('تم حذف الامتحان'); loadData() }
    return;
  }
  const c = t.closest('[data-copy]');
  if (c) navigator.clipboard?.writeText(c.dataset.copy).then(() => toast('تم نسخ الرمز: ' + c.dataset.copy));
});

document.addEventListener('change', async e => {
  const tg = e.target.closest?.('[data-toggle]'); if (!tg) return;
  const { error } = await supabaseClient.from('exams').update({ status: tg.checked ? 'published' : 'draft' }).eq('id', tg.dataset.toggle);
  toast(error ? 'تعذّر تغيير الحالة' : tg.checked ? 'أصبح الامتحان عاماً ومتاحاً للطلاب' : 'أصبح الامتحان خاصاً ومخفياً عن الطلاب');
  loadData();
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal-backdrop.show:not(#examModal)').forEach(m => m.classList.remove('show')) });

$('#addQuestion').onclick = () => addQuestion();
$('#mobileMenu').onclick = () => $('#sidebar').classList.toggle('open');
$('#exportCsv').onclick = () => {
  const rows = [['اسم الطالب', 'الامتحان', 'الدرجة', 'المجموع', 'النسبة', 'الحالة', 'التاريخ'], ...state.attempts.map(a => [a.student, a.examTitle, a.score, a.total, a.percent, STATUS_TXT[a.status] || a.status, fmtDate(a.date)])];
  const csv = '\uFEFF' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); a.download = 'نتائج-الطلاب.csv'; a.click();
};

// ---------- تشغيل ----------
hydrateIcons(); paintThemeIcons();
try { const cached = JSON.parse(localStorage.getItem('brand') || 'null'); if (cached) brand = { ...DEFAULTS, ...cached } } catch { }
applyColors(brand.primary_color, brand.accent_color); applyIdentity(brand);
loadSettings(); checkAuth();
