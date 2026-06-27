# DriveCoach — Product & Technical Spec

> **A driving-practice simulator where your iPhone is the steering wheel and the
> game is your driving coach.** Re-learn how to drive on streets and highways,
> obey real signs and rules, and stop fearing the ticket — in a safe, virtual
> car.

---

## 0. About this document

This is a planning spec for a **new project**. It currently lives on the branch
`claude/driving-sim-spec-opgc0d` inside the `drivewise` repository, but the
existing `drivewise` codebase is an unrelated Next.js car-shopping app. The
intent is to **lift this spec into its own fresh repository** (working name:
`drivecoach`). Nothing in this spec depends on the current repo's code.

**Status:** Draft v1 — for review.
**Author:** generated for Susannah, 2026-06-27.

---

## 1. The one-line pitch

You hold your iPhone like a wheel, tilt to steer, and drive through realistic
city and highway scenarios. The app watches what you do. The first few times you
meet a new sign or rule, it coaches you — friendly, proactive, "slow down,
school zone ahead." After you've seen it enough times, the training wheels come
off: no more hints, and a mistake costs you points or a ticket, just like real
life.

## 2. Why build it

- **Real problem:** A licensed driver who hasn't driven in years is nervous about
  getting back on the road and afraid of tickets. Classroom theory is dry; real
  practice is high-stakes. A simulator removes the danger while keeping the
  rules honest.
- **The differentiator:** Most driving games optimize for fun/arcade. This one
  optimizes for **fidelity to real rules and a coaching arc that fades on
  purpose** — the app deliberately stops helping so you learn to self-rely
  before you're on a real road.

## 3. Goals and non-goals

### Goals
1. Practice realistic driving on **surface streets and highways**.
2. Teach and enforce **real traffic rules, signs, and signals**.
3. Use the **iPhone as a physical steering wheel** (tilt = steering) plus
   on-screen pedals/controls.
4. Implement an **adaptive coach** that proactively guides on first encounters,
   then goes silent and starts enforcing.
5. Make the experience **as close to real driving as practical** — physics,
   traffic, signage, consequences.
6. Track a **driving record** (points/tickets) so the stakes feel real.

### Non-goals (at least for v1)
- Not a multiplayer or open-world racing game.
- Not a legally authoritative driver's-ed certification. (Disclaimer required.)
- Not photoreal AAA graphics. Clean, readable, "good enough to be believable."
- Not VR. (Possible later.)
- Not Android at launch (iPhone-first; the wheel metaphor is iPhone-centric).

## 4. Target user & personas

- **Primary — "Returning Driver" (you):** Licensed, rusty, anxious about rules
  and tickets. Wants low-pressure reps and honest feedback.
- **Secondary — "New Learner":** Has a permit, wants to rehearse scenarios before
  the real road test.
- **Tertiary — "Rule Refresher":** Moved to a new state/country, wants to learn
  local signage and conventions.

## 5. Core gameplay loop

```
        ┌─────────────────────────────────────────────┐
        │ Pick a scenario (Street / Highway / Mixed)   │
        └───────────────┬─────────────────────────────┘
                        ▼
        ┌─────────────────────────────────────────────┐
        │ Drive: tilt to steer, pedals to go/stop      │
        │ The world presents signs, signals, traffic   │
        └───────────────┬─────────────────────────────┘
                        ▼
        ┌─────────────────────────────────────────────┐
        │ Coach evaluates each rule event:             │
        │  • encounters 1–3 → proactive guidance       │
        │  • encounters 4+   → silent; violations cost  │
        └───────────────┬─────────────────────────────┘
                        ▼
        ┌─────────────────────────────────────────────┐
        │ End-of-drive report: score, tickets, points, │
        │ rules mastered, what to practice next        │
        └───────────────┬─────────────────────────────┘
                        ▼
            Progress saved → next drive raises difficulty
```

A single "drive" is a bounded route (e.g. 3–8 minutes) with a defined set of rule
events seeded along it.

## 6. The adaptive coaching system (the heart of the app)

This is the most important and most novel subsystem. Everything else is in
service of it.

### 6.1 Concept: fading scaffolding

Each rule/sign is a **tracked skill** with its own per-player encounter counter.
Coaching intensity decays with exposure:

| Encounter # | Coach behavior |
|-------------|----------------|
| 1st | **Pre-warning + guidance.** Highlight the sign, explain it, tell the player exactly what to do, with extra lead time. Mistakes are forgiven (gentle correction, no penalty). |
| 2nd | **Pre-warning + lighter guidance.** Reminder of the rule. Mistakes get a soft penalty (warning, no points lost) and a re-explanation. |
| 3rd | **Minimal nudge.** Just a brief cue ("stop sign ahead"). Mistakes get a final warning, still no points lost, but flagged as "you're about to be on your own." |
| 4th and beyond | **Silent enforcement.** No hints. A violation issues a **ticket**, deducts **license points**, and adds a **fine**. Logged to the driving record. |

> The "3 free passes" number is a **per-rule, configurable constant**
> (`COACH_FREE_ENCOUNTERS = 3`), not a global one. Mastering stop signs does not
> reduce coaching for highway merges.

### 6.2 What counts as an "encounter"

An encounter is **reaching a decision point governed by a rule**, whether or not
the player acts correctly. Examples:
- Approaching within braking distance of a **stop sign**.
- Entering a **speed-limit zone**.
- A **traffic light** entering the player's approach.
- A **pedestrian** stepping toward a crosswalk in the player's path.
- A **merge taper** beginning on a highway on-ramp.

Encounters are **only counted once the player is committed to it** (inside the
trigger zone) to avoid inflating the counter from signs glimpsed far away.

### 6.3 Coaching delivery channels

- **Visual:** highlight ring/arrow on the relevant sign or hazard; a coach banner
  at the top; an optional ghosted "ideal action" indicator (e.g., brake gauge).
- **Audio:** calm spoken coach voice (TTS or recorded). Short, imperative,
  timely. ("Ease off the gas — speed limit drops to 25 ahead.")
- **Haptics:** gentle pulse on warning, sharper pulse on a logged violation.

All three are toggleable in settings (accessibility + preference).

### 6.4 Mastery, decay, and re-teaching

- A rule becomes **"Mastered"** after N (default 3) *clean* encounters in
  enforcement mode.
- **Skill decay (optional, v1.1):** if a mastered rule is violated later, or not
  seen for a long time, its counter partially resets so the coach helps again.
  This mirrors real rustiness and keeps the app useful on return visits.
- The player can **manually reset coaching** for any rule ("teach me this
  again") from the rules library.

### 6.5 Per-rule state machine

```
        first time ─────► COACHED_FULL (enc 1)
                             │ clean or not
                             ▼
                          COACHED_LIGHT (enc 2)
                             │
                             ▼
                          COACHED_NUDGE (enc 3)
                             │
                             ▼
                          ENFORCED (enc 4+)
                          /        \
              clean ×N   /          \  violation
                        ▼            ▼
                   MASTERED      record ticket,
                        │        (optional decay →
                        └──────►  back toward COACHED)
```

## 7. Rules, signs & violations catalog

Organized by area. v1 ships the **MVP set (★)**; the rest are roadmap. Each rule
is data-driven (see §11) so adding rules doesn't require code changes to the
coach.

### Surface street
- ★ **Stop sign** — full stop, correct order at 4-way, then proceed.
- ★ **Speed limit** — stay at/under posted limit (tolerance band configurable).
- ★ **Traffic light** — red/yellow/green; no running red; no entering on stale
  yellow you can't clear.
- ★ **Right turn on red** — stop first, yield, then turn (jurisdiction-dependent).
- ★ **Yield sign** — give way to cross/oncoming traffic.
- ★ **Pedestrian crosswalk** — yield to pedestrians.
- ★ **Lane keeping** — stay in lane; no drifting/crossing solid lines.
- ★ **Turn signals** — signal before turns and lane changes.
- **School zone** — reduced speed when active, watch for children.
- **One-way streets** — correct direction only.
- **No U-turn / no turn** signs.
- **Railroad crossing** — stop/look behavior.
- **Roundabout** — yield on entry, correct exit signaling.

### Highway / freeway
- ★ **On-ramp merge** — match speed, signal, merge into a gap.
- ★ **Following distance** — maintain safe gap (e.g., ~2-second rule).
- ★ **Lane discipline** — keep right except to pass; signal lane changes.
- **Off-ramp exit** — signal, decelerate in the deceleration lane, not before.
- **Minimum/maximum speed** on freeway.
- **Merging zippers / lane closures** (cones, "lane ends" sign).

### General / safety
- ★ **Seatbelt** — must be on before drive starts.
- **Headlights** at night / low visibility.
- **No phone / distracted driving** (meta-rule; could gate on focus events).
- **Emergency vehicles** — pull over and yield.
- **Weather adaptation** — slow for rain/fog (if weather modeled).

### Violation → consequence mapping (example defaults)

| Violation | Severity | Points | Fine | Notes |
|-----------|----------|-------:|-----:|-------|
| Rolling a stop sign | Minor | 2 | $35 | Failure to fully stop |
| Running a red light | Major | 4 | $200 | Hard fail if collision |
| Speeding 1–10 over | Minor | 1 | $50 | Scales with amount over |
| Speeding 20+ over | Major | 4 | $250 | |
| Failure to yield (ped) | Major | 4 | $200 | Hard fail if collision |
| Unsafe lane change / no signal | Minor | 2 | $60 | |
| Tailgating | Minor | 2 | $75 | Sustained < safe gap |
| Wrong-way / one-way violation | Major | 4 | $300 | |
| Collision | Critical | 6 | — | Ends the drive |

- **License point budget** (default 12). Cross it → **"license suspended"**, the
  run ends, and the report frames it as a learning checkpoint (not a punishment).
- All numbers are **configurable per jurisdiction profile** (see §15 open
  questions). v1 ships a generic US profile.

## 8. Simulation fidelity

"As close to real life as practical." Priorities, highest first:

1. **Believable rules & consequences** (the teaching core) — must be correct.
2. **Believable vehicle feel** — acceleration, braking distance, steering
   response, momentum. A car should not stop instantly or turn like a go-kart.
3. **Believable traffic** — other vehicles obey signals, maintain lanes, brake
   for hazards, occasionally do realistic-but-imperfect things you must react to.
4. **Believable environment** — readable signage, intersections, lane markings,
   crosswalks, on/off ramps.
5. **Nice-to-have realism** — day/night, weather, pedestrians, mirrors, blind
   spots, parking.

### Vehicle model (v1)
- Arcade-leaning physics tuned toward realism: throttle/brake curves, traction,
  understeer at speed, brake fade off. Not a hardcore sim (no clutch/gearbox
  micro-management unless requested).
- A **HUD** with speedometer, current speed limit, gear (D/R), turn-signal
  indicators, seatbelt light, and the coach banner.

### Traffic AI (v1)
- Lane-following vehicles with simple intelligent-driver-model behavior (keep
  distance, stop at lights/signs, yield).
- Scripted hazard agents for teaching moments (a pedestrian who steps out, a car
  that brakes suddenly) seeded by the scenario.

### Pedestrians, weather, night
- v1: basic pedestrians at crosswalks. Weather/night roadmap.

## 9. Controls — iPhone as the wheel

### 9.1 Primary input model (v1): single-device tilt steering
- Hold the phone in **landscape**, like a small wheel.
- **Tilt left/right (roll axis)** = steer. Read via `CoreMotion`
  (`CMMotionManager` device attitude / gravity vector). Apply a deadzone,
  smoothing/low-pass filter, and a configurable sensitivity + steering curve
  (more precise near center).
- **Calibration step:** "hold the phone how you'll drive, tap to center." Sets
  the neutral attitude so any comfortable hold works.
- **Pedals & shifter on-screen:** thumb-reachable **accelerate** (right) and
  **brake** (left) buttons; **turn-signal** taps (or flick gestures); **D/R**
  toggle; **horn**. Pressure/long-press maps to pedal intensity.
- **Why this model:** you can watch the screen while tilting — the proven control
  scheme of mobile driving games — so it's a true single-device experience.

### 9.2 Optional input model (roadmap): companion-screen "wheel + display"
- iPhone acts purely as a **wheel controller**, streaming inputs over local
  network / Multipeer / GameController framework to a **second screen** (Mac,
  Apple TV, iPad) that renders the drive.
- Closer to a real cockpit (you look ahead, not down) but needs two devices and
  low-latency transport. Deferred to keep v1 single-device.

### 9.3 Accessibility / alternative controls
- **Touch-steer fallback:** on-screen wheel or left/right zones for users who
  can't tilt.
- Adjustable sensitivity, invertible axis, larger controls, audio-only coaching,
  colorblind-safe sign highlights.

## 10. Progression, scoring & meta-game

- **Driving record** persists across drives: total points, active tickets, fines,
  rules mastered, lifetime stats (clean drives, miles, hours).
- **Per-drive report card:**
  - Score (0–100) from a weighted rubric: rule compliance, smoothness
    (jerk/harsh braking), lane discipline, signal usage, hazard reactions.
  - Tickets issued (with the rule, what happened, the correct action).
  - Rules newly mastered; rules to practice.
- **Skill tree / curriculum:** drives unlock as you master prerequisites
  (Parking lot → Quiet streets → Busy intersections → Highway on/off ramps →
  Mixed city+highway "road test").
- **"Road test" mode:** a graded exam-style drive with no coaching at all, to
  simulate a DMV test.
- **Streaks & gentle gamification:** clean-drive streaks, "record expungement"
  after N clean drives (mirrors real point decay), badges for mastered rules.
  Tone stays **encouraging, coach-like — never shaming.**

## 11. Data model (rules as data)

The coach and scoring engines are **generic**; all rules live in data so the
catalog grows without engine changes.

```jsonc
// RuleDefinition
{
  "id": "stop_sign",
  "category": "street",
  "displayName": "Stop sign",
  "triggerType": "proximity_to_sign",  // how an encounter is detected
  "freeEncounters": 3,                   // coached passes before enforcement
  "masteryCleanRuns": 3,
  "coaching": {
    "full":  { "lead": 6.0, "text": "Stop sign ahead. Come to a FULL stop behind the line, then go when clear.", "showIdealBrake": true },
    "light": { "lead": 4.0, "text": "Stop sign — full stop." },
    "nudge": { "lead": 3.0, "text": "Stop sign." }
  },
  "evaluation": {                        // what makes it a violation
    "type": "must_fully_stop",
    "params": { "maxSpeedKmh": 2, "withinMetersOfLine": 1.5 }
  },
  "violation": { "severity": "minor", "points": 2, "fine": 35,
                 "label": "Rolled the stop sign",
                 "correction": "Bring the car to a complete stop next time." }
}
```

```jsonc
// PlayerRuleState (per player, per rule) — persisted
{
  "ruleId": "stop_sign",
  "encounters": 5,
  "cleanInEnforcement": 1,
  "phase": "ENFORCED",          // COACHED_FULL | COACHED_LIGHT | COACHED_NUDGE | ENFORCED | MASTERED
  "lastSeenAt": "2026-06-27T18:00:00Z"
}
```

```jsonc
// DrivingRecord (per player) — persisted
{
  "points": 4,
  "pointBudget": 12,
  "tickets": [ { "ruleId": "speed_limit", "amountOver": 14, "fine": 120, "at": "..." } ],
  "stats": { "cleanDrives": 7, "totalDrives": 12, "minutesDriven": 64 }
}
```

```jsonc
// Scenario (a drive) — authored data
{
  "id": "busy_streets_01",
  "environment": "city_day",
  "route": "polyline or node graph",
  "events": [
    { "ruleId": "stop_sign", "at": "node_12" },
    { "ruleId": "pedestrian_crosswalk", "at": "node_18", "hazard": "ped_steps_out" }
  ],
  "trafficDensity": "medium",
  "targetMinutes": 5
}
```

### Engine responsibilities
- **Encounter Detector:** fires `RuleEncounter(ruleId)` when the player enters a
  rule's trigger zone.
- **Coach:** looks up `PlayerRuleState.phase`, delivers the right coaching (or
  nothing), arms the evaluator.
- **Evaluator:** watches the player through the decision zone, emits
  `Clean` or `Violation(detail)`.
- **Record/Scoring:** updates points/tickets/score, advances the state machine.
- **Reporter:** assembles the end-of-drive report.

## 12. Technical architecture & stack

### Recommended stack
- **Game engine: Unity (C#)**, building to **iOS**. Rationale: mature 3D physics
  (WheelCollider/vehicle physics), large free asset ecosystem (roads, cars,
  signs), straightforward `Input.gyro` / native CoreMotion access, fast for a
  solo dev to reach a believable driving sim. Unreal is overkill for this
  visual bar; a from-scratch SceneKit/RealityKit build is more work than it's
  worth for v1.
- **Native iOS layer (Swift):** thin plugin for high-fidelity `CoreMotion`
  attitude, haptics (`CoreHaptics`), and TTS (`AVSpeechSynthesizer`) if Unity's
  defaults aren't good enough.
- **Persistence:** local first (JSON / SQLite / Unity save) for the driving
  record and rule states. No backend required for v1. Optional cloud sync
  (iCloud) later.
- **Coaching/scoring engines:** plain C# modules, **engine-agnostic and unit
  testable**, driven by the §11 data files.

> **Alternative if you prefer all-native:** SwiftUI + **RealityKit/SceneKit** +
> CoreMotion. Cleaner Apple integration and no Unity licensing, but you build
> vehicle physics, traffic AI, and the world toolchain yourself — significantly
> more effort. Recommend Unity for v1 unless staying native is a hard
> requirement. **Decision needed (see §15).**

### High-level module map

```
┌────────────────────────────────────────────────────────┐
│ Presentation: 3D world render, HUD, coach UI, menus     │
├────────────────────────────────────────────────────────┤
│ Input: CoreMotion tilt → steering; on-screen pedals     │
├────────────────────────────────────────────────────────┤
│ Simulation: vehicle physics, traffic AI, hazards        │
├────────────────────────────────────────────────────────┤
│ Rules engine (data-driven):                             │
│   Encounter Detector → Coach → Evaluator → Scoring      │
├────────────────────────────────────────────────────────┤
│ Persistence: driving record, per-rule state, settings   │
└────────────────────────────────────────────────────────┘
```

## 13. Screens / UX surfaces

1. **Onboarding** — goal, disclaimer, controls tutorial, tilt calibration.
2. **Home / Garage** — driving record summary, continue, pick scenario.
3. **Scenario select / Curriculum map** — locked/unlocked drives, difficulty.
4. **In-drive HUD** — speedometer, speed limit, signals, seatbelt, coach banner,
   pedals, signal/horn controls.
5. **Coach overlays** — sign highlight, guidance banner, ideal-action hints.
6. **End-of-drive report** — score, tickets, mastered rules, "practice next."
7. **Rules library** — every rule, your mastery state, "re-teach me this," the
   rulebook explanation for each (also a study mode without driving).
8. **Settings** — sensitivity, audio/haptics, accessibility, jurisdiction
   profile, reset progress.

## 14. Roadmap / milestones

- **M0 — Prototype the control + coach loop (proof of concept).**
  Flat test track, one car, tilt steering, **stop sign + speed limit** rules,
  the full 1→3 coaching → enforcement arc, a basic report. *Validates the core
  feel and the fading-scaffold mechanic.*
- **M1 — MVP street drive.** The ★ MVP rule set, a small city block with
  intersections/lights/crosswalks, basic traffic AI, driving record persistence,
  curriculum of ~3 drives, report cards.
- **M2 — Highway.** On/off ramps, merging, following distance, lane discipline,
  faster traffic.
- **M3 — Depth.** School zones, roundabouts, railroad, emergency vehicles,
  night/weather, skill decay, "road test" exam mode.
- **M4 — Polish & optional companion-screen mode.** Better assets, haptics, voice
  coach, accessibility pass, optional iPhone-as-controller-to-second-screen.

Each milestone is independently demoable.

## 15. Open questions / decisions to confirm

1. **Repository:** confirm we spin up a new repo `drivecoach` rather than building
   inside `drivewise`. (Recommended: new repo.)
2. **Engine:** Unity (recommended) vs. all-native SwiftUI/RealityKit?
3. **Control model for v1:** single-device tilt-and-watch (recommended) vs.
   committing early to the two-device wheel+screen setup?
4. **Jurisdiction:** which rule set to model first? (Default: generic US. Your
   home state can be the first concrete profile.)
5. **Coaching free-pass count:** keep the literal "3" from your idea as the
   default `freeEncounters`, with per-rule overrides? (Recommended: yes.)
6. **Voice coaching:** synthesized TTS (fast, free) vs. recorded VO (warmer, more
   work)? (Recommended: TTS for v1.)
7. **Art:** buy/borrow asset packs vs. commission/custom? (Recommended: asset
   packs for v1 to focus effort on the coaching system.)

## 16. Risks & mitigations

- **Tilt steering feels bad / nauseating** → invest in M0 tuning (deadzone,
  smoothing, curve, calibration); ship a touch-steer fallback.
- **Scope creep toward "full driving sim"** → the coaching arc, not graphics, is
  the product; hold the line on fidelity priorities in §8.
- **Rule correctness/liability** → clear "practice tool, not legal advice"
  disclaimer; jurisdiction profiles reviewed against official driver handbooks.
- **Traffic AI complexity** → start with simple lane-followers + scripted
  hazards; only deepen if the teaching needs it.
- **Solo-dev bandwidth** → milestones are vertical slices; M0 alone is a
  satisfying, demoable thing.

## 17. Success metrics

- **Learning:** rules reaching "Mastered"; downward trend in violations per drive
  over time; clean "road test" pass.
- **Confidence (the real goal):** self-reported readiness before/after; you feel
  ready to drive a real car without fear of tickets.
- **Engagement:** drives completed, clean-drive streaks, return sessions.

---

*This spec is intentionally implementation-light on art and audio and
implementation-heavy on the coaching/rules engine, because that adaptive coach —
help fully the first three times, then go quiet and hold you accountable — is
what makes DriveCoach different from a driving game.*
