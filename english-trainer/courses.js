window.coursePlan = [
    {
        week: 1,
        day: 1,
        title: 'Client + Team Basics',
        subtitle: '需求澄清、内部同步、客户回复',
        theme: 'Requirement kickoff',
        levels: [
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
                xp: 12,
                routeEmoji: '🧭',
                routeLabel: '看小课'
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
                xp: 14,
                routeEmoji: '🎧',
                routeLabel: '听同事'
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
                xp: 16,
                routeEmoji: '🧑‍💻',
                routeLabel: '问技术'
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
                xp: 18,
                routeEmoji: '🏦',
                routeLabel: '回银行'
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
                xp: 20,
                routeEmoji: '📣',
                routeLabel: '做汇报'
            }
        ]
    },
    {
        week: 1,
        day: 2,
        title: 'Clarifying Scope',
        subtitle: '边界、优先级、待确认事项',
        theme: 'Scope questions',
        levels: makeDay(1, 2, 'Clarifying Scope', [
            ['🧭', '看小课', 'Ask About Scope', 'Ms. Chen · Bank PM', 'Can you clarify whether this change is in scope for phase one?', 'Use “in scope” and “out of scope” to discuss project boundaries without sounding negative.', 'Could you clarify whether this change is in scope for phase one?', '请询问：这个变更是否属于一期范围？', ['clarify', 'in scope', 'phase one']],
            ['🎧', '听需求', 'Catch the Priority', 'Ms. Chen · Bank PM', 'The priority is the customer-facing report, not the internal dashboard.', 'Listen for contrast words like “not” and “instead.” They often reveal the real priority.', 'The priority is the customer-facing report, not the internal dashboard.', '请复述：优先项是面向客户的报表，不是内部看板。', ['priority', 'customer-facing report', 'dashboard']],
            ['🧑‍💻', '问产品', 'Check Product Impact', 'Nina · Product Owner', 'If we add this field, we need to update the export template as well.', 'When a teammate mentions impact, confirm the connected work item before replying to the client.', 'If we add this field, we need to update the export template as well.', '请复述：如果增加字段，也要更新导出模板。', ['add this field', 'update', 'export template']],
            ['🏦', '回银行', 'Set a Boundary', 'Mr. Wong · Bank IT', 'Can we include the dashboard change in the same release?', 'A polite boundary uses “we can review it” instead of a flat no.', 'We can review it, but we may need to treat it as a separate change request.', '请回复：可以评估，但可能要作为单独变更请求处理。', ['review it', 'separate', 'change request']],
            ['📣', '做汇报', 'Scope Recap', 'Alex · Delivery Lead', 'What are the scope risks for today?', 'A short risk update should include what changed, why it matters, and the next step.', 'The main scope risk is the dashboard request, and we need to confirm whether it belongs to phase one.', '请汇报：主要范围风险是看板需求，需要确认是否属于一期。', ['scope risk', 'dashboard request', 'phase one']]
        ])
    },
    {
        week: 1,
        day: 3,
        title: 'Meeting Basics',
        subtitle: '确认、打断、总结下一步',
        theme: 'Client meeting flow',
        levels: makeDay(1, 3, 'Meeting Basics', [
            ['🧭', '看小课', 'Open the Meeting', 'Alex · Delivery Lead', 'Let us align on the agenda before we start.', 'Use “align on” when you want everyone to agree on the topic, plan, or next step.', 'Let us align on the agenda before we start.', '请跟读：开始前我们先对齐议程。', ['align on', 'agenda', 'before we start']],
            ['🎧', '听客户', 'Catch a Concern', 'Ms. Chen · Bank PM', 'My concern is whether the report logic is consistent across channels.', 'When someone says “my concern is,” the next phrase is the real problem to capture.', 'Her concern is whether the report logic is consistent across channels.', '请复述：她担心报表逻辑在不同渠道是否一致。', ['concern', 'report logic', 'consistent']],
            ['🧑‍💻', '问同事', 'Ask for Input', 'Ravi · Backend Engineer', 'The logic is shared, but the data source is slightly different.', 'Use “Could you explain...” to invite a teammate to clarify without sounding like a challenge.', 'Could you explain how the data source is different?', '请询问同事：能解释一下数据源有什么不同吗？', ['explain', 'data source', 'different']],
            ['🏦', '回银行', 'Confirm Understanding', 'Ms. Chen · Bank PM', 'So the same rule may return different numbers in different channels?', 'Use “That is correct” plus a brief reason to sound confident and helpful.', 'That is correct. The rule is the same, but the source data may update at different times.', '请回复：是的，规则相同，但源数据更新时间可能不同。', ['that is correct', 'source data', 'different times']],
            ['📣', '做汇报', 'Close the Meeting', 'Alex · Delivery Lead', 'Can you summarize the action items?', 'End a meeting with owners and next steps, not just a topic summary.', 'We will compare the data sources and share the findings before tomorrow afternoon.', '请总结：我们会比较数据源，并在明天下午前分享结论。', ['compare', 'data sources', 'findings']]
        ])
    },
    {
        week: 1,
        day: 4,
        title: 'Follow-up Language',
        subtitle: '跟进、催办、承诺时间',
        theme: 'Follow-up rhythm',
        levels: makeDay(1, 4, 'Follow-up Language', [
            ['🧭', '看小课', 'Polite Follow-up', 'Alex · Delivery Lead', 'Could you follow up with the bank on the pending items?', 'Use “follow up on” for topics and “follow up with” for people.', 'I will follow up with the bank on the pending items.', '请回复领导：我会跟银行跟进待处理事项。', ['follow up with', 'pending items', 'bank']],
            ['🎧', '听客户', 'Pending Approval', 'Mr. Wong · Bank IT', 'The field list is still pending business approval.', '“Pending approval” means you should not treat the item as final yet.', 'The field list is still pending business approval.', '请复述：字段清单仍在等待业务审批。', ['field list', 'pending', 'business approval']],
            ['🧑‍💻', '问同事', 'Internal Reminder', 'Mia · QA Teammate', 'I need the final field list before I can update the test cases.', 'When reminding a teammate, connect the request to the work it blocks.', 'Could you share the final field list once it is approved?', '请提醒：审批后能否分享最终字段清单？', ['share', 'final field list', 'approved']],
            ['🏦', '回银行', 'Timeline Promise', 'Ms. Chen · Bank PM', 'When can you send the updated timeline?', 'Give a realistic time commitment and avoid vague promises like “soon.”', 'We will send the updated timeline by end of day tomorrow.', '请回复：我们会在明天下班前发送更新时间线。', ['updated timeline', 'end of day', 'tomorrow']],
            ['📣', '做汇报', 'Follow-up Recap', 'Alex · Delivery Lead', 'What is still pending?', 'A useful follow-up recap separates client-side pending items from our actions.', 'The field list is pending bank approval, and we will update the timeline tomorrow.', '请汇报：字段清单待银行审批，我们明天更新时间线。', ['pending bank approval', 'update', 'timeline']]
        ])
    },
    {
        week: 1,
        day: 5,
        title: 'Week 1 Review',
        subtitle: '需求、会议、跟进综合复盘',
        theme: 'Client communication review',
        levels: makeDay(1, 5, 'Week 1 Review', [
            ['🧭', '复习', 'Phrase Review', 'Coach · Pixel Tutor', 'Today you will combine scope, priority, and follow-up language.', 'Review days should feel slightly harder. Try to speak in complete sentences, not isolated phrases.', 'I will clarify the scope, confirm the priority, and follow up on the pending items.', '请整句表达：我会澄清范围、确认优先级，并跟进待办事项。', ['clarify scope', 'confirm priority', 'follow up']],
            ['🎧', '听客户', 'Mixed Request', 'Ms. Chen · Bank PM', 'Please confirm the priority and send us the updated timeline after the field list is approved.', 'In a longer request, capture the sequence: first approval, then timeline.', 'The bank wants us to confirm the priority and send the updated timeline after approval.', '请复述：银行希望确认优先级，并在审批后发送更新时间线。', ['confirm priority', 'updated timeline', 'after approval']],
            ['🧑‍💻', '问同事', 'Team Coordination', 'Mia · QA Teammate', 'If the timeline changes, I need to adjust the UAT plan.', 'Use “if the timeline changes” to discuss downstream impact clearly.', 'If the timeline changes, we need to adjust the UAT plan.', '请复述：如果时间线变化，我们需要调整 UAT 计划。', ['timeline changes', 'adjust', 'UAT plan']],
            ['🏦', '回银行', 'Professional Reply', 'Mr. Wong · Bank IT', 'Can you confirm whether the change is included in this release?', 'A good answer states current status and next confirmation step.', 'We are checking whether the change is included in this release, and we will confirm by tomorrow.', '请回复：我们正在确认是否包含在本次发布中，明天确认。', ['checking', 'included', 'this release']],
            ['📣', '周复盘', 'Weekly Summary', 'Alex · Delivery Lead', 'Give me a short weekly summary.', 'A weekly summary should mention progress, open items, and risks.', 'This week we clarified the reporting scope, confirmed key pending items, and identified one release risk.', '请汇报：本周澄清了报表范围、确认了待办，并识别一个发布风险。', ['clarified', 'pending items', 'release risk']]
        ])
    },
    {
        week: 2,
        day: 6,
        title: 'UAT Kickoff',
        subtitle: '测试准备、用例、入口条件',
        theme: 'UAT preparation',
        levels: makeDay(2, 6, 'UAT Kickoff', [
            ['🧭', '看小课', 'UAT Readiness', 'Alex · Delivery Lead', 'We need to confirm the UAT entry criteria.', 'Use “entry criteria” to talk about what must be ready before testing starts.', 'We need to confirm the UAT entry criteria.', '请跟读：我们需要确认 UAT 入口条件。', ['UAT', 'entry criteria', 'confirm']],
            ['🎧', '听客户', 'Test Data Need', 'Mr. Wong · Bank IT', 'The test data should include both successful and failed transactions.', 'Testing language often uses pairs like successful and failed, valid and invalid, normal and exception.', 'The test data should include successful and failed transactions.', '请复述：测试数据应包含成功和失败交易。', ['test data', 'successful', 'failed transactions']],
            ['🧑‍💻', '问QA', 'Test Case Status', 'Mia · QA Teammate', 'I have drafted the test cases, but the edge cases still need review.', 'Use “drafted” for a first version and “need review” for work that is not final.', 'The test cases are drafted, but the edge cases still need review.', '请复述：测试用例已起草，但边界场景还需评审。', ['test cases', 'edge cases', 'review']],
            ['🏦', '回银行', 'Share Readiness', 'Ms. Chen · Bank PM', 'Are we ready to start UAT on Monday?', 'If readiness depends on open items, answer with status plus dependency.', 'We are almost ready, but we still need to finalize the edge cases.', '请回复：基本准备好了，但仍需最终确认边界场景。', ['almost ready', 'finalize', 'edge cases']],
            ['📣', '做汇报', 'UAT Plan Recap', 'Alex · Delivery Lead', 'What do we need before UAT starts?', 'A useful UAT update mentions test data, test cases, and owners.', 'Before UAT starts, we need final test data, reviewed test cases, and confirmed owners.', '请汇报：UAT 前需要最终测试数据、评审后的用例和确认的负责人。', ['test data', 'test cases', 'owners']]
        ])
    },
    {
        week: 2,
        day: 7,
        title: 'Handling UAT Issues',
        subtitle: '复现、日志、影响判断',
        theme: 'UAT issue handling',
        levels: makeDay(2, 7, 'Handling UAT Issues', [
            ['🧭', '看小课', 'Ask for Evidence', 'Coach · Pixel Tutor', 'Could you share the test case and screenshot?', 'When an issue is reported, ask for evidence politely before diagnosing.', 'Could you share the test case and screenshot?', '请跟读：能分享测试用例和截图吗？', ['test case', 'screenshot', 'share']],
            ['🎧', '听客户', 'Issue Report', 'Ms. Chen · Bank PM', 'The transaction status is not updated after approval.', 'Listen for the trigger word “after.” It tells you when the issue happens.', 'The transaction status is not updated after approval.', '请复述：审批后交易状态没有更新。', ['transaction status', 'updated', 'after approval']],
            ['🧑‍💻', '问技术', 'Check Logs', 'Ravi · Backend Engineer', 'The approval event reached our system, but the status update job failed.', 'For technical updates, capture both what worked and what failed.', 'The approval event reached the system, but the status update job failed.', '请复述：审批事件到了系统，但状态更新任务失败了。', ['approval event', 'reached', 'job failed']],
            ['🏦', '回银行', 'Acknowledge Issue', 'Mr. Wong · Bank IT', 'Is this a system defect?', 'Do not over-confirm too early. Say what you are checking and when you will update.', 'We are checking the logs and will confirm the root cause by end of day.', '请回复：我们在查日志，会在今天结束前确认根因。', ['checking logs', 'root cause', 'end of day']],
            ['📣', '做汇报', 'Issue Impact', 'Alex · Delivery Lead', 'Is the issue blocking UAT?', '“Blocking” means work cannot continue. Use it carefully and clearly.', 'The issue affects one scenario, but it is not blocking the full UAT cycle yet.', '请汇报：问题影响一个场景，但尚未阻塞整个 UAT。', ['affects', 'not blocking', 'UAT cycle']]
        ])
    },
    {
        week: 2,
        day: 8,
        title: 'Defect Triage',
        subtitle: '严重程度、优先级、临时方案',
        theme: 'Defect discussion',
        levels: makeDay(2, 8, 'Defect Triage', [
            ['🧭', '看小课', 'Severity vs Priority', 'Coach · Pixel Tutor', 'Severity describes impact, while priority describes urgency.', 'Use severity for business or system impact, and priority for how soon it should be fixed.', 'Severity describes impact, while priority describes urgency.', '请跟读：严重程度描述影响，优先级描述紧急度。', ['severity', 'priority', 'urgency']],
            ['🎧', '听客户', 'Urgent Concern', 'Ms. Chen · Bank PM', 'This issue affects month-end reporting, so we need a high priority fix.', 'When the client mentions a business deadline, treat it as a priority signal.', 'The issue affects month-end reporting, so the bank needs a high priority fix.', '请复述：问题影响月末报表，银行需要高优先级修复。', ['month-end reporting', 'high priority', 'fix']],
            ['🧑‍💻', '问技术', 'Workaround Check', 'Ravi · Backend Engineer', 'We can provide a manual workaround while we prepare the permanent fix.', 'A workaround is temporary. Make that clear so the client does not mistake it for the final fix.', 'Can we provide a manual workaround while preparing the permanent fix?', '请询问：准备永久修复时，能否提供手工临时方案？', ['manual workaround', 'permanent fix', 'prepare']],
            ['🏦', '回银行', 'Explain Workaround', 'Mr. Wong · Bank IT', 'Do you have a temporary solution?', 'When offering a workaround, include its limitation and the next update time.', 'We can provide a manual workaround today, and we will share the permanent fix plan tomorrow.', '请回复：今天可提供手工临时方案，明天分享永久修复计划。', ['manual workaround', 'today', 'fix plan']],
            ['📣', '做汇报', 'Triage Summary', 'Alex · Delivery Lead', 'How should we prioritize this defect?', 'A triage summary should include impact, workaround, and fix plan.', 'We should treat it as high priority because it affects month-end reporting.', '请汇报：应作为高优先级处理，因为影响月末报表。', ['high priority', 'affects', 'month-end reporting']]
        ])
    },
    {
        week: 2,
        day: 9,
        title: 'Status Updates',
        subtitle: '进展、阻塞、ETA',
        theme: 'Clear updates',
        levels: makeDay(2, 9, 'Status Updates', [
            ['🧭', '看小课', 'Give an ETA', 'Coach · Pixel Tutor', 'ETA means estimated time of arrival or completion.', 'In project English, ETA usually means when something will be ready.', 'The ETA for the fix is tomorrow afternoon.', '请跟读：修复预计明天下午完成。', ['ETA', 'fix', 'tomorrow afternoon']],
            ['🎧', '听客户', 'Ask for Update', 'Ms. Chen · Bank PM', 'Can you give us an update on the open UAT defects?', 'An update should not be vague. Mention fixed, in progress, and blocked items.', 'The client wants an update on the open UAT defects.', '请复述：客户想了解未关闭 UAT 缺陷的进展。', ['update', 'open', 'UAT defects']],
            ['🧑‍💻', '问同事', 'Blocked Item', 'Mia · QA Teammate', 'One defect is blocked because we are waiting for new test data.', 'Use “blocked because...” to explain why work cannot move forward.', 'One defect is blocked because we are waiting for new test data.', '请复述：一个缺陷被阻塞，因为在等新的测试数据。', ['blocked', 'waiting for', 'test data']],
            ['🏦', '回银行', 'Structured Update', 'Mr. Wong · Bank IT', 'How many defects are still open?', 'A clear status update uses numbers whenever possible.', 'Two defects are fixed, one is in progress, and one is blocked by test data.', '请回复：两个已修复，一个处理中，一个因测试数据阻塞。', ['two fixed', 'in progress', 'blocked']],
            ['📣', '做汇报', 'Manager Update', 'Alex · Delivery Lead', 'What should I tell the steering group?', 'For leadership, summarize status and risk in one clean sentence.', 'Most UAT defects are under control, but one item depends on new test data from the bank.', '请汇报：大多数 UAT 缺陷可控，但有一项依赖银行新测试数据。', ['under control', 'depends on', 'test data']]
        ])
    },
    {
        week: 2,
        day: 10,
        title: 'Week 2 Review',
        subtitle: 'UAT 问题处理综合练习',
        theme: 'UAT review',
        levels: makeDay(2, 10, 'Week 2 Review', [
            ['🧭', '复习', 'UAT Phrase Stack', 'Coach · Pixel Tutor', 'Today you will combine issue, impact, workaround, and ETA language.', 'Review day: aim for concise updates with one reason and one next step.', 'We are checking the issue impact and will share the ETA after triage.', '请表达：我们在确认问题影响，分诊后会分享 ETA。', ['issue impact', 'ETA', 'triage']],
            ['🎧', '听客户', 'Client Pressure', 'Ms. Chen · Bank PM', 'We need to know whether this defect will delay UAT sign-off.', '“Sign-off” means formal approval. It is often tied to project milestones.', 'The bank wants to know whether the defect will delay UAT sign-off.', '请复述：银行想知道缺陷是否会影响 UAT 签字确认。', ['defect', 'delay', 'UAT sign-off']],
            ['🧑‍💻', '问技术', 'Fix Confidence', 'Ravi · Backend Engineer', 'The fix is ready, but QA still needs to verify it with new data.', 'A fix is not fully done until it is verified. Make that distinction clear.', 'The fix is ready, but QA still needs to verify it with new data.', '请复述：修复已准备好，但 QA 还需用新数据验证。', ['fix is ready', 'QA', 'verify']],
            ['🏦', '回银行', 'Balanced Reply', 'Mr. Wong · Bank IT', 'Can you commit to resolving this today?', 'If you cannot commit, explain the dependency and give the next update time.', 'We cannot fully commit yet because QA still needs to verify the fix with new data.', '请回复：暂不能完全承诺，因为 QA 仍需用新数据验证修复。', ['cannot commit', 'verify', 'new data']],
            ['📣', '周复盘', 'UAT Weekly Summary', 'Alex · Delivery Lead', 'Give me your UAT summary for the week.', 'A review summary should show progress, remaining risk, and the next checkpoint.', 'This week we triaged the UAT defects, provided workarounds, and kept one verification risk open.', '请汇报：本周分诊 UAT 缺陷、提供临时方案，并保留一个验证风险。', ['triaged', 'workarounds', 'verification risk']]
        ])
    },
    {
        week: 3,
        day: 11,
        title: 'Data Reconciliation',
        subtitle: '数据差异、口径、对账',
        theme: 'Data mismatch',
        levels: makeDay(3, 11, 'Data Reconciliation', [
            ['🧭', '看小课', 'Explain Mismatch', 'Coach · Pixel Tutor', 'The difference may be caused by timing or field mapping.', 'When explaining data mismatch, avoid blame and list possible causes.', 'The difference may be caused by timing or field mapping.', '请跟读：差异可能由时间点或字段映射导致。', ['difference', 'timing', 'field mapping']],
            ['🎧', '听客户', 'Data Challenge', 'Ms. Chen · Bank PM', 'The report total does not match the transaction extract.', '“Does not match” is the basic phrase for data mismatch.', 'The report total does not match the transaction extract.', '请复述：报表总数和交易导出不一致。', ['report total', 'does not match', 'transaction extract']],
            ['🧑‍💻', '问技术', 'Mapping Check', 'Ravi · Backend Engineer', 'The report excludes reversed transactions, but the extract includes them.', 'Data differences often come from inclusion or exclusion rules.', 'The report excludes reversed transactions, but the extract includes them.', '请复述：报表排除了冲正交易，但导出包含它们。', ['excludes', 'reversed transactions', 'includes']],
            ['🏦', '回银行', 'Explain Rule', 'Mr. Wong · Bank IT', 'Why is the report number lower than the extract?', 'Use a calm explanation: rule, effect, and what you will verify.', 'The report excludes reversed transactions, so the total is lower than the extract.', '请回复：报表排除冲正交易，所以总数低于导出。', ['excludes', 'total is lower', 'extract']],
            ['📣', '做汇报', 'Reconciliation Plan', 'Alex · Delivery Lead', 'How will we reconcile the numbers?', 'A reconciliation plan should mention rule comparison and sample checking.', 'We will compare the rules and reconcile a sample set of transactions.', '请汇报：我们会比较规则，并对一组交易样本进行对账。', ['compare rules', 'reconcile', 'sample set']]
        ])
    },
    {
        week: 3,
        day: 12,
        title: 'API Integration',
        subtitle: '接口、凭证、报文格式',
        theme: 'Integration testing',
        levels: makeDay(3, 12, 'API Integration', [
            ['🧭', '看小课', 'API Basics', 'Coach · Pixel Tutor', 'Could you confirm the endpoint and payload format?', 'For API discussions, endpoint, payload, credentials, and timeout are core words.', 'Could you confirm the endpoint and payload format?', '请跟读：能确认接口地址和报文格式吗？', ['endpoint', 'payload format', 'confirm']],
            ['🎧', '听客户', 'Credential Issue', 'Mr. Wong · Bank IT', 'We are still waiting for the production credentials.', 'Credentials are access details. Without them, integration testing may be blocked.', 'The bank is still waiting for the production credentials.', '请复述：银行仍在等待生产凭证。', ['waiting for', 'production credentials', 'bank']],
            ['🧑‍💻', '问技术', 'Timeout Problem', 'Ravi · Backend Engineer', 'The request timed out after thirty seconds.', 'Use “timed out” when a system stops waiting for a response.', 'The request timed out after thirty seconds.', '请复述：请求在 30 秒后超时。', ['request', 'timed out', 'thirty seconds']],
            ['🏦', '回银行', 'Ask for Payload', 'Mr. Wong · Bank IT', 'What do you need from our side?', 'Be specific when asking for technical material.', 'Could you share the sample payload and the error response from your side?', '请回复：能分享样例报文和你们侧的错误响应吗？', ['sample payload', 'error response', 'your side']],
            ['📣', '做汇报', 'Integration Risk', 'Alex · Delivery Lead', 'What is the main integration blocker?', 'For blockers, state dependency and owner clearly.', 'The main blocker is the production credentials, which are still pending on the bank side.', '请汇报：主要阻塞是生产凭证，仍待银行侧提供。', ['main blocker', 'production credentials', 'bank side']]
        ])
    },
    {
        week: 3,
        day: 13,
        title: 'Security and Compliance',
        subtitle: '权限、审计、合规说明',
        theme: 'Controls and approvals',
        levels: makeDay(3, 13, 'Security and Compliance', [
            ['🧭', '看小课', 'Access Control', 'Coach · Pixel Tutor', 'This role requires additional approval because it can export sensitive data.', 'Compliance English should be precise. Say what action needs approval and why.', 'This role requires additional approval because it can export sensitive data.', '请跟读：该角色需要额外审批，因为可以导出敏感数据。', ['additional approval', 'export', 'sensitive data']],
            ['🎧', '听客户', 'Audit Request', 'Ms. Patel · Bank Compliance', 'We need an audit trail for every permission change.', 'An audit trail is a record of who did what and when.', 'The bank needs an audit trail for every permission change.', '请复述：银行需要每次权限变更的审计记录。', ['audit trail', 'permission change', 'every']],
            ['🧑‍💻', '问技术', 'Log Coverage', 'Ravi · Backend Engineer', 'The system logs role changes, but not failed approval attempts.', 'For compliance gaps, capture what is covered and what is missing.', 'The system logs role changes, but not failed approval attempts.', '请复述：系统记录角色变更，但不记录失败的审批尝试。', ['logs', 'role changes', 'failed attempts']],
            ['🏦', '回银行', 'Set Expectation', 'Ms. Patel · Bank Compliance', 'Can you add the missing audit log before go-live?', 'When a compliance request affects go-live, avoid immediate promises.', 'We will assess the effort and confirm whether it can be included before go-live.', '请回复：我们会评估工作量，并确认能否在上线前纳入。', ['assess effort', 'included', 'go-live']],
            ['📣', '做汇报', 'Compliance Risk', 'Alex · Delivery Lead', 'What is the compliance risk?', 'A compliance risk update should mention control gap and go-live impact.', 'The compliance risk is the missing audit log for failed approval attempts.', '请汇报：合规风险是缺少失败审批尝试的审计日志。', ['compliance risk', 'missing audit log', 'failed approval']]
        ])
    },
    {
        week: 3,
        day: 14,
        title: 'Change Requests',
        subtitle: '变更评估、影响、报价前置',
        theme: 'CR communication',
        levels: makeDay(3, 14, 'Change Requests', [
            ['🧭', '看小课', 'Change Request', 'Coach · Pixel Tutor', 'This may need to be handled as a change request.', 'A change request is a formal way to manage new scope after agreement.', 'This may need to be handled as a change request.', '请跟读：这可能需要作为变更请求处理。', ['change request', 'handled', 'may need']],
            ['🎧', '听客户', 'Extra Requirement', 'Ms. Chen · Bank PM', 'Can we add an approval dashboard to the current release?', 'A new feature in the current release can affect timeline and cost.', 'The bank wants to add an approval dashboard to the current release.', '请复述：银行希望在当前发布中加入审批看板。', ['approval dashboard', 'current release', 'add']],
            ['🧑‍💻', '问产品', 'Impact Check', 'Nina · Product Owner', 'The dashboard would require new UI work and additional API fields.', 'Impact language should be concrete: UI, API, data, testing, timeline.', 'The dashboard would require new UI work and additional API fields.', '请复述：看板需要新的 UI 工作和额外 API 字段。', ['UI work', 'API fields', 'require']],
            ['🏦', '回银行', 'CR Response', 'Mr. Wong · Bank IT', 'Can you include it without changing the timeline?', 'Do not accept hidden scope. Offer assessment first.', 'We need to assess the impact before confirming whether the timeline can stay the same.', '请回复：需要先评估影响，再确认时间线是否不变。', ['assess impact', 'confirming', 'timeline']],
            ['📣', '做汇报', 'CR Summary', 'Alex · Delivery Lead', 'What is your recommendation?', 'A recommendation should be direct and supported by one reason.', 'I recommend treating the dashboard as a change request because it adds UI and API work.', '请汇报：建议作为变更请求，因为增加 UI 和 API 工作。', ['recommend', 'change request', 'UI and API']]
        ])
    },
    {
        week: 3,
        day: 15,
        title: 'Week 3 Review',
        subtitle: '数据、接口、合规、变更复盘',
        theme: 'Technical communication review',
        levels: makeDay(3, 15, 'Week 3 Review', [
            ['🧭', '复习', 'Technical Summary', 'Coach · Pixel Tutor', 'Today you will explain data, API, compliance, and change-request topics.', 'Technical English is best when it is structured: cause, impact, next action.', 'The issue may be caused by field mapping, and we will verify the impact today.', '请表达：问题可能由字段映射导致，我们今天会验证影响。', ['field mapping', 'verify', 'impact']],
            ['🎧', '听客户', 'Complex Concern', 'Ms. Patel · Bank Compliance', 'We cannot approve go-live until the audit trail gap is resolved.', '“Cannot approve until...” is a strong dependency. Capture it exactly.', 'The bank cannot approve go-live until the audit trail gap is resolved.', '请复述：审计记录缺口解决前，银行不能批准上线。', ['approve go-live', 'audit trail gap', 'resolved']],
            ['🧑‍💻', '问技术', 'Cross-team Check', 'Ravi · Backend Engineer', 'We can add the log, but it needs regression testing.', 'When a fix touches controls, testing impact matters.', 'We can add the log, but it needs regression testing.', '请复述：可以加日志，但需要回归测试。', ['add the log', 'regression testing', 'needs']],
            ['🏦', '回银行', 'Careful Commitment', 'Ms. Chen · Bank PM', 'Can you resolve the gap this week?', 'Careful commitments include condition and checkpoint.', 'We are targeting this week, subject to regression testing results.', '请回复：目标是本周完成，但取决于回归测试结果。', ['targeting this week', 'subject to', 'regression testing']],
            ['📣', '周复盘', 'Tech Weekly Summary', 'Alex · Delivery Lead', 'Give me the technical risk summary.', 'A technical risk summary should be short, specific, and decision-oriented.', 'The key risk is the audit log gap, and the decision depends on regression testing results.', '请汇报：关键风险是审计日志缺口，决策取决于回归测试结果。', ['key risk', 'audit log gap', 'decision']]
        ])
    },
    {
        week: 4,
        day: 16,
        title: 'Go-live Planning',
        subtitle: '上线条件、冻结范围、检查点',
        theme: 'Go-live readiness',
        levels: makeDay(4, 16, 'Go-live Planning', [
            ['🧭', '看小课', 'Readiness Check', 'Coach · Pixel Tutor', 'Go-live readiness depends on UAT sign-off and open defect status.', 'Use “depends on” to explain launch conditions clearly.', 'Go-live readiness depends on UAT sign-off and open defect status.', '请跟读：上线准备取决于 UAT 签字和未关闭缺陷状态。', ['go-live readiness', 'depends on', 'UAT sign-off']],
            ['🎧', '听客户', 'Go-live Date', 'Ms. Chen · Bank PM', 'The business team wants to go live next Friday.', 'A desired date is not the same as a committed date. Keep the distinction clear.', 'The business team wants to go live next Friday.', '请复述：业务团队希望下周五上线。', ['business team', 'go live', 'next Friday']],
            ['🧑‍💻', '问团队', 'Open Items', 'Mia · QA Teammate', 'We still have two medium defects waiting for retest.', 'Use defect count and status to make readiness concrete.', 'We still have two medium defects waiting for retest.', '请复述：还有两个中等缺陷等待重新测试。', ['two medium defects', 'waiting', 'retest']],
            ['🏦', '回银行', 'Set Condition', 'Mr. Wong · Bank IT', 'Can we confirm next Friday as the go-live date?', 'For go-live, confirm conditions before confirming the date.', 'We can confirm the date after UAT sign-off and retesting are completed.', '请回复：UAT 签字和重新测试完成后，我们可以确认日期。', ['confirm the date', 'UAT sign-off', 'retesting']],
            ['📣', '做汇报', 'Readiness Update', 'Alex · Delivery Lead', 'Are we ready for go-live?', 'A go-live update should be honest: ready, not ready, or conditionally ready.', 'We are conditionally ready, pending UAT sign-off and retesting of two defects.', '请汇报：我们有条件准备好，待 UAT 签字和两个缺陷重测。', ['conditionally ready', 'pending', 'two defects']]
        ])
    },
    {
        week: 4,
        day: 17,
        title: 'Cutover and Rollback',
        subtitle: '切换计划、回退方案、值班安排',
        theme: 'Release execution',
        levels: makeDay(4, 17, 'Cutover and Rollback', [
            ['🧭', '看小课', 'Cutover Plan', 'Coach · Pixel Tutor', 'The cutover plan describes how we move from the old system to the new one.', 'Cutover language should include timing, owner, and rollback.', 'The cutover plan describes how we move from the old system to the new one.', '请跟读：切换计划说明如何从旧系统切到新系统。', ['cutover plan', 'old system', 'new one']],
            ['🎧', '听客户', 'Rollback Concern', 'Mr. Wong · Bank IT', 'We need a rollback plan in case the production validation fails.', 'A rollback plan is the safe path back if go-live does not work.', 'The bank needs a rollback plan in case production validation fails.', '请复述：银行需要回退方案，以防生产验证失败。', ['rollback plan', 'production validation', 'fails']],
            ['🧑‍💻', '问技术', 'Support Window', 'Ravi · Backend Engineer', 'We can support the cutover from 9 PM to midnight.', 'For release support, confirm the support window and escalation path.', 'The team can support the cutover from 9 PM to midnight.', '请复述：团队可以在晚上 9 点到午夜支持切换。', ['support', 'cutover', 'midnight']],
            ['🏦', '回银行', 'Confirm Plan', 'Ms. Chen · Bank PM', 'Can you share the final cutover checklist?', 'Use “final checklist” when the client needs a concrete release artifact.', 'We will share the final cutover checklist after the internal review.', '请回复：内部评审后，我们会分享最终切换检查表。', ['final checklist', 'internal review', 'share']],
            ['📣', '做汇报', 'Release Plan', 'Alex · Delivery Lead', 'What do we still need for release execution?', 'Release updates should include checklist, support window, and rollback plan.', 'We still need the final checklist, confirmed support window, and rollback approval.', '请汇报：还需要最终检查表、确认支持窗口和回退审批。', ['final checklist', 'support window', 'rollback approval']]
        ])
    },
    {
        week: 4,
        day: 18,
        title: 'Stakeholder Updates',
        subtitle: '委员会、管理层、状态汇报',
        theme: 'Senior communication',
        levels: makeDay(4, 18, 'Stakeholder Updates', [
            ['🧭', '看小课', 'Executive Summary', 'Coach · Pixel Tutor', 'For senior stakeholders, start with status, risk, and decision needed.', 'Senior updates should be brief and decision-focused.', 'For senior stakeholders, start with status, risk, and decision needed.', '请跟读：给管理层汇报时，先说状态、风险和需要的决策。', ['status', 'risk', 'decision']],
            ['🎧', '听领导', 'Steering Question', 'Alex · Delivery Lead', 'The steering group will ask whether the go-live risk is acceptable.', '“Acceptable risk” means the risk can be managed or approved.', 'The steering group will ask whether the go-live risk is acceptable.', '请复述：委员会会问上线风险是否可接受。', ['steering group', 'go-live risk', 'acceptable']],
            ['🧑‍💻', '问团队', 'Risk Mitigation', 'Mia · QA Teammate', 'We can reduce the risk by running an extra validation cycle.', 'Use “reduce the risk by...” to explain mitigation actions.', 'We can reduce the risk by running an extra validation cycle.', '请复述：可以通过额外验证来降低风险。', ['reduce the risk', 'extra validation', 'cycle']],
            ['🏦', '回银行', 'Management Update', 'Ms. Chen · Bank PM', 'Can you provide a short update for our steering committee?', 'For committee updates, avoid technical details unless asked.', 'The project is on track, with one manageable risk around final validation.', '请回复：项目按计划推进，最终验证有一个可管理风险。', ['on track', 'manageable risk', 'final validation']],
            ['📣', '做汇报', 'Decision Ask', 'Alex · Delivery Lead', 'What decision do we need from the bank?', 'A decision ask should be specific and easy to answer.', 'We need the bank to confirm whether they accept the final validation risk.', '请汇报：需要银行确认是否接受最终验证风险。', ['confirm', 'accept', 'validation risk']]
        ])
    },
    {
        week: 4,
        day: 19,
        title: 'Post Go-live Support',
        subtitle: '监控、工单、稳定期支持',
        theme: 'Hypercare',
        levels: makeDay(4, 19, 'Post Go-live Support', [
            ['🧭', '看小课', 'Hypercare', 'Coach · Pixel Tutor', 'Hypercare is the focused support period right after go-live.', 'Use hypercare for the short period after launch when support is more intensive.', 'Hypercare is the focused support period right after go-live.', '请跟读：Hypercare 是上线后的重点支持期。', ['hypercare', 'support period', 'go-live']],
            ['🎧', '听客户', 'Monitoring Request', 'Mr. Wong · Bank IT', 'We need hourly monitoring during the first business day.', 'Monitoring frequency matters. Listen for hourly, daily, or real-time.', 'The bank needs hourly monitoring during the first business day.', '请复述：银行需要首个工作日每小时监控。', ['hourly monitoring', 'first business day', 'bank']],
            ['🧑‍💻', '问团队', 'Incident Process', 'Ravi · Backend Engineer', 'If there is a production incident, we should open a high-priority ticket.', 'Use “production incident” for live-system issues, not test issues.', 'If there is a production incident, we should open a high-priority ticket.', '请复述：如有生产事故，应开高优先级工单。', ['production incident', 'high-priority ticket', 'open']],
            ['🏦', '回银行', 'Support Commitment', 'Ms. Chen · Bank PM', 'Who should we contact during hypercare?', 'A support answer should include channel, owner, and response expectation.', 'During hypercare, please contact our support channel, and we will respond within one hour.', '请回复：Hypercare 期间请联系支持渠道，我们会一小时内响应。', ['support channel', 'respond', 'one hour']],
            ['📣', '做汇报', 'Hypercare Plan', 'Alex · Delivery Lead', 'What is our hypercare plan?', 'Hypercare plans should mention monitoring, tickets, and escalation.', 'We will monitor hourly, track production tickets, and escalate high-priority incidents immediately.', '请汇报：我们会每小时监控、跟踪生产工单，并立即升级高优先级事故。', ['monitor hourly', 'production tickets', 'escalate']]
        ])
    },
    {
        week: 4,
        day: 20,
        title: 'Month 1 Final Review',
        subtitle: '完整项目交付口语综合挑战',
        theme: 'Monthly capstone',
        levels: makeDay(4, 20, 'Month 1 Final Review', [
            ['🧭', '复习', 'Full-cycle Review', 'Coach · Pixel Tutor', 'Today you will speak through a full delivery cycle from requirement to hypercare.', 'Monthly review should feel like a real project story, not separate sentences.', 'We clarified the requirement, completed UAT, prepared go-live, and started hypercare.', '请表达：我们澄清需求、完成 UAT、准备上线并开始 Hypercare。', ['clarified requirement', 'completed UAT', 'started hypercare']],
            ['🎧', '听客户', 'Client Summary Request', 'Ms. Chen · Bank PM', 'Can you summarize the current status, key risk, and next step?', 'This is the core business update pattern: status, risk, next step.', 'The client wants the current status, key risk, and next step.', '请复述：客户想了解当前状态、关键风险和下一步。', ['current status', 'key risk', 'next step']],
            ['🧑‍💻', '问团队', 'Final Check', 'Mia · QA Teammate', 'All critical defects are closed, and the remaining items are cosmetic.', '“Cosmetic” means visible but not functionally serious.', 'All critical defects are closed, and the remaining items are cosmetic.', '请复述：所有关键缺陷已关闭，剩余项为界面类小问题。', ['critical defects', 'closed', 'cosmetic']],
            ['🏦', '回银行', 'Client-facing Update', 'Mr. Wong · Bank IT', 'Are you comfortable moving forward?', 'A client-facing final update should be confident but not careless.', 'Yes. All critical defects are closed, and we are ready to move forward with monitored support.', '请回复：是的，关键缺陷已关闭，我们准备在监控支持下继续推进。', ['critical defects', 'ready', 'monitored support']],
            ['📣', '月复盘', 'Manager Capstone', 'Alex · Delivery Lead', 'Give me your final monthly delivery summary.', 'Your final monthly summary should sound like a professional project update.', 'This month we improved client communication, handled UAT issues, managed technical risks, and prepared for go-live support.', '请月度汇报：本月提升客户沟通、处理 UAT 问题、管理技术风险，并准备上线支持。', ['client communication', 'technical risks', 'go-live support']]
        ])
    }
];

function makeDay(week, day, theme, rows) {
    return rows.map((row, index) => ({
        level: `Level ${index + 1} of 5`,
        title: row[2],
        npc: row[3],
        npcLine: row[4],
        lesson: row[5],
        mode: row[2],
        target: row[6],
        hint: row[7],
        keywords: row[8],
        xp: 12 + index * 2,
        routeEmoji: row[0],
        routeLabel: row[1],
        week,
        day,
        theme
    }));
}
