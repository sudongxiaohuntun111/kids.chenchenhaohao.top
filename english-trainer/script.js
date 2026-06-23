const dayPlan = [
    {
        level: 'Level 1 of 5',
        title: 'Confirm the Requirement',
        npc: 'Ms. Chen · Bank PM',
        npcLine: 'We need to confirm the reporting requirement before UAT starts.',
        lesson: 'Use “Could you walk me through...” when you want a bank client to explain a requirement step by step. It sounds professional and collaborative.',
        mode: 'Shadowing',
        target: 'Could you walk me through the reporting requirement?',
        hint: '请跟读：你能带我过一下报表需求吗？',
        keywords: ['walk me through', 'requirement', 'reporting'],
        xp: 12
    },
    {
        level: 'Level 2 of 5',
        title: 'Sync with QA',
        npc: 'Mia · QA Teammate',
        npcLine: 'I can prepare the UAT test cases once the reporting fields are confirmed.',
        lesson: 'When speaking with teammates, you can be direct but still clear. Use “once...” to connect a dependency with the next action.',
        mode: 'Team sync',
        target: 'Mia can prepare the UAT test cases once the reporting fields are confirmed.',
        hint: '请复述同事的意思：报表字段确认后，Mia 可以准备 UAT 测试用例。',
        keywords: ['UAT test cases', 'once', 'reporting fields'],
        xp: 14
    },
    {
        level: 'Level 3 of 5',
        title: 'Ask the Developer',
        npc: 'Ravi · Backend Engineer',
        npcLine: 'The refresh frequency depends on the batch job schedule.',
        lesson: 'For internal technical questions, ask for the reason behind a constraint. “What drives...” is a useful way to ask why something depends on something else.',
        mode: 'Internal question',
        target: 'What drives the batch job schedule, and can we adjust it for this report?',
        hint: '请问技术同事：批处理计划由什么决定？这个报表能不能调整？',
        keywords: ['batch job schedule', 'adjust', 'report'],
        xp: 16
    },
    {
        level: 'Level 4 of 5',
        title: 'Reply to the Bank',
        npc: 'Mr. Wong · Bank IT',
        npcLine: 'Can you confirm the data refresh frequency?',
        lesson: 'A good client reply starts with acknowledgement, then gives the next action. “Understood. We will confirm...” is clear and safe.',
        mode: 'Client reply',
        target: 'Understood. We will confirm the data refresh frequency with our technical team.',
        hint: '请回应客户：明白，我们会和技术团队确认数据刷新频率。',
        keywords: ['understood', 'confirm', 'data refresh frequency'],
        xp: 18
    },
    {
        level: 'Level 5 of 5',
        title: 'Boss Review',
        npc: 'Alex · Delivery Lead',
        npcLine: 'Give me a quick update on the bank reporting request.',
        lesson: 'For an internal update, summarize the client need and the next action in one sentence. Keep it short and specific.',
        mode: 'Daily recap',
        target: 'The bank needs the reporting fields confirmed, and our team is checking the refresh frequency.',
        hint: '请向领导汇报：银行需要确认报表字段，我们团队正在检查刷新频率。',
        keywords: ['reporting fields', 'our team', 'refresh frequency'],
        xp: 20
    }
];

const coursePlan = Array.isArray(window.coursePlan) && window.coursePlan.length
    ? window.coursePlan
    : [{ week: 1, day: 1, title: 'Day 1', subtitle: 'Prototype content', theme: 'Prototype', levels: dayPlan }];

const state = {
    currentDay: Number(localStorage.getItem('fvq-current-day') || 0),
    current: Number(localStorage.getItem('fvq-current') || 0),
    xp: Number(localStorage.getItem('fvq-xp') || 0),
    completedByDay: JSON.parse(localStorage.getItem('fvq-completed-days') || '{}'),
    seenIntro: localStorage.getItem('fvq-seen-intro') === '1',
    mediaRecorder: null,
    audioChunks: [],
    audioUrl: '',
    transcript: '',
    recognition: null,
    isRecording: false,
    hasScored: false,
    lessonTimer: null,
    lessonStartedAt: 0,
    lessonTotalMs: 1,
    selectedVoice: null,
    selectedVoiceName: 'browser default'
};

const nodes = {
    onboardingPanel: document.getElementById('onboardingPanel'),
    startGuideBtn: document.getElementById('startGuideBtn'),
    dayLabel: document.getElementById('dayLabel'),
    courseTitle: document.getElementById('courseTitle'),
    courseSubtitle: document.getElementById('courseSubtitle'),
    prevDayBtn: document.getElementById('prevDayBtn'),
    nextDayBtn: document.getElementById('nextDayBtn'),
    xpValue: document.getElementById('xpValue'),
    npcName: document.getElementById('npcName'),
    npcLine: document.getElementById('npcLine'),
    stageLabel: document.getElementById('stageLabel'),
    missionTitle: document.getElementById('missionTitle'),
    lessonText: document.getElementById('lessonText'),
    lessonProgress: document.getElementById('lessonProgress'),
    voiceNote: document.getElementById('voiceNote'),
    challengeMode: document.getElementById('challengeMode'),
    targetLine: document.getElementById('targetLine'),
    hintLine: document.getElementById('hintLine'),
    keywordRow: document.getElementById('keywordRow'),
    micButton: document.getElementById('micButton'),
    micLabel: document.getElementById('micLabel'),
    replayBtn: document.getElementById('replayBtn'),
    playTargetBtn: document.getElementById('playTargetBtn'),
    scoreValue: document.getElementById('scoreValue'),
    feedbackTitle: document.getElementById('feedbackTitle'),
    feedbackText: document.getElementById('feedbackText'),
    playNpcBtn: document.getElementById('playNpcBtn'),
    lessonPlayBtn: document.getElementById('lessonPlayBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    routeSteps: Array.from(document.querySelectorAll('.route-step'))
};

function saveState() {
    localStorage.setItem('fvq-current-day', String(state.currentDay));
    localStorage.setItem('fvq-current', String(state.current));
    localStorage.setItem('fvq-xp', String(state.xp));
    localStorage.setItem('fvq-completed-days', JSON.stringify(state.completedByDay));
}

function getCurrentCourseDay() {
    if (state.currentDay < 0) state.currentDay = 0;
    if (state.currentDay >= coursePlan.length) state.currentDay = coursePlan.length - 1;
    return coursePlan[state.currentDay];
}

function getDayLevels() {
    return getCurrentCourseDay().levels;
}

function getCompletedLevels() {
    const key = String(state.currentDay);
    if (!Array.isArray(state.completedByDay[key])) {
        state.completedByDay[key] = [];
    }
    return state.completedByDay[key];
}

function getCurrentMission() {
    const levels = getDayLevels();
    if (state.current < 0) state.current = 0;
    if (state.current >= levels.length) state.current = levels.length - 1;
    return levels[state.current];
}

function getBestVoice() {
    if (!window.speechSynthesis) return null;

    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const preferredNames = [
        'jenny',
        'aria',
        'guy',
        'samantha',
        'daniel',
        'google us english',
        'google uk english',
        'microsoft'
    ];

    const englishVoices = voices.filter((voice) => /^en[-_]/i.test(voice.lang));
    const scored = englishVoices.map((voice) => {
        const name = voice.name.toLowerCase();
        const langScore = /en[-_]us/i.test(voice.lang) ? 20 : 10;
        const nameScore = preferredNames.reduce((score, preferred, index) => {
            return name.includes(preferred) ? Math.max(score, 40 - index * 3) : score;
        }, 0);
        const serviceScore = voice.localService ? 6 : 0;
        return { voice, score: langScore + nameScore + serviceScore };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0] ? scored[0].voice : voices[0];
}

function refreshVoice() {
    state.selectedVoice = getBestVoice();
    state.selectedVoiceName = state.selectedVoice ? state.selectedVoice.name : 'browser default';
    if (nodes.voiceNote) {
        nodes.voiceNote.textContent = `Voice: ${state.selectedVoiceName}`;
    }
}

function estimateSpeechMs(text, rate) {
    const words = text.split(/\s+/).filter(Boolean).length;
    const ms = (words / (2.25 * rate)) * 1000;
    return Math.max(3500, Math.min(18000, ms + 1200));
}

function speak(text, rate = 0.88) {
    if (!window.speechSynthesis) {
        setFeedback('--', '无法播放语音', '当前浏览器不支持语音播放，请换用 Chrome、Edge 或 Safari。');
        return Promise.resolve();
    }

    refreshVoice();
    window.speechSynthesis.cancel();
    return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = state.selectedVoice ? state.selectedVoice.lang : 'en-US';
        utterance.voice = state.selectedVoice;
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.onend = resolve;
        utterance.onerror = resolve;
        window.speechSynthesis.speak(utterance);
    });
}

function getRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    return recognition;
}

function normalizeWords(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
}

function scoreSpeech(transcript, mission) {
    const heard = normalizeWords(transcript);
    const target = normalizeWords(mission.target);
    const keywordWords = mission.keywords.flatMap(normalizeWords);
    const keywordHits = keywordWords.filter((word) => new Set(heard).has(word)).length;
    const keywordTotal = keywordWords.length;

    if (!heard.length) {
        return {
            score: 0,
            title: '未识别到英文',
            message: '可以先播放角色语音，再点击麦克风重试。'
        };
    }

    const heardSet = new Set(heard);
    const targetHits = target.filter((word) => heardSet.has(word)).length;
    const targetScore = target.length ? targetHits / target.length : 0;
    const keywordScore = keywordWords.length ? keywordHits / keywordWords.length : 0;
    const score = Math.min(100, Math.round(targetScore * 65 + keywordScore * 35));
    const hitText = `识别到：“${transcript}”。关键词命中 ${keywordHits}/${keywordTotal}：${mission.keywords.join(' / ')}。`;

    if (score >= 84) {
        return {
            score,
            title: '本关反馈：表达清楚',
            message: `${hitText} 核心意思抓住了，可以进入下一关。`
        };
    }

    if (score >= 58) {
        return {
            score,
            title: '本关反馈：基本达标',
            message: `${hitText} 建议再跟读一次，把关键词说得更完整。`
        };
    }

    return {
        score,
        title: '本关反馈：再练一次',
        message: `${hitText} 建议先点“🔊 目标句”听一遍，跟读后再完整说一遍。`
    };
}

function setFeedback(score, title, text) {
    nodes.scoreValue.textContent = score;
    nodes.feedbackTitle.textContent = title;
    nodes.feedbackText.textContent = text;
}

function stopLessonTimer() {
    if (state.lessonTimer) {
        clearInterval(state.lessonTimer);
        state.lessonTimer = null;
    }
}

function playLesson() {
    stopLessonTimer();
    const lesson = getCurrentMission().lesson;
    const rate = 0.94;

    state.lessonStartedAt = Date.now();
    state.lessonTotalMs = estimateSpeechMs(lesson, rate);
    nodes.lessonProgress.style.width = '0%';
    nodes.lessonPlayBtn.textContent = 'Playing';
    speak(lesson, rate).then(() => {
        stopLessonTimer();
        nodes.lessonProgress.style.width = '100%';
        nodes.lessonPlayBtn.textContent = 'Play';
    });

    state.lessonTimer = setInterval(() => {
        const elapsed = Date.now() - state.lessonStartedAt;
        const percent = Math.min(98, (elapsed / state.lessonTotalMs) * 100);
        nodes.lessonProgress.style.width = `${percent}%`;
    }, 120);
}

function renderMission() {
    const courseDay = getCurrentCourseDay();
    const levels = getDayLevels();
    const completed = getCompletedLevels();
    const mission = getCurrentMission();

    nodes.dayLabel.textContent = `Week ${courseDay.week} · Day ${courseDay.day}`;
    nodes.courseTitle.textContent = courseDay.title;
    nodes.courseSubtitle.textContent = courseDay.subtitle;
    nodes.xpValue.textContent = state.xp;
    nodes.npcName.textContent = mission.npc;
    nodes.npcLine.textContent = mission.npcLine;
    nodes.stageLabel.textContent = mission.level;
    nodes.missionTitle.textContent = mission.title;
    nodes.lessonText.textContent = mission.lesson;
    nodes.challengeMode.textContent = mission.mode;
    nodes.targetLine.textContent = mission.target;
    nodes.hintLine.textContent = mission.hint;
    nodes.keywordRow.innerHTML = '';
    mission.keywords.forEach((keyword) => {
        const chip = document.createElement('span');
        chip.textContent = keyword;
        nodes.keywordRow.appendChild(chip);
    });

    nodes.routeSteps.forEach((step, index) => {
        const level = levels[index];
        if (level) {
            const emoji = step.querySelector('.route-emoji');
            const label = step.querySelector('small');
            if (emoji) emoji.textContent = level.routeEmoji || String(index + 1);
            if (label) label.textContent = level.routeLabel || `第 ${index + 1} 关`;
        }
        step.classList.toggle('active', index === state.current);
        step.classList.toggle('done', completed.includes(index));
    });

    nodes.prevBtn.disabled = state.current === 0;
    nodes.prevDayBtn.disabled = state.currentDay === 0;
    nodes.nextDayBtn.disabled = state.currentDay === coursePlan.length - 1;
    nodes.nextBtn.textContent = state.current === levels.length - 1 ? 'Finish day' : 'Next level';
    nodes.lessonProgress.style.width = '0%';
    nodes.replayBtn.disabled = !state.audioUrl;
    setFeedback('--', '准备练习', '听完小课后，点击麦克风开始录音，再点击一次结束。');
    nodes.micLabel.textContent = 'Start recording';
    nodes.micButton.classList.remove('recording');
    stopLessonTimer();
    refreshVoice();
}

async function startMediaRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
        throw new Error('MediaRecorder is not available in this browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.audioChunks = [];
    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    const supportedType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
    const recorderOptions = supportedType ? { mimeType: supportedType } : undefined;
    state.mediaRecorder = new MediaRecorder(stream, recorderOptions);

    state.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) state.audioChunks.push(event.data);
    };

    state.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(state.audioChunks, { type: supportedType || 'audio/webm' });
        if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
        state.audioUrl = URL.createObjectURL(audioBlob);
        nodes.replayBtn.disabled = false;
        stream.getTracks().forEach((track) => track.stop());
    };

    state.mediaRecorder.start();
}

async function startSpeaking() {
    if (state.isRecording) return;

    state.isRecording = true;
    state.transcript = '';
    state.hasScored = false;
    nodes.micButton.classList.add('recording');
    nodes.micLabel.textContent = 'Stop recording';
    setFeedback('--', '录音中', '请说出目标表达。识别到片段后不会自动结束；说完后再点一次麦克风，系统才会结算本关反馈。');

    try {
        await startMediaRecording();
    } catch (error) {
        console.warn('MediaRecorder unavailable:', error);
        state.isRecording = false;
        nodes.micButton.classList.remove('recording');
        nodes.micLabel.textContent = 'Start recording';
        setFeedback('--', '录音启动失败', '请确认浏览器允许麦克风权限，并用 HTTPS 或 localhost 打开页面。');
        return;
    }

    const recognition = getRecognition();
    if (!recognition) {
        setFeedback('--', '录音中', '当前浏览器不支持自动识别。结束后可以点 Replay 回听，并对照目标句自查。');
        return;
    }

    state.recognition = recognition;

    recognition.onresult = (event) => {
        state.transcript = event.results[0][0].transcript;
        setFeedback('--', '已识别到片段', `目前识别到：“${state.transcript}”。你可以继续说；全部说完后，再点一次麦克风结束并生成本关反馈。`);
    };

    recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
        state.recognition = null;
    };

    try {
        recognition.start();
    } catch (error) {
        console.warn('SpeechRecognition start failed:', error);
    }
}

function finishSpeaking() {
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
    }

    state.isRecording = false;
    nodes.micButton.classList.remove('recording');
    nodes.micLabel.textContent = 'Start recording';
}

function completeAttempt(transcript) {
    if (state.hasScored) return;

    state.hasScored = true;
    state.transcript = transcript;
    finishSpeaking();

    const mission = getCurrentMission();
    const completed = getCompletedLevels();
    const result = scoreSpeech(transcript, mission);
    setFeedback(result.score, result.title, result.message);

    if (result.score >= 58 && !completed.includes(state.current)) {
        completed.push(state.current);
        state.xp += mission.xp;
        saveState();
        nodes.xpValue.textContent = state.xp;
        nodes.routeSteps[state.current].classList.add('done');
    }
}

function stopSpeaking() {
    if (!state.isRecording) return;

    if (state.recognition) {
        try {
            state.recognition.stop();
        } catch (error) {
            console.warn('SpeechRecognition stop failed:', error);
        }
    }

    finishSpeaking();

    if (state.transcript) {
        completeAttempt(state.transcript);
        return;
    }

    setFeedback('--', '录音已保存', '自动识别没有拿到文字。可以点 Replay 回听，并对照目标句自查：关键词是否说完整、语速是否太快。');
}

function replayRecording() {
    if (!state.audioUrl) return;
    const audio = new Audio(state.audioUrl);
    audio.play();
}

function goToLevel(nextIndex) {
    state.current = Math.max(0, Math.min(getDayLevels().length - 1, nextIndex));
    saveState();
    renderMission();
}

function goToDay(nextDayIndex) {
    state.currentDay = Math.max(0, Math.min(coursePlan.length - 1, nextDayIndex));
    state.current = 0;
    if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
    }
    state.audioUrl = '';
    saveState();
    renderMission();
}

nodes.playNpcBtn.addEventListener('click', () => {
    speak(getCurrentMission().npcLine);
});

nodes.playTargetBtn.addEventListener('click', () => {
    speak(getCurrentMission().target, 0.86);
});

nodes.lessonPlayBtn.addEventListener('click', playLesson);
nodes.replayBtn.addEventListener('click', replayRecording);
nodes.prevBtn.addEventListener('click', () => goToLevel(state.current - 1));
nodes.prevDayBtn.addEventListener('click', () => goToDay(state.currentDay - 1));
nodes.nextDayBtn.addEventListener('click', () => goToDay(state.currentDay + 1));
nodes.nextBtn.addEventListener('click', () => {
    const levels = getDayLevels();
    if (state.current === levels.length - 1) {
        state.completedByDay[String(state.currentDay)] = [0, 1, 2, 3, 4];
        saveState();
        if (state.currentDay < coursePlan.length - 1) {
            const nextDay = coursePlan[state.currentDay + 1];
            goToDay(state.currentDay + 1);
            setFeedback('Done', '今日完成', `今日 5 关完成。累计 ${state.xp} XP。已进入 Week ${nextDay.week} · Day ${nextDay.day}：${nextDay.title}。`);
            return;
        }
        renderMission();
        setFeedback('Done', '月度完成', `第一个月 20 天课程已完成。累计 ${state.xp} XP。`);
        return;
    }

    goToLevel(state.current + 1);
});

nodes.routeSteps.forEach((step) => {
    step.addEventListener('click', () => {
        goToLevel(Number(step.dataset.level));
    });
});

nodes.micButton.addEventListener('click', () => {
    if (state.isRecording) {
        stopSpeaking();
        return;
    }

    startSpeaking();
});

nodes.startGuideBtn.addEventListener('click', () => {
    state.seenIntro = true;
    localStorage.setItem('fvq-seen-intro', '1');
    nodes.onboardingPanel.classList.add('hidden');
});

if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = refreshVoice;
}

renderMission();

if (state.seenIntro) {
    nodes.onboardingPanel.classList.add('hidden');
}
