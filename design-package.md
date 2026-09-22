# FOBS FRAGRANCES: Design Package

## 1. The brand premise

One idea, taught and sold on every band: scent is meant to stay close. FOBS FRAGRANCES makes a warm amber perfume that settles into the skin and stays the evening, the way good perfume used to work, instead of a loud cloud that fades by afternoon. Every section, the interactive moment, and the closing line serve that one idea. Nothing else belongs on the page.

## 2. The palette as CSS tokens

Named from the storyboard's world: dusk amber light, candle glow, dark warm shadows. Exact values finalize from the approved footage after the video gate; these are the working tokens the build starts from.

```css
:root{
  --canvas:#16110c;        /* page background, deep warm dusk, never pure black */
  --panel:#221a12;         /* cards and raised surfaces */
  --accent:#d9a441;        /* the CTA and rare emphasis, warm amber gold */
  --accent-hover:#e8bd63;  /* the accent's hover state, brighter gold */
  --accent-muted:rgba(217,164,65,0.35); /* the accent at whisper level: borders, glows, particles */
  --text-secondary:#b7a68c;
  --text-primary:#f3ead8;
}
```

## 3. The type trio

- Display: **Cormorant Garamond**, weights 500 and 600, italic 500 for the notes. The pour's long elegant lines.
- Body: **Karla**, weights 400, 500, 600. Quiet, steady, readable at small sizes.
- Mono: **Space Mono**, weight 400, for small labels: band captions, the wordmark kicker, metadata.

Loaded from Google Fonts. Never Inter, never Roboto.

## 4. The band map

Tier 1, four bands, one journey. Ranges are labeled starting points, validated by the flick test.

| Band | Range (starting point) | Footage moment | Copy (verbatim) | Entrance |
|---|---|---|---|---|
| 1 | 0.00 to 0.14 | The bottle rests above in dusk light; the pour begins | kicker "FOBS FRAGRANCES" then headline "The pour" | the wordmark and headline taste in, slow, as the stream starts |
| 2 | 0.16 to 0.32 | The amber liquid pours in one continuous ribbon toward the bottom | "Scent should not shout. It should settle." | the line rises in with the stream |
| 3 | 0.34 to 0.50 | The ribbon gathers into a pool that widens, still and shining | "Warm amber. A little wine. Evening light. Notes that stay close to the skin." | the line settles in as the pool settles |
| 4 | 0.52 to 0.68 | The pool rests full, dust motes hang, bottle roofed above | "One pour, all evening." + CTA "Get the bottle" | the line breathes in, then rests |

## 5. The static-hero copy block

For visitors on the static hero, written to stand alone with no journey behind it:

- Headline: "Scent that stays close to skin"
- Subline: "A warm amber perfume that settles into the skin and stays the evening."
- CTA: "Get the bottle"

## 6. The below-fold outline

Every section funnels to one call to action: Get the bottle.

- **The idea.** "One idea, threaded through every pour: scent that stays." Body: "A scent is personal when it stays close. FOBS is a warm amber carried on the skin, not a cloud that fades by afternoon. It works the way good perfume used to work."
- **The pour, in three notes** (pyramid):
  - Top: "Amber spark and evening air."
  - Heart: "Warm caramel, dry cedar, a hint of wine."
  - Base: "Musk and amber that stay on the skin till midnight."
- **The interactive moment**, in this section, on the bottle card: press and hold to settle the scent. The amber glow fills and the dust motes still. Reduced motion shows the settled state directly.
- **What people say.** Three lines in the buyers' own words:
  - "A colleague stopped me in the hallway and asked what I was wearing."
  - "Every perfume I tried faded by noon. This one stays."
  - "I catch myself sniffing my wrist at midnight."
- **The FAQ**, answering the real objections found in research:
  - "Does it actually last?" "Yes, that is the point. It sits on skin, not in the air, so it holds hours past most scents. Expect it still faint on your wrist at midnight."
  - "Why so expensive compared to a mist or a designer bottle?" "Because it is a real parfum: a high concentration of amber and musk, hand-poured in small batches. Lasts longer on skin, so a bottle lasts you months."
  - "Will I use it, or let it sit on a shelf?" "Sample first, spend second. If the warm amber is not yours, the sample set costs little and tells you fast."
  - "What does it smell like, exactly?" "Warm caramel and dry cedar over amber and musk, with a wine-dark warmth. Dusk light in a bottle. Close, never loud."
  - "Can I try it before the full bottle?" "Yes. The sample set holds three wearings each, enough to live with it for a week."
- **The CTA section.** "Get the bottle." Subline: "Sample set first, or go straight to the full pour. Either way it arrives wrapped like an evening." Form: one field, email, label "Email", placeholder "you@you.com", button "Get the sample", success state "You are in. We write when it ships." Form handling choice: JS-only success state (static site, no backend).
- **The footer.** Wordmark, one line: "Makes something to wear close." Disclosure (invented brand): "FOBS FRAGRANCES is a fictional brand made for this demo. No perfume is on sale."

## 7. The vector layer plan

- The pour line: a thin self-drawing SVG line that runs down the left margin of the idea section, pulling toward the CTA. Reduced motion shows the finished line, no draw.
- Dust motes: a whisper field of tiny amber dots drifting down across the hero and the settle, driven by requestAnimationFrame, stopped under reduced motion.
- The drop: a single small amber drop SVG used as the bullet in the three notes.
- All of it honors reduced motion: final states shown, drives stopped.

## 8. The engineering list

The full standard, held at every step of the build: Blob video fetch with a loading ring; dt-normalized lerp; gated seeks; delta-gated DOM writes; band pacing with the flick test; the four-layer legibility system; the five static-hero gates kept live with change listeners; complete-without-video; the quality floor; and the whole-site-animated standard from Phase 8 of the skill.

## 9. The copy gate line

Every viewer-facing line above ships verbatim. The built page must pass the Phase 9 grep gate before anyone sees it: zero em dashes, zero stock words, plus a body-copy sweep for AI tells. Deliberate devices written into this package (the three-note triplet, the staccato "Close, never loud.") are craft and stay; the sweep hunts what drifted in uninvited.