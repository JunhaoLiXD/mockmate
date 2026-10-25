# Company Interview Styles (v2)

> Owner: Jerry. Generic company types; prototype companies are listed only in each Sources table and in docs/research/company-types-research.md.
> A style changes focus areas, follow-up strategy, and evaluation emphasis, not the interviewer's personality or voice.
> Product disclaimer (show on the page): `Practice styles based on public information about each industry; not affiliated with or endorsed by any company.`
> All questions are original practice questions written for MockMate.

---

## 1. Tech Company

### 1.1 Sources

| Source | URL | Accessed |
|---|---|---|
| Google: Engineer interview preparation advice (official; general advice, not a student process) | https://blog.google/company-news/inside-google/life-at-google/google-engineer-shares-her-technical-interview-tips/ | 2026-10-24 |
| Google: Technical Virtual Interviews Candidate Guide (official; format guidance) | https://services.google.com/fh/files/misc/technical_virtual_interviews_candidate_resource.pdf | 2026-10-24 |
| Microsoft: Early in profession hiring tips (official) | https://careers.microsoft.com/v2/global/en/hiring-tips/student-interviewing | 2026-10-24 |
| Microsoft: Technical interviewing (official; role-dependent topics) | https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing | 2026-10-24 |
| Amazon: Student and graduate software engineering roles (official) | https://www.amazon.jobs/content/en/career-programs/university/sde | 2026-10-24 |
| Amazon: Leadership Principles (official; published values, not numeric weights) | https://www.amazon.jobs/content/en/our-workplace/leadership-principles | 2026-10-24 |

### 1.2 Focus areas

These are practice priorities for large consumer and enterprise technology companies, not a prediction of an employer's exact process. Course, personal, volunteer, and internship projects are equally acceptable contexts. Use spoken explanations rather than requesting live coding.

1. Break a technical problem into explicit assumptions, inputs, and constraints.
2. Explain an implementation choice using the candidate's own project and responsibilities.
3. Check correctness with examples, boundary cases, and tests.
4. Compare alternatives using time, memory, complexity, or maintainability.
5. Show learning, collaboration, and responsibility for an outcome without inventing metrics.

### 1.3 Follow-up strategy

- Ask the number of main questions set by your length option. In a five-minute session, ask at most one short follow-up per question; in a fifteen-minute session, allow one or two follow-ups when time permits. Preserve time for closing.
- In Technical mode, probe a claim with one counterexample: "Which input would be most likely to break that approach?" Ask for the candidate's check before moving on.
- In Technical mode, change one constraint after the explanation: "What would you change if memory became the tighter limit?" Use a constraint relevant to the project and mark the extension as hypothetical.
- In Behavioral mode, replace technical counterexamples with personal-action probes: "Which decision was yours?" or "What changed after you acted?" Ask only one at a time.
- Choose a probe from the answer, not a fixed checklist. Do not assume a technology, large deployment, or measured result that the candidate has not described; invite a small example instead. Never request confidential information.

### 1.4 Evaluation emphasis

- Technical mode: give extra qualitative attention to Accuracy, Depth, and Trade-off Reasoning; retain Implementation Understanding and Clarity.
- Behavioral mode: give extra qualitative attention to Ownership, Actions / Results, and Clarity; retain Relevance and Specificity.

Emphasis guides discussion, not numeric weights. Use only supported evidence; an untested dimension is insufficient evidence. Do not reward memorized wording or require professional experience.

### 1.5 Original practice questions

#### Technical

| ID | Question | Topic | What a strong answer shows |
|---|---|---|---|
| T-TECH-01 | In your project, what constraint most influenced the data structure you chose for one feature? | Data structures | A specific operation, an alternative, and a reason tied to the workload. |
| T-TECH-02 | How would you convince a teammate that one algorithm in your project handles every valid input? | Correctness | Clear assumptions, a logical argument, and checks beyond the usual case. |
| T-TECH-03 | If your project's input grew tenfold, where would you first look for wasted work? | Complexity | A reasoned bottleneck hypothesis and a way to check it before optimizing. |
| T-TECH-04 | Which test in your project would catch a plausible implementation mistake that an ordinary example would miss? | Testing | A concrete failure mode, expected behavior, and an explanation of the test's value. |
| T-TECH-05 | How did you narrow down the cause of a bug when your first explanation turned out to be wrong? | Debugging | Observations, a revised hypothesis, and a check of the eventual fix. |
| T-TECH-06 | What could go wrong if two parts of your project tried to update the same state at once? | Shared state | A concrete interleaving or conflict and an appropriate protection or design change. |
| T-TECH-07 | What evidence would make you replace a library you selected for your project? | Dependencies | A decision grounded in requirements, maintenance costs, and a feasible alternative. |
| T-TECH-08 | If a user said your project was slow but your local tests looked fine, what would you investigate first? | Diagnosis | A measurable hypothesis that distinguishes local conditions from the user's experience. |

#### Behavioral

| ID | Question | Topic | What a strong answer shows |
|---|---|---|---|
| B-TECH-01 | Tell me about a time you revised a technical decision after a teammate challenged your reasoning. | Technical disagreement | The candidate's original reasoning, the new evidence, and their own response. |
| B-TECH-02 | Tell me about a time a project task required knowledge you did not yet have. | Learning | A focused learning plan, independent effort, and an application that can be explained. |
| B-TECH-03 | Tell me about a time you took responsibility for a defect that affected someone else's work. | Ownership | A specific action to resolve the impact and prevent a repeat. |
| B-TECH-04 | Tell me about a time your team had different interpretations of a technical requirement. | Clarification | How the candidate surfaced assumptions and helped reach a testable agreement. |
| B-TECH-05 | Tell me about a time an experiment showed that your planned optimization was not useful. | Evidence and adaptation | Honest interpretation, a changed decision, and learning without invented gains. |
| B-TECH-06 | Tell me about a time you helped a teammate understand a difficult part of a project. | Collaboration | An explanation adapted to the teammate and evidence of what became clearer. |

---

## 2. Business Company

### 2.1 Sources

| Source | URL | Accessed |
|---|---|---|
| Capital One: Student and grad application questions, answered (official) | https://www.capitalonecareers.com/en/student-and-grad-application-questions-answered-students-cdev | 2026-10-24 |
| Capital One: What to expect during your interview (official; general formats) | https://www.capitalonecareers.com/en/what-to-expect-during-your-capital-one-interview-students-101 | 2026-10-24 |
| JPMorganChase: How we hire FAQ (official; role-dependent assessments) | https://www.jpmorganchase.com/careers/how-we-hire/faqs | 2026-10-24 |
| JPMorganChase: Software Engineer Summer Program (official; role expectations) | https://www.jpmorganchase.com/careers/explore-opportunities/programs/software-engineer-summer | 2026-10-24 |
| Walmart: Hiring Process (official; not specific to software student roles) | https://careers.walmart.com/us/en/home/resources/hiring-process | 2026-10-24 |
| Walmart Global Tech: Careers (official; engineering and customer context) | https://tech.walmart.com/content/walmart-global-tech/en_us/careers.html | 2026-10-24 |

### 2.2 Focus areas

These practice priorities combine business-facing software concerns across financial services, retail, and other large organizations. They are a synthesized practice lens, not a claim that every employer tests these topics. A small student project is enough; use a hypothetical workflow when necessary and do not assume industry employment.

1. Turn a user or stakeholder need into behavior that can be checked.
2. Preserve correct data and outcomes when a workflow is repeated, interrupted, or partially completed.
3. Consider access boundaries and protect sensitive information using generalized examples.
4. Compare a technical solution with its operational cost, delivery effort, and effect on users.
5. Explain personal contributions, collaboration, and observable results in plain language.

### 2.3 Follow-up strategy

- Ask the number of main questions set by your length option. In a five-minute session, ask at most one short follow-up per question; in a fifteen-minute session, allow two follow-ups per question, and a third on one story only if time remains.
- In Technical mode, connect the decision to its consequence: "What would the user notice if that step failed?" Establish the workflow before probing a control.
- In Technical mode, test recovery or verification: "How would you check that retrying did not create a second result?" Use this only if the candidate's workflow can produce that risk; otherwise choose a relevant failure case.
- In Behavioral mode, ask "What part did you handle yourself?" or "What observation showed the outcome improved?" Accept qualitative observations when honest measurements do not exist.
- Keep questions sequential and grounded in the answer. Do not demand business jargon, access to production systems, confidential records, or employer details; invite an anonymized example and stop once the evidence is clear.

### 2.4 Evaluation emphasis

- Technical mode: give extra qualitative attention to Accuracy, Implementation Understanding, and Trade-off Reasoning; retain Depth and Clarity.
- Behavioral mode: give extra qualitative attention to Relevance, Ownership, and Actions / Results; retain Specificity and Clarity.

Emphasis guides discussion, not numeric weights. Require concrete support before a judgment; do not equate a large business result with stronger individual evidence. An untested dimension is insufficient evidence.

### 2.5 Original practice questions

#### Technical

| ID | Question | Topic | What a strong answer shows |
|---|---|---|---|
| T-BIZ-01 | Which user need in your project was hardest to turn into a clear acceptance test? | Requirements | A specific ambiguity, a clarified outcome, and a test that reflects the need. |
| T-BIZ-02 | If a user repeated an important action after a timeout in your project, how would you prevent an unintended duplicate result? | Reliable workflows | An explicit failure model and a suitable way to recognize or safely handle a retry. |
| T-BIZ-03 | How would you detect that two records in your project describe the same event differently? | Data integrity | An agreed source of truth, a comparison rule, and a safe response to disagreement. |
| T-BIZ-04 | Which piece of information in your project should be visible to the fewest people? | Access boundaries | A reason tied to user needs, limited access, and a check that the restriction works. |
| T-BIZ-05 | How would you compare a quick manual workaround with an automated feature for a small number of users? | Cost and value | Explicit assumptions about effort, mistakes, maintenance, and when automation becomes useful. |
| T-BIZ-06 | How would you change stored data in your project without breaking an older version that still reads it? | Compatibility | A staged change, compatibility checks, and a recovery option scaled to the project. |
| T-BIZ-07 | What would you watch first after releasing a change to your project's most important user task? | Safe delivery | An observable success criterion, a failure signal, and a practical response. |
| T-BIZ-08 | If a service your project depends on returned inconsistent results, how would you protect the user's next action? | Dependency failure | Detection, a safe fallback, and a clear explanation of uncertainty to the user. |

#### Behavioral

| ID | Question | Topic | What a strong answer shows |
|---|---|---|---|
| B-BIZ-01 | Tell me about a time a user request changed after you had already started implementing it. | Changing requirements | Clarification, a deliberate adjustment, and communication about the effect on delivery. |
| B-BIZ-02 | Tell me about a time you explained a technical risk to someone who did not write code. | Stakeholder communication | Plain language, a concrete consequence, and a shared decision. |
| B-BIZ-03 | Tell me about a time you reduced the scope of a project to deliver its most useful part. | Prioritization | A reasoned choice based on needs and constraints, plus an honest outcome. |
| B-BIZ-04 | Tell me about a time you found an error in data that your team was relying on. | Data responsibility | Personal investigation, correction or escalation, and protection of affected work. |
| B-BIZ-05 | Tell me about a time two people using your project needed different things from the same feature. | Conflicting needs | Listening, a concrete trade-off, and evidence of how the decision served the task. |
| B-BIZ-06 | Tell me about a time you improved a repetitive task for your team or another group. | Practical impact | The original friction, the candidate's own contribution, and a credible sign of improvement. |

---

## 3. Entertainment Company

### 3.1 Sources

| Source | URL | Accessed |
|---|---|---|
| Netflix: Internships (official) | https://jobs.netflix.com/careers/internships | 2026-10-24 |
| Netflix: Culture Memo (official; published values, not an interview formula) | https://jobs.netflix.com/culture | 2026-10-24 |
| The Walt Disney Company: Candidate Resources (official) | https://join.disneycareers.com/global/en/candidate-resources | 2026-10-24 |
| The Walt Disney Company: UK Internship Programme (official; regional guidance) | https://www.disneycareers.com/en/internships-united-kingdom-programme | 2026-10-24 |
| Electronic Arts: Early Careers FAQ (official) | https://www.ea.com/en-au/careers/early-careers/faq | 2026-10-24 |
| Electronic Arts: Interviewing with Electronic Arts (official; general hiring guide) | https://www.ea.com/careers/interviewing-with-ea | 2026-10-24 |
| Electronic Arts Romania: Early Career Opportunities (official; regional guidance) | https://www.ea.com/ea-studios/ea-romania/news/early-career-opportunities-at-electronic-arts-romania | 2026-10-24 |

### 3.2 Focus areas

These practice priorities address software for streaming, games, media, and other interactive experiences. They are design inferences from the domain and public guidance, not a universal interview syllabus. Use the candidate's own project; any proposed entertainment use case is hypothetical. Prior industry experience, specialist tools, and fandom are unnecessary.

1. Connect a technical choice to a responsive, understandable experience for a viewer, player, creator, or other user.
2. Diagnose uneven performance using an observation rather than an impression alone.
3. Make resource and quality trade-offs across devices, connections, or content inputs.
4. Preserve progress and recover gracefully when interaction or loading fails.
5. Work with different disciplines, respond to feedback, and check whether a change helped people use the feature.

### 3.3 Follow-up strategy

- Ask the number of main questions set by your length option. In a five-minute session, ask at most one short follow-up per question; in a fifteen-minute session, allow one or two follow-ups when time permits. Leave time to close.
- In Technical mode, connect a claim to experience: "What would a user see or feel when that happened?" Do not assume the candidate has built a game or media service.
- In Technical mode, choose an observable check: "What would you measure to tell whether that change helped?" If useful, add one hypothetical device or connection constraint in a later turn.
- In Behavioral mode, ask "How did you turn that feedback into a change?" or "What did you personally do to resolve the disagreement?" Ground the probe in the described collaboration.
- Follow the candidate's answer and ask one probe at a time. Accept small project examples, unsuccessful experiments, and honest uncertainty; never request unreleased content, proprietary assets, or confidential audience data.

### 3.4 Evaluation emphasis

- Technical mode: give extra qualitative attention to Implementation Understanding, Trade-off Reasoning, and Clarity; retain Accuracy and Depth.
- Behavioral mode: give extra qualitative attention to Specificity, Actions / Results, and Clarity; retain Relevance and Ownership.

Emphasis guides discussion, not numeric weights. Assess reasoning and demonstrated actions, not taste, favorite entertainment, or presentation polish. An untested dimension is insufficient evidence.

### 3.5 Original practice questions

#### Technical

| ID | Question | Topic | What a strong answer shows |
|---|---|---|---|
| T-ENT-01 | In your project, how would you separate a slow response from an interface that only feels slow? | Responsiveness | A user-visible criterion and measurements that distinguish causes. |
| T-ENT-02 | If your project had to work on a device with half the memory, what would you simplify first? | Resource trade-offs | A prioritized constraint, a plausible change, and a way to assess lost quality. |
| T-ENT-03 | How would you reproduce an intermittent pause that appears only during a particular interaction in your project? | Performance diagnosis | A reproducible scenario, relevant observations, and isolation of possible causes. |
| T-ENT-04 | If content in your project arrived late or in the wrong order, how would you keep the experience understandable? | Asynchronous interaction | Explicit state handling, sensible feedback, and checks for stale results. |
| T-ENT-05 | How would you decide whether preloading more content in your project is worth the extra resource use? | Loading and resources | A measurable experience benefit balanced against memory, bandwidth, or unnecessary work. |
| T-ENT-06 | How would you check that a change in your project remains usable without precise pointer movements? | Accessible interaction | A concrete input alternative, a realistic task, and verification beyond appearance. |
| T-ENT-07 | How would you test whether a visually richer version of your project's interface actually helps users finish a task? | Experience validation | A defined task, a useful comparison, and recognition of misleading measurements. |
| T-ENT-08 | How would you preserve a user's progress if your project stopped halfway through an interaction? | Recovery | A meaningful state boundary, safe restoration, and honest communication about lost work. |

#### Behavioral

| ID | Question | Topic | What a strong answer shows |
|---|---|---|---|
| B-ENT-01 | Tell me about a time feedback showed that a feature you liked was confusing to use. | Responding to feedback | An open response, a specific change, and a check of the result. |
| B-ENT-02 | Tell me about a time you worked with someone who judged a project's quality differently from you. | Cross-functional collaboration | Listening, shared criteria, and the candidate's concrete contribution to agreement. |
| B-ENT-03 | Tell me about a time you removed a polished detail because it made the overall experience worse. | Quality trade-offs | A clear experience cost, a reasoned compromise, and an observed outcome. |
| B-ENT-04 | Tell me about a time you tried an unfamiliar idea and the first version failed. | Experimentation | A testable intention, an honest failure, and a useful next step. |
| B-ENT-05 | Tell me about a time someone used your project in a way you had not anticipated. | Understanding users | Specific observation, revised assumptions, and an appropriate response. |
| B-ENT-06 | Tell me about a time you gave difficult feedback about a teammate's contribution to a shared experience. | Constructive feedback | Respectful specificity, attention to the shared goal, and what happened afterward. |

---

## 4. How the types differ (summary)

| | Tech Company | Business Company | Entertainment Company |
|---|---|---|---|
| Main focus | Explain and verify a technical decision under explicit constraints | Deliver a dependable workflow with a clear user or business outcome | Connect engineering choices to a responsive and usable experience |
| Follow-ups per question | Five minutes: at most 1; fifteen minutes: 1-2 when useful | Five minutes: at most 1; fifteen minutes: 2, with an optional third on one story if time remains | Five minutes: at most 1; fifteen minutes: 1-2 when useful |
| Signature follow-up | "Which input would be most likely to break that approach?" | "What would the user notice if that step failed?" | "What would you measure to tell whether that change helped?" |
| Report emphasis | Technical: Accuracy, Depth, Trade-off Reasoning. Behavioral: Ownership, Actions / Results, Clarity. | Technical: Accuracy, Implementation Understanding, Trade-off Reasoning. Behavioral: Relevance, Ownership, Actions / Results. | Technical: Implementation Understanding, Trade-off Reasoning, Clarity. Behavioral: Specificity, Actions / Results, Clarity. |
