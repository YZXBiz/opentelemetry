# Technical Documentation Template

_Complete Docusaurus setup with CVS Red theme, React diagrams, and pedagogical content design_

---

## 📋 Table of Contents

1. [Quick Start](#1-quick-start)
2. [Teaching Methodology](#2-teaching-methodology)
3. [Content Structure](#3-content-structure)
4. [Design System](#4-design-system)
5. [React Diagram Components](#5-react-diagram-components)
6. [CSS Theme Reference](#6-css-theme-reference)
7. [Checklists](#7-checklists)

---

## 1. Quick Start

### Initialize Docusaurus

```bash
npx create-docusaurus@latest docs classic --typescript
cd docs
npm install
```

### Required Files

Copy these to your project:

| File | Location | Purpose |
|------|----------|---------|
| `custom.css` | `docs/src/css/custom.css` | Full CVS Red theme |
| `Diagram.tsx` | `docs/src/components/diagrams/Diagram.tsx` | React diagram system |
| `Diagram.module.css` | `docs/src/components/diagrams/Diagram.module.css` | Diagram styles |

### Config Updates

```typescript
// docusaurus.config.ts
const config = {
  title: 'Your Guide',
  baseUrl: '/your-repo/',
  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: { /* ... */ },
    docs: {
      sidebar: { hideable: true },
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
  },
};
```

---

## 2. Teaching Methodology

### The Three-Part Explanation

Always introduce concepts with this pattern:

```markdown
**In plain English:** [Analogy anyone can understand]
**In technical terms:** [Precise definition]
**Why it matters:** [Real-world benefit/consequence]
```

### Progressive Complexity

```
Simple concept → Intermediate application → Advanced implementation
```

### Insight Boxes

Use for key knowledge that connects concepts:

```markdown
> **💡 Insight**
>
> [Key knowledge that connects concepts to broader patterns]
```

### Warning Boxes

```markdown
> **⚠️ Warning**
>
> [Critical information about potential issues]
```

### Code Examples

- **Explain before showing** — Context first, code second
- **Use realistic examples** — Actual commands that work
- **Show expected output** — What should happen
- **Test everything** — All examples must work

---

## 3. Content Structure

### Numbered TOC (Required)

```markdown
## 📋 Table of Contents

1. [Introduction](#1-introduction)
2. [Main Topic](#2-main-topic)
   - 2.1. [Subtopic](#21-subtopic)
3. [Summary](#3-summary)
```

### Header Numbering

| Level | Format | Example |
|-------|--------|---------|
| Main | `## 1.` | `## 1. Introduction` |
| Sub | `### 1.1.` | `### 1.1. Subtopic` |
| Sub-sub | `#### 1.1.1.` | `#### 1.1.1. Detail` |

### Navigation Footer

```markdown
---
**Previous:** [Link] | **Next:** [Link]
```

### Emoji Usage

| Category | Emojis |
|----------|--------|
| **Sections** | 🎯 Goals · 📋 Lists · 🚀 Performance · 🔧 Implementation · 🌊 Pipelines |
| **Callouts** | 💡 Insight · ⚠️ Warning · 📝 Note · 🎓 Learning · 🔒 Security |
| **Content** | 💻 Code · 🖥️ Systems · 🌐 Network · ⏱️ Performance · 📊 Metrics |

### Content Rules

- ❌ **No footnotes** — Keep all content inline, don't use `[^1]` style footnotes
- ❌ **No Mermaid** — Use React diagram components instead
- ✅ **Inline explanations** — Put context directly where it's needed

---

## 4. Design System

### CVS Red Color Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| **Primary** | `#cc0000` | `#ff4444` | Links, buttons, accents |
| **Primary Dark** | `#b80000` | `#ff2b2b` | Hover states |
| **Primary Light** | `#e00000` | `#ff6b6b` | Backgrounds |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Blue** | `#3b82f6` | Information, primary diagrams |
| **Purple** | `#8b5cf6` | Secondary elements, categories |
| **Green** | `#10b981` | Success, positive, completion |
| **Orange** | `#f59e0b` | Warning, attention, caution |
| **Red** | `#ef4444` | Error, danger, critical |
| **Slate** | `#64748b` | Neutral, borders, muted |
| **Cyan** | `#06b6d4` | Accent, highlights |
| **Pink** | `#ec4899` | Special, decorative |

### Typography

| Element | Font | Weight |
|---------|------|--------|
| Headings | Outfit | 600-700 |
| Body | Outfit | 400 |
| Code | JetBrains Mono | 400-500 |

### Spacing & Radius

| Token | Value |
|-------|-------|
| Card radius | `12px` |
| Global radius | `8px` |
| Sidebar width | `280px` |

---

## 5. React Diagram Components

### Import Statement

```jsx
import {
  Box, Arrow, Row, Column, Group,
  DiagramContainer, ProcessFlow, TreeDiagram,
  CardGrid, StackDiagram, ComparisonTable,
  colors
} from '@site/src/components/diagrams';
```

### Available Colors

```jsx
colors.blue    // #3b82f6
colors.purple  // #8b5cf6
colors.green   // #10b981
colors.orange  // #f59e0b
colors.red     // #ef4444
colors.slate   // #64748b
colors.cyan    // #06b6d4
colors.pink    // #ec4899
```

### Component Reference

#### Box

```jsx
<Box
  color={colors.blue}           // Color from palette
  variant="filled"              // 'filled' | 'outlined' | 'subtle'
  size="md"                     // 'sm' | 'md' | 'lg'
  icon="🔧"                     // Optional emoji icon
>
  Label Text
</Box>
```

#### Arrow

```jsx
<Arrow
  direction="right"             // 'right' | 'down' | 'left' | 'up'
  label="connects to"           // Optional label
  color={colors.slate}          // Optional color
/>
```

#### Row & Column

```jsx
<Row gap="md" align="center" wrap={true}>
  {/* Horizontal layout */}
</Row>

<Column gap="md" align="center">
  {/* Vertical layout */}
</Column>
```

#### Group

```jsx
<Group title="Section Name" color={colors.blue} direction="column">
  <Box>Item 1</Box>
  <Box>Item 2</Box>
</Group>
```

#### DiagramContainer

```jsx
<DiagramContainer title="Diagram Title">
  {/* Diagram content */}
</DiagramContainer>
```

#### ProcessFlow

```jsx
<ProcessFlow
  direction="horizontal"        // 'horizontal' | 'vertical'
  steps={[
    { title: "Step 1", description: "Do this first", icon: "1️⃣", color: colors.blue },
    { title: "Step 2", description: "Then this", icon: "2️⃣", color: colors.purple },
    { title: "Step 3", description: "Finally this", icon: "3️⃣", color: colors.green }
  ]}
/>
```

#### TreeDiagram

```jsx
<TreeDiagram
  compact={false}
  root={{
    label: "Root",
    color: colors.blue,
    icon: "🌳",
    children: [
      { label: "Child 1", color: colors.purple },
      { label: "Child 2", color: colors.green, children: [
        { label: "Grandchild", color: colors.slate }
      ]}
    ]
  }}
/>
```

#### CardGrid

```jsx
<CardGrid
  columns={3}                   // 2 | 3 | 4
  cards={[
    {
      title: "Card Title",
      icon: "📊",
      color: colors.blue,
      description: "Card description text",
      items: ["Item 1", "Item 2", "Item 3"]
    },
    // ... more cards
  ]}
/>
```

#### StackDiagram

```jsx
<StackDiagram
  title="Architecture Layers"
  layers={[
    { label: "Presentation", color: colors.blue, items: ["React", "CSS"] },
    { label: "Business Logic", color: colors.purple, items: ["Services"] },
    { label: "Data", color: colors.green, items: ["PostgreSQL", "Redis"] }
  ]}
/>
```

#### ComparisonTable

```jsx
<ComparisonTable
  beforeTitle="Without"
  afterTitle="With"
  beforeColor={colors.red}
  afterColor={colors.green}
  items={[
    { label: "Speed", before: "Slow", after: "Fast" },
    { label: "Cost", before: "High", after: "Low" }
  ]}
/>
```

### Example: Complete Diagram

```jsx
<DiagramContainer title="System Architecture">
  <Column gap="md">
    <Row gap="sm">
      <Box color={colors.blue} icon="📱">Frontend</Box>
      <Arrow direction="right" />
      <Box color={colors.purple} icon="⚙️">API Gateway</Box>
      <Arrow direction="right" />
      <Box color={colors.green} icon="🗄️">Database</Box>
    </Row>
    <Arrow direction="down" label="logs to" />
    <Box color={colors.orange} size="lg">Monitoring System</Box>
  </Column>
</DiagramContainer>
```

---

## 6. CSS Theme Reference

### Key CSS Variables

```css
:root {
  /* Primary Colors */
  --ifm-color-primary: #cc0000;
  --ifm-color-primary-dark: #b80000;
  --ifm-color-primary-light: #e00000;

  /* Typography */
  --ifm-font-family-base: 'Outfit', sans-serif;
  --ifm-font-family-monospace: 'JetBrains Mono', monospace;
  --ifm-heading-font-weight: 600;

  /* Layout */
  --ifm-card-border-radius: 12px;
  --ifm-global-radius: 8px;
  --doc-sidebar-width: 280px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### Dark Mode Variables

```css
[data-theme='dark'] {
  --ifm-color-primary: #ff4444;
  --ifm-background-color: #0a0a0f;
  --ifm-background-surface-color: #0f0f14;
  --ifm-navbar-background-color: rgba(15, 15, 20, 0.9);
}
```

### Feature Classes

| Class | Effect |
|-------|--------|
| `.feature-card` | Glassmorphism card with hover lift |
| `.hero-section` | Gradient hero with animated glow |
| `.text-gradient` | Animated gradient text |
| `.hover-lift` | Lift on hover with shadow |
| `.badge-red` | Red pill badge |
| `.pulse-dot` | Animated pulsing dot |

---

## 7. Checklists

### Structure

- [ ] Numbered TOC with working anchor links
- [ ] Consistent header numbering (1, 1.1, 1.2)
- [ ] Previous/Next navigation links
- [ ] Frontmatter with title, description, sidebar_position

### Teaching

- [ ] Start with analogies ("In plain English")
- [ ] Use progressive examples (simple → advanced)
- [ ] Include insight boxes for key concepts
- [ ] Add visual diagrams using React components
- [ ] Break complex concepts into numbered steps
- [ ] Explain context before showing code

### Quality

- [ ] All code examples tested and working
- [ ] Clear progression from simple to advanced
- [ ] Concepts connected to broader patterns
- [ ] React diagrams for all visual flows (no Mermaid)
- [ ] No footnotes — keep all content inline
- [ ] Dark mode works correctly
- [ ] Mobile responsive

### Deployment

- [ ] GitHub Actions workflow configured
- [ ] `baseUrl` set correctly for GitHub Pages
- [ ] `.nojekyll` file in static folder
- [ ] Build passes without errors

---

## File Templates

### Frontmatter

```yaml
---
sidebar_position: 1
title: "Chapter Title"
description: "Brief description for SEO and previews"
---
```

### Chapter Structure

```markdown
---
sidebar_position: 2
title: "Chapter X: Topic Name"
description: "Description here"
---

import { CardGrid, Row, Box, Arrow, colors } from '@site/src/components/diagrams';

# 🎯 Chapter X: Topic Name

> **"Relevant quote"**
>
> — Attribution

---

## 📋 Table of Contents

1. [Introduction](#1-introduction)
2. [Main Section](#2-main-section)
3. [Summary](#3-summary)

---

## 1. Introduction

**In plain English:** [Simple explanation]
**In technical terms:** [Technical definition]
**Why it matters:** [Real-world benefit]

---

## 2. Main Section

Content here...

<DiagramContainer title="Visual Explanation">
  <Row gap="md">
    <Box color={colors.blue}>Step 1</Box>
    <Arrow direction="right" />
    <Box color={colors.green}>Step 2</Box>
  </Row>
</DiagramContainer>

> **💡 Insight**
>
> Key takeaway here.

---

## 3. Summary

### 🎓 Key Takeaways

1. **First point** — Explanation
2. **Second point** — Explanation

---

**Previous:** [Previous Chapter](./previous) | **Next:** [Next Chapter](./next)
```

---

_Transform complex technical content into learnable knowledge with beautiful, consistent design._
