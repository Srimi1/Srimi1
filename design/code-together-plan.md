# Signal / Run — Code Together

Implemented concept · 1 October 2026

Turn the city into a small story about Srijan and Sarah building something together. Their coding session brings a contribution-powered city to life. Both characters run and jump through it, finish the build, share a hug, and return to their coffee.

The README is the main presentation. This document records the concept implemented in the README and the automatic city story. The original manual game is preserved at `docs/play.html`.

## How it appears on GitHub

Embed one looping GIF directly in the README. It plays without buttons, sliders, a launch screen, or manual controls. Render it from the actual city engine with two independent characters and an autopilot controller. Movement, jumping, and landing come from the simulation.

The README displays a rendered animation, not a live or interactive simulation. GitHub sanitizes Markdown output and removes script tags, so JavaScript gameplay cannot execute inside it. The existing playable city remains available on Pages, while the profile leads with the automatic story.

References: [GitHub's Markdown rendering pipeline](https://github.com/github/markup#github-markup), [GitHub's supported image formats](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files).

## The sequence

The loop adapts to the actual route. The current 24-day path takes about 41 seconds, preserving time for readable jumps and the closing embrace.

| Approximate time | Scene                | Character action and visual payoff                                                                                                                                                                                                                                                                          |
| ---------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–5 seconds      | Coffee and code      | Srijan and Sarah sit at a shared workstation overlooking the city. Both type with distinct hand movements, exchange a glance, and take a sip. Terminal light reflects on their faces.                                                                                                                       |
| 5–8 seconds      | The world compiles   | Code streams upward from the monitors and assembles the rooftop path. They set their mugs down, stand, and step through a cyan compiler ring.                                                                                                                                                               |
| 8–31 seconds     | The contribution run | Sarah leads the first jumps; Srijan follows a fraction of a second later. Each character has independent movement and landing state. Worked days become solid platforms with subtle dates and contribution intensity. Each landing briefly lights its block and sends a signal back toward the workstation. |
| 31–34 seconds    | Boom: build complete | They reach the final terminal together and trigger the build. A large cyan-and-gold energy bloom travels through the skyline, followed by code particles and a calm, glowing city. A short `BUILD COMPLETE` message marks the story's finish.                                                               |
| 34–39 seconds    | Together             | They turn toward each other, step closer, and hug. Hold the pose long enough to feel intentional. Give the camera a small, gentle push toward them.                                                                                                                                                         |
| 39–42 seconds    | Back to coffee       | The compiler ring carries the scene back to the workstation. They settle into the opening pose, making the loop feel like another shared coding session.                                                                                                                                                    |

The final burst should have a clear expansion and fade, with no rapid flashing. The GIF is silent; facial expression, body language, and timing carry the story.

## The two characters

Use the preserved Srijan avatar and the recovered original Sarah illustration as identity references. Keep Srijan's dark hair, cyan-accented jacket, and headphones; keep Sarah's sky-blue hair and white, black, and gold outfit.

Draw both in one consistent anime sprite style, at comparable scale and with equal visual importance. Replace the current floating Sarah presentation with an independently animated character who sits, types, drinks, stands, runs, jumps, and lands alongside Srijan.

Create separate character assets and animation tracks for idle, typing, sipping, standing, running, jumping, landing, turning, and embracing. The hug uses coordinated poses with shared contact points so their hands and shoulders meet naturally. Do not rely on moving a single unchanged picture to suggest all these actions.

Frame only a few platforms at once so both characters stay large enough to recognize on a phone. The desk scene and closing hug can use closer framing than the run.

## Contribution days become the level

Use the latest 30 completed/current calendar dates in the existing public GitHub snapshot. Every day in that window with at least one contribution becomes a platform. This keeps dates readable and the loop manageable; a faint annual calendar can remain in the city background for context.

- Each platform retains its exact source date and contribution count. The animation represents GitHub contribution activity, rather than claiming that every contribution is a code commit.
- Map the four nonzero contribution intensity levels to four restrained glow/height levels. Cap heights and spacing so every jump is physically reachable.
- Preserve chronological order. Compress long empty stretches into short skyline gaps. Quiet days are simply gaps; future dates produce no platforms.
- Sarah and Srijan have separate movement and jump state. An autopilot routes both safely through the same path and waits for the slower character before the finale.
- Landings celebrate worked days: the platforms remain intact after the characters pass.
- With a sparse calendar, use more relaxed pacing. With no active days in the window, show the coding/coffee scene and an honest empty calendar instead of inventing activity.

The checked snapshot currently has 24 active days in its latest 30-date window, which is suitable for this short traversal. That count is planning context from `docs/data/activity.json` as checked on 1 October 2026, not a number to hard-code.

## Build and refresh

1. Produce matching character sheets and a coding workstation using the preserved identity images. Review typing, sipping, jump, landing, and embrace poses before assembling the whole story.
2. Add a contribution level and two-character autopilot mode to the city engine. Use deterministic timing and reachable geometry so the same calendar produces a stable performance.
3. Render the complete sequence with a headless browser, then encode and optimize the GIF. The city renders at 960×480, with an optimized 800×400 GIF sampled at 15 frames per second. Aim below 8 MB without sacrificing the hug or readable silhouettes.
4. Replace the README's cover and prominent game instructions with the looping story, a short Srijan-and-Sarah introduction, and the existing selected projects. Keep the profile itself free of controls.
5. Extend the existing daily profile refresh to regenerate the animation when the relevant calendar data changes. Validate the new render before replacing the last successful GIF; a failed refresh keeps the previous working version.

## What makes it ready

- Both characters visibly change poses and act independently throughout the story.
- The current calendar and sparse/dense calendar examples complete the route without falls, intersecting platforms, or stranded characters.
- Every foreground contribution platform matches a real date/count from the public snapshot, and future dates are absent.
- Typing, coffee, the upward build effect, both characters' jumps, the final burst, and the hug are all clearly visible.
- The loop resets smoothly, and both identities remain recognizable in the README at desktop and phone sizes.
- The exported GIF displays directly in the GitHub README, and the refresh workflow reproduces it successfully.

The contribution simulation, new pose atlases, README GIF renderer, daily refresh, and browser checks implement this concept.
