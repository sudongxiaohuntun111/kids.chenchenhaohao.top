# FinTech Voice Quest MVP Plan

## Product Positioning

FinTech Voice Quest is a mobile-first pixel-style speaking game for Chinese professionals who work in cross-border financial technology projects. The player is a new delivery analyst at an international FinTech company. The main customer is a bank project team.

The first product goal is simple: help the learner speak useful English for real bank-client delivery work for 5 to 10 minutes every day.

## Target User

- Chinese-speaking FinTech, banking technology, implementation, product, QA, support, or project delivery staff.
- Intermediate English learners who can read basic English but hesitate in client calls.
- Mobile usage first: commute, lunch break, before a meeting, or before a client call.

## Core Learning Scenario

The player works with both bank-side stakeholders and internal teammates:

- Bank project manager
- Bank IT manager
- Bank operations user
- Bank compliance user
- Internal delivery lead
- Internal developer or QA teammate

The game focuses on spoken English for:

- Requirement clarification
- UAT preparation and feedback
- Defect triage
- Go-live planning
- Data/reporting discussions
- API and integration updates
- Risk and timeline communication
- Internal progress updates

## Daily Loop

Each day has 5 levels. This is intentionally small enough for mobile use and large enough to create a sense of progress.

1. Micro lesson
2. Teammate listening
3. Technical question
4. Bank reply
5. Manager update

Each level takes 1 to 2 minutes:

1. Watch or play a short micro lesson.
2. Listen to a bank-client, teammate, or manager sentence.
3. Speak the target response.
4. Receive lightweight feedback.
5. Earn XP and unlock the next level.

## MVP Scope

The MVP should include:

- Mobile portrait web app.
- Pixel office scene.
- Month 1 learning content.
- 4 weeks, 20 learning days, 5 levels per day, 100 levels total.
- Speech synthesis for NPC and target sentences.
- Microphone recording.
- Replay user's recording.
- Browser speech recognition when available.
- Keyword-based feedback.
- Local progress save with `localStorage`.
- Static deployment to any normal web server.

The MVP should not include yet:

- User accounts.
- Cloud sync.
- Payment.
- Leaderboards.
- Complex map navigation.
- AI-generated free dialogue.
- Full pronunciation scoring.

## Month 1 Progression

Month 1 is designed as four weekly steps:

- Week 1: Foundation. Requirement clarification, meeting basics, follow-up language.
- Week 2: UAT. Test readiness, issue handling, defect triage, status updates.
- Week 3: Technical communication. Data reconciliation, API integration, compliance, change requests.
- Week 4: Delivery confidence. Go-live planning, cutover, stakeholder updates, hypercare, monthly review.

Each week ends with a review day that combines the week's core phrases into a more realistic spoken update.

## Week 1 Content

### Day 1: Confirming Requirements

Core phrases:

- Could you walk me through...?
- Just to confirm...
- We will confirm this with our technical team.
- What is the expected output?
- Does this need to be ready before UAT?

Scenario:

The bank wants a report prepared before UAT, so the player has to clarify the requirement, check details with QA and engineering, reply to the bank, and brief the delivery lead.

### Day 2: UAT Feedback

Core phrases:

- Could you share the test case?
- We can reproduce the issue.
- It seems to happen when...
- We will check the logs.
- We will provide an update by end of day.

Scenario:

The bank reports a UAT issue with missing transaction records.

### Day 3: Defect Triage

Core phrases:

- Is this blocking your testing?
- We need to assess the impact.
- This looks like a configuration issue.
- We have identified the root cause.
- We can provide a workaround.

Scenario:

The bank asks whether a defect will delay UAT sign-off.

### Day 4: Data and Reporting

Core phrases:

- How often should the data refresh?
- The report pulls data from...
- The field mapping needs to be confirmed.
- The numbers may differ due to timing.
- We will reconcile the data.

Scenario:

The bank challenges a mismatch between system data and a report.

### Day 5: API Integration

Core phrases:

- The API endpoint is available.
- We are waiting for the bank-side credentials.
- Could you confirm the payload format?
- The request timed out.
- We need to align on the error handling logic.

Scenario:

The bank-side system cannot complete an API test.

### Day 6: Go-Live Planning

Core phrases:

- We need to freeze the scope.
- The cutover plan is under review.
- We should prepare a rollback plan.
- The go-live date depends on UAT sign-off.
- Let's align on the next checkpoint.

Scenario:

The bank asks whether the system can go live next Friday.

### Day 7: Weekly Client Meeting

Core phrases:

- Here is a quick summary.
- The main open item is...
- We are on track for...
- The key risk is...
- We will follow up after the meeting.

Scenario:

The player gives a short spoken update to the bank and internal delivery lead.

## Level Data Shape

```json
{
  "day": 1,
  "level": 1,
  "title": "Confirm the Requirement",
  "npc": "Ms. Chen · Bank PM",
  "npcLine": "We need to confirm the reporting requirement before UAT starts.",
  "lesson": "Use \"Could you walk me through...\" when you want a bank client to explain a requirement step by step.",
  "mode": "Shadowing",
  "target": "Could you walk me through the reporting requirement?",
  "hint": "请跟读：你能带我过一下报表需求吗？",
  "keywords": ["walk me through", "requirement", "reporting"],
  "xp": 12
}
```

## Course Source Strategy

Use open educational resources as reference only, then rewrite scripts into original FinTech banking scenarios.

Recommended approach:

- Do not copy full courses, long dialogues, or proprietary audio.
- Extract reusable teaching concepts such as polite requests, clarification, summarizing, and follow-up.
- Write original micro lessons and role-play lines for the game.
- Generate or record original audio and video.
- Keep attribution notes for any source that materially influences a lesson.

Possible reference categories:

- Public-domain general English listening materials.
- Open business communication textbooks.
- OER workplace communication courses.
- Internal project delivery vocabulary collected from real work, rewritten and anonymized.

## Technical Plan

Recommended first implementation:

- Static HTML, CSS, and JavaScript for prototype.
- Later upgrade to Vite + TypeScript when content and interaction model are stable.
- Store level content in JSON.
- Use `speechSynthesis` for standard English voice.
- Use `MediaRecorder` for recording and playback.
- Use `SpeechRecognition` where the browser supports it.
- Add server-side AI speech scoring in phase 2.

Important audio note:

- Browser text-to-speech is only acceptable for the prototype.
- The production version should use recorded or generated natural voice audio for NPC lines and micro lessons.
- Lesson progress should follow actual audio duration, not a fixed 30-second timer.
- Recording should use a tap-to-start and tap-to-stop interaction on mobile, because hold-to-record is fragile when the browser asks for microphone permission.

Deployment:

- Build as static files.
- Upload to the existing web server.
- Point the domain or a subdomain to the app directory.
- Use HTTPS because microphone access requires a secure context in most mobile browsers.

## Phase 2 Ideas

- AI speech-to-text and meaning evaluation.
- Pronunciation feedback by phrase.
- Daily review deck.
- Bank role selection: PM, IT, compliance, operations.
- More pixel office areas.
- Weekly boss review.
- Cloud login and cross-device progress.
