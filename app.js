const SUPABASE_URL = 'https://jozmawngshyoleulikgz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UhMsUc8MRGKcoKYB9bu11w_-f0XBGIw';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let state = { exams: [], attempts: [] };
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) }
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2800) }

// التحقق من حالة تسجيل الدخول عند فتح الموقع
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        showTeacherDashboard();
    } else {
        showStudentPortal();
    }
}

function showStudentPortal() {
    $('#studentPortal').classList.remove('hidden');
    $('#studentExamArea').classList.add('hidden');
    $('#teacherDashboard').classList.add('hidden');
}

function showTeacherDashboard() {
    $('#studentPortal').classList.add('hidden');
    $('#studentExamArea').classList.add('hidden');
    $('#teacherDashboard').classList.remove('hidden');
    loadDataFromSupabase();
}

// --- تسجيل دخول وخروج الأستاذ ---
$('#openTeacherLogin').onclick = () => $('#loginModal').classList.add('show');
$('#closeLoginModal').onclick = () => $('#loginModal').classList.remove('show');

$('#teacherLoginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#adminEmail').value.trim();
    const password = $('#adminPassword').value;
    
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        toast('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } else {
        $('#loginModal').classList.remove('show');
        toast('مرحباً بك أستاذ محمد');
        showTeacherDashboard();
    }
});

$('#logoutBtn').onclick = async () => {
    await supabaseClient.auth.signOut();
    toast('تم تسجيل الخروج');
    showStudentPortal();
};

// --- رحلة الطالب (الدخول بالرمز وأداء الامتحان) ---
$('#studentEntryForm').addEventListener('submit', async e => {
    e.preventDefault();
    const studentName = $('#entryName').value.trim();
    const code = $('#entryCode').value.trim().toUpperCase();

    if (studentName.split(/\s+/).length < 3) {
        toast('يرجى كتابة الاسم الثلاثي الكامل');
        return;
    }

    // البحث عن الامتحان المتاح بهذا الرمز فقط
    const { data: exam, error } = await supabaseClient
        .from('exams')
        .select('*, questions(*)')
        .eq('code', code)
        .eq('status', 'published')
        .single();

    if (error || !exam || !exam.questions?.length) {
        toast('رمز الامتحان غير صحيح أو أن الامتحان غير متاح حالياً');
        return;
    }

    // بدء عرض الامتحان للطالب
    $('#studentPortal').classList.add('hidden');
    $('#studentExamArea').classList.remove('hidden');
    $('#activeExamGrade').textContent = exam.grade;
    $('#activeExamTitle').textContent = exam.title;
    $('#activeExamDuration').textContent = exam.duration + ' دقيقة';

    const host = $('#activeQuestionsList');
    host.innerHTML = exam.questions.map((q, i) => `
        <div class="student-q">
            <h4>${i + 1}. ${esc(q.question_text)}</h4>
            ${q.options.map((o, j) => `
                <label class="student-option">
                    <input type="radio" name="answer${i}" value="${j}"> ${['أ', 'ب', 'ج', 'د'][j]}. ${esc(o)}
                </label>
            `).join('')}
        </div>
    `).join('') + `<button class="btn btn-primary" id="submitStudentExam" style="width:100%; margin-top:15px; padding:13px;">تسليم الإجابات</button>`;

    $('#submitStudentExam').onclick = async () => {
        if (!confirm('هل أنت متأكد من تسليم إجاباتك؟')) return;
        let score = 0;
        exam.questions.forEach((q, i) => {
            const selected = $(`input[name="answer${i}"]:checked`);
            if (selected && Number(selected.value) === q.correct_index) score++;
        });

        const total = exam.questions.length;
        const percent = Math.round((score / total) * 100);

        const { error: saveErr } = await supabaseClient.from('attempts').insert([{
            exam_id: exam.id,
            student_name: studentName,
            score,
            total,
            percent
        }]);

        if (saveErr) {
            toast('حدث خطأ أثناء إرسال النتيجة، حاول مرة أخرى');
            return;
        }

        host.innerHTML = `
            <div class="result-box">
                <span>تم تسجيل إجابتك بنجاح</span>
                <strong>${percent}%</strong>
                <b>درجتك: ${score} من ${total}</b>
                <p>أحسنت يا ${esc(studentName)}، وصلت نتيجتك إلى الأستاذ محمد البديري.</p>
                <button class="btn btn-outline" onclick="location.reload()" style="margin-top:12px;">العودة للصفحة الرئيسية</button>
            </div>
        `;
    };
});

// --- وظائف لوحة تحكم الأستاذ ---
function go(view) {
    $$('.view').forEach(x => x.classList.remove('active'));
    $('#' + view + 'View').classList.add('active');
    $$('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.view === view));
    $('#pageTitle').textContent = ({ dashboard: 'لوحة التحكم', exams: 'إدارة الامتحانات', results: 'نتائج الطلاب' })[view];
    $('#sidebar').classList.remove('open');
}

async function loadDataFromSupabase() {
    const { data: examsData } = await supabaseClient.from('exams').select('*, questions(*)');
    const { data: attemptsData } = await supabaseClient.from('attempts').select('*, exams(title)');

    state.exams = (examsData || []).map(e => ({
        id: e.id, title: e.title, grade: e.grade, duration: e.duration, code: e.code, status: e.status,
        questions: (e.questions || []).map(q => ({ text: q.question_text, options: q.options, correct: q.correct_index }))
    }));

    state.attempts = (attemptsData || []).map(a => ({
        student: a.student_name, examTitle: a.exams?.title || 'امتحان محذوف', score: a.score, total: a.total, percent: a.percent, date: a.created_at
    }));

    render();
}

function render() {
    const attempts = state.attempts;
    $('#statExams').textContent = state.exams.length;
    $('#statAttempts').textContent = attempts.length;
    $('#statAverage').textContent = attempts.length ? Math.round(attempts.reduce((a, b) => a + b.percent, 0) / attempts.length) + '%' : '—';
    renderExamCards(); renderRecent(); renderResults();
}

function renderRecent() {
    const list = [...state.exams].slice(-5).reverse();
    $('#recentExams').innerHTML = list.length ? table(['الامتحان', 'الصف', 'الأسئلة', 'الحالة'], list.map(e => [esc(e.title), esc(e.grade), e.questions.length, e.status === 'published' ? '<span class="tag live">متاح</span>' : '<span class="tag">مسودة</span>'])) : '<div class="empty">لا توجد امتحانات بعد.</div>';
}

function renderExamCards() {
    $('#examList').innerHTML = state.exams.length ? state.exams.slice().reverse().map(e => `<article class="exam-card"><span class="tag ${e.status === 'published' ? 'live' : ''}">${e.status === 'published' ? 'متاح للطلاب' : 'مسودة'}</span><h4>${esc(e.title)}</h4><p>${esc(e.grade)} · رمز الدخول: <b>${esc(e.code)}</b></p><div class="exam-meta"><span>◷ ${e.duration} دقيقة</span><span>▤ ${e.questions.length} أسئلة</span></div><div class="exam-actions"><button class="btn btn-outline btn-small" data-copy="${e.code}">نسخ الرمز</button><button class="btn btn-outline btn-small" data-delete="${e.id}">حذف</button></div></article>`).join('') : '<div class="empty">لم تنشئ أي امتحان حتى الآن.</div>';
}

function renderResults() {
    const rows = state.attempts.slice().reverse().map(a => [esc(a.student), esc(a.examTitle), `${a.score} / ${a.total}`, `${a.percent}%`, new Date(a.date).toLocaleString('ar-IQ')]);
    $('#resultsTable').innerHTML = rows.length ? table(['اسم الطالب', 'الامتحان', 'الدرجة', 'النسبة', 'وقت التسليم'], rows) : '<div class="empty">لا توجد نتائج مسجلة حتى الآن.</div>';
}

function table(head, rows) { return `<table class="data-table"><thead><tr>${head.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`; }

function addQuestion(data = {}) {
    const n = $$('.question-editor').length + 1;
    const div = document.createElement('div');
    div.className = 'question-editor';
    div.innerHTML = `<div class="question-editor-head"><span>السؤال ${n}</span><button type="button" class="text-btn remove-q">حذف السؤال ×</button></div><label>نص السؤال<input class="q-text" required placeholder="اكتب السؤال هنا" value="${esc(data.text || '')}"></label><div class="options">${[0, 1, 2, 3].map((i) => `<input class="q-opt" required placeholder="الخيار ${['أ', 'ب', 'ج', 'د'][i]}" value="${esc(data.options?.[i] || '')}">`).join('')}</div><label style="margin-top:10px">الإجابة الصحيحة<select class="correct-select">${[0, 1, 2, 3].map((i) => `<option value="${i}" ${data.correct === i ? 'selected' : ''}>الخيار ${['أ', 'ب', 'ج', 'د'][i]}</option>`).join('')}</select></label>`;
    div.querySelector('.remove-q').onclick = () => { div.remove(); renumber() };
    $('#questionFields').append(div);
}

function renumber() { $$('.question-editor-head span').forEach((x, i) => x.textContent = 'السؤال ' + (i + 1)) }
function openNew() { $('#examForm').reset(); $('#questionFields').innerHTML = ''; addQuestion(); addQuestion(); $('#examModal').classList.add('show') }
function closeModal() { $('#examModal').classList.remove('show') }

$('#examForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const questions = $$('.question-editor').map(q => ({
        question_text: q.querySelector('.q-text').value.trim(),
        options: [...q.querySelectorAll('.q-opt')].map(x => x.value.trim()),
        correct_index: Number(q.querySelector('.correct-select').value)
    }));
    if (!questions.length || questions.some(q => !q.question_text || q.options.some(x => !x))) { toast('أكمل جميع الأسئلة والخيارات أولاً'); return; }

    const examData = { title: f.get('title').trim(), grade: f.get('grade'), duration: Number(f.get('duration')), code: f.get('code').trim().toUpperCase(), status: f.get('status') };
    const { data: insertedExam, error: examError } = await supabaseClient.from('exams').insert([examData]).select().single();
    if (examError) { toast('رمز الامتحان مستخدم مسبقاً أو حدث خطأ'); return; }

    await supabaseClient.from('questions').insert(questions.map(q => ({ ...q, exam_id: insertedExam.id })));
    toast('تم حفظ الامتحان بنجاح');
    closeModal(); go('exams'); loadDataFromSupabase();
});

document.addEventListener('click', async e => {
    const nav = e.target.closest('[data-view]'); if (nav) go(nav.dataset.view);
    const act = e.target.closest('[data-action]')?.dataset.action;
    if (act === 'new-exam') openNew(); if (act === 'close-modal') closeModal();
    const d = e.target.closest('[data-delete]');
    if (d && confirm('هل تريد حذف هذا الامتحان نهائياً؟')) {
        await supabaseClient.from('exams').delete().eq('id', d.dataset.delete);
        toast('تم حذف الامتحان'); loadDataFromSupabase();
    }
    const c = e.target.closest('[data-copy]');
    if (c) navigator.clipboard?.writeText(c.dataset.copy).then(() => toast('تم نسخ الرمز: ' + c.dataset.copy));
});

$('#addQuestion').onclick = () => addQuestion();
$('#exportCsv').onclick = () => {
    const rows = [['اسم الطالب', 'الامتحان', 'الدرجة', 'المجموع', 'النسبة', 'التاريخ'], ...state.attempts.map(a => [a.student, a.examTitle, a.score, a.total, a.percent, new Date(a.date).toLocaleString('ar-IQ')])];
    const csv = '\uFEFF' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); a.download = 'نتائج-الطلاب.csv'; a.click();
};
$('#mobileMenu').onclick = () => $('#sidebar').classList.toggle('open');

checkAuth();