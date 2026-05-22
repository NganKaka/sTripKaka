# sTripKaka Design Notes

## 1) Overall visual direction
- Style: cinematic travel journal + futuristic HUD overlay.
- Mood: dark, atmospheric, premium, high-contrast accents.
- Core cues: glassmorphism cards, neon cyan highlights, gold primary accents, subtle blur/glow.

## 2) Typography system
Defined in `src/index.css` via theme tokens:
- `--font-headline`: **Plus Jakarta Sans** (titles, section headers, nav emphasis)
- `--font-body`: **Manrope** (body copy, paragraphs)
- `--font-tech`: **JetBrains Mono** (micro labels, coordinates, metadata, badges)
- `--font-display`: **Space Grotesk** (display use)

Usage pattern:
- Big emotional storytelling → `font-headline`, bold/extrabold.
- Readable content blocks → `font-body`, softer contrast.
- System/HUD labels (tracking-widest, uppercase) → `font-tech`.

## 3) Color system
Theme tokens in `src/index.css`:
- `--color-primary: #e9c349` (gold accent)
- `--color-background: #0d1b2a` (deep navy base)
- `--color-surface: #111417`
- `--color-surface-container: #1d2023`
- `--color-surface-container-low/high/highest`
- `--color-on-surface: #e1e2e7` (main text)
- `--color-secondary: #bbc9d0` (secondary text)

Practical palette behavior:
- Gold (`primary`) = brand/action/high-importance state.
- Cyan (`cyan-300/400/500`) = interactive glow/tech feedback/hover energy.
- Rose (`rose-400/500`) = alerts, destructive actions, emphasis.
- White with alpha (`white/5`, `white/10`) = borders/glass layers.

## 4) Layout & spacing
Global shell (`src/App.tsx`):
- Full-page app with fixed navbar, background layer, foreground content stack.
- Content container: `max-w-7xl`, `px-6 md:px-12`, generous vertical rhythm.
- Main chrome hides during immersive states (image modal/slideshow).

Common layout motifs:
- Rounded corners (`rounded-xl`, `rounded-2xl`, `rounded-3xl`) almost everywhere.
- Card grids + masonry-like visual rhythm for archive/gallery sections.
- Big hero blocks (600–700px height) in trip detail for cinematic entry.

## 5) Motion design
Core engine: **Framer Motion** across navbar, routes, cards, modals, hero sections.

Motion language:
- Route transitions: short fade/slide/scale (~0.3s) for continuity.
- Hover microinteractions: scale, glow, translate, subtle depth shifts.
- Ambient motion: floating light blobs, constellation/parallax effects.
- Utility keyframes in `src/index.css`: `scan`, `draw`, `glitch-anim`, `waveform`, `border-spin`, `ping`, `rainFall`, `snowFall`.

Accessibility note:
- `prefers-reduced-motion` handled for shimmer utility.

## 6) Surface, borders, effects
Reusable visual utilities (`src/index.css`):
- `.glass-card` → translucent background + blur + soft border.
- `.ghost-border` → ultra-light border framing.
- `.ambient-shadow` → deep cinematic shadow.
- `.shimmer-sweep` → directional light sweep on hover.
- `.neon-border-wrapper` → animated conic neon frame.

Result: consistent “soft glass + neon edge” identity.

## 7) Component-level design patterns
### Navbar
- Semi-transparent blurred bar (`bg-background/60`, `backdrop-blur-lg`).
- Tight uppercase nav labels, active gold state, cyan hover.
- Notification panel uses glass popup with compact tech-label typography.

### Dashboard
- Story-first hero + metrics + interactive map handoff.
- Experimental interactions: magnetic cards, icon draw animation, typewriter text.
- Coordinates/system overlays reinforce travel-HUD concept.

### Archives
- Search/filter controls styled as glowing capsule controls.
- Cards blend photo-first storytelling + metadata overlays + hover reveal excerpts.

### Trip Detail
- Cinematic hero (video/poster), progress bar, layered gradients.
- Markdown story typography is large, legible, editorial.
- Floating gallery snippets and parallax depth cues.

### Gallery
- Rich media-first timeline + modal zoom/pan/touch UX.
- Review and image-note surfaces maintain same glass + border language.

### Admin
- Keeps same dark-glass design system while prioritizing form clarity.
- Markdown preview follows frontend typography palette for parity.

### Chatbot
- Floating action button with pulse beacon.
- Docked glass panel, compact conversational bubbles, suggestion cards using highlight colors.

## 8) Cursor and brand personality
Custom SVG cursors (base + interactive states) in `src/index.css`:
- Default: gold ring + cyan center.
- Interactive targets: cyan ring + gold center.

This detail strongly reinforces the project’s “navigation/instrument panel” personality.

## 9) Design strengths
- Strong, coherent identity (travel + sci-fi HUD) across all pages.
- Clear tokenized color/typography foundation.
- Motion is expressive yet mostly controlled.
- Reusable utility classes keep visual consistency.

## 10) Potential refinements
- Add explicit Tailwind config/theme file for stronger token centralization (currently mostly in CSS theme tokens + utilities).
- Expand reduced-motion coverage beyond shimmer for all heavy animations.
- Normalize a small semantic color map (success/warning/error/info) for future scale.
- Define spacing/size primitives (e.g., card padding scale) to reduce ad-hoc variance.

## 11) Quick design summary
sTripKaka uses a dark cinematic base, gold brand accents, cyan interactive glow, and glassmorphism surfaces, combined with Framer Motion micro/macro animations to deliver a premium travel-journal experience with futuristic control-panel aesthetics.