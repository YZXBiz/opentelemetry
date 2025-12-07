# Docs-Site Styling Tips (Design-Only)

Curated notes on how the Docusaurus docs site is styled—no content copy, just the visual system. The full styling source lives in `style-site/custom.css` (copied from `docs-site/src/css/custom.css`).

## Design Tokens
- Colors: CVS red primary (`--ifm-color-primary: #cc0000`) with darker/lighter steps; light surfaces (`#fafafa` / `#ffffff`) and dark surfaces (`#0a0a0f` / `#0f0f14`); gradients used for accents.
- Typography: Outfit for headings/body, JetBrains Mono for code. Font weights: headings 600–700; code at 85% size with highlighted-line background.
- Corners/Shadows: Card radius 12px, global radius 8px; shadow tokens `--shadow-sm/md/lg` for elevation.
- Spacing/Layout: Sidebar width `280px`; navbar translucent with subtle shadow; glassmorphism and gradient borders on feature cards and badges.

## Site Framing & Navigation
- Navbar: Blur/backdrop with thin border; title weight 600; links at 0.9rem weight 500.
- Sidebar/Menu: Uppercase collapsible section headers, pill-hover active background (`--ifm-menu-color-background-active`).
- Table of Contents: Auto-numbered H2/H3 entries; active link uses primary color.
- Headings: H2/H3 auto-numbering inside articles; H2 underline gradient; generous top rhythm.
- Scroll behavior: Smooth with `scroll-padding-top: 80px`; custom scrollbar thumbs tinted by emphasis colors.

## Markdown & Content Treatments
- Body copy: 1.75 line-height; muted emphasis colors for paragraphs.
- Blockquotes: Gradient backgrounds, left gradient border, decorative quote mark; tip/warning/info/danger variants use colored gradients.
- Tables: Card-like tables with separated borders, rounded corners, hover row highlight.
- Lists: Ordered lists use numbered pills with gradient fills; nested numbering for TOC and headings.
- Code: Terminal-style blocks with faux window dots, labeled language chips, copy button in primary red; Prism themes GitHub (light) and Oceanic Next (dark); KaTeX stylesheet included for math.

## Hero, Cards, and Components
- Hero: SaaS-style gradient panel, animated radial glow, 3.5rem gradient headline (drops to 2rem on mobile), centered text.
- Feature cards: Glassmorphism panels with gradient stroke on hover, lift + shadow; grid is responsive via `auto-fit` min 280px.
- Metrics cards: Monospace values on subtle gradient chips; hover lift and red accent borders.
- Utility classes: `text-gradient`, `glow-red`, `hover-lift`, `badge-red`, spacing helpers (`.mt-4`, `.mb-4`), `animated-underline`, `pulse-dot`.
- Callouts & tabs: Gradient-backed callouts (`info/success/warning/danger`), rounded tabs with bordered active state, numbered step indicators/badges.

## Diagram & Data Display Helpers
- Pipeline/flow diagrams: Flex/grid layouts with `pipeline-*`, `flow-*`, and `process-*` classes; active steps use stronger red borders.
- Network/Hub diagrams: Node badges with optional highlights (`primary/secondary/success`), simplified edge legends; hub layouts with arrow SVGs.
- Charts: `bar-chart-*` classes for simple comparison bars with legend and percentage labels.
- Mermaid: Gradient container, rounded corners, stronger stroke on nodes.

## Footer & Misc
- Footer: Light surface by default, dark override in dark mode; uppercase section titles.
- Selection/focus: Custom selection tint and visible focus outlines for links/buttons/inputs.
- Animations: Fade/slide/scale entrances on markdown and feature cards; gradient shifts on text/badges; floating badge animation.
- Responsive tweaks: Hero and headings downscale under 768px; card grids collapse to 2 then 1 column at tablet/phone widths.

## Implementation Pointers
- CSS source: `style-site/custom.css` mirrors the docs-site theme for reuse.
- Theme config: See `docs-site/docusaurus.config.ts` for dark-default colorMode, Prism themes, KaTeX stylesheet, hideable sidebar, and TOC depth settings.

