# Visual Style Guide

## Aesthetic Overview
The blog leans into a quiet, editorial minimalism: deep charcoal panels, parchment-like day surfaces, and subtle borders frame long-form writing. Generous spacing, tightly tracked uppercase labels, and monospace typography reinforce the “slow web” feel while the lavender accent keeps the interface from feeling sterile.

## Core Palette

### Brand Neutrals
- **Night background:** `#0b0b0f`
- **Day background:** `#fdfbff`
- **Default foreground text:** `#f4f4f5` (night) / `text-zinc-900` (day)
- **Supporting neutrals:** `text-zinc-100/200/300/400` (night) and `text-zinc-500/600/700` (day) for hierarchy.

### Accent
- **Primary accent:** `#d4afe3`
- **Hover accent:** `#e3c4f0`
- **Selection overlay:** `color-mix(in srgb, var(--accent) 70%, transparent)` to maintain contrast while hinting at the accent.
- Accent is reserved for interactive highlights—hover states, focus rings, toggles, and call-to-action buttons.

## Typography
- **Body typeface:** IBM Plex Mono with a stack of monospace fallbacks for consistent rhythm.
- **Logotype:** Libre Barcode 39 Text, used in uppercase to create a distinctive masthead.
- **Voice:** Small uppercase labels with expanded tracking emphasize navigation, filters, and metadata.

## Layout & Spacing
- **Reading column:** `max-w-4xl` center column with `px-6` / `px-8` gutters and generous vertical gaps (`gap-20`, `space-y-8`) to let sections breathe.
- **Hierarchy:** Feature blocks, archives, and subscription forms sit in stacked sections separated by roomy spacing rather than heavy dividers.

## Component Treatments

### Cards & Surfaces
- Post cards use `rounded-md` corners, hairline borders, and translucent surfaces that adapt to the active theme.
- Metadata strips rely on uppercase, letter-spaced labels; action buttons stay compact (`h-9 w-9`) with accent-driven focus rings.
- Forms mirror the card styling—thin underlines, rounded submit buttons, and accent-colored hover states.

### Interactions
- Links inherit text color but shift to the accent on hover.
- Focus states use `focus-visible:ring-2` paired with the accent to satisfy accessibility without visual clutter.
- Toggle buttons swap between sun/moon glyphs with subtle background washes rather than full color fills.

## Theme Tokens

### Day Theme
- **Page:** `bg-[#fdfbff] text-zinc-900`
- **Surface panels:** `border-zinc-200 bg-white/90`
- **Inputs:** `border-b-zinc-300 bg-white text-zinc-900` with accent focus ring
- **Subtle text:** `text-zinc-500` (labels) / `text-zinc-600` (body copy) / `text-zinc-700` (surface text)
- **Auth toggle:** `border-zinc-300 text-zinc-600` with accent hover border/fill

### Night Theme
- **Page:** `bg-[#0b0b0f] text-zinc-100` (content) and `bg-[#060608]` in auth views for extra depth
- **Surface panels:** `border-white/15 bg-white/5` (home) and `border-white/12 bg-[rgba(6,6,8,0.65)]` with blur (auth)
- **Inputs:** `border-b-white/25 bg-black/30 text-zinc-100` with accent focus ring
- **Subtle text:** `text-zinc-400` for secondary copy, `text-zinc-200` on surfaces, `text-zinc-500` for muted labels
- **Auth toggle:** `border-white/20 text-zinc-300` with accent hover feedback

## Minimalist Behavior
- Decorative elements are pared back to thin rules, soft shadows, and translucent overlays; accent color carries the visual identity.
- Section headers rely on typography (weight, size, tracking) instead of containers.
- The layout maintains a single-column flow with optional feature and archive sections, keeping navigation effortless and uncluttered.

## Usage Notes
- Treat accent usage sparingly—reserve it for primary actions, hover states, and focus indicators to keep the interface calm.
- Maintain the monospace body stack for consistency across auth and reader experiences.
- When introducing new components, align borders (`border`, `rounded-sm/md`) and spacing tokens (`space-y-*`, `gap-*`) with existing sections to preserve rhythm.
