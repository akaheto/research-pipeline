# Visual Style Guide: Research Pipeline

## Color Palette

### Primary Colors
- **Purple Gradient:** `#667eea` to `#764ba2` (primary actions, headers)
  - Used for buttons, gradients, interactive elements
  - Conveys professionalism and trust
  - Accessibility: WCAG AA compliant on white backgrounds

- **White:** `#ffffff` (backgrounds, cards)
  - Clean, minimal aesthetic
  - High contrast for readability

- **Light Gray:** `#f5f5f5` or `#f9f9f9` (subtle backgrounds)
  - Used for panels, grouped content
  - Provides visual hierarchy without overwhelming

### Secondary Colors

**Semantic Colors:**
- **Green (Success):** `#4caf50`
  - High credibility scores
  - Verified/supported claims
  - Check marks, positive indicators

- **Orange (Warning):** `#ff9800`
  - Medium credibility
  - Potential issues, conflicts
  - Requires user attention

- **Red (Error/Alert):** `#f44336`
  - Low credibility
  - Unsupported claims
  - Conflicts detected
  - Delete actions

- **Blue (Info):** `#2196f3`
  - Timeline changes
  - Comparison results
  - Informational elements

**Neutral Colors:**
- **Dark Gray (Text):** `#333333`
  - Primary text, headers
  - 87% opacity for accessibility

- **Medium Gray (Secondary):** `#666666`
  - Secondary text, metadata
  - 54% opacity

- **Light Gray (Borders):** `#e0e0e0`
  - Dividers, input borders
  - Subtle visual separation

---

## Typography

### Font Family
- **Primary:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - System fonts for optimal rendering
  - Fast loading (no external font files)
  - Consistent with OS defaults

### Font Sizes & Usage

| Purpose | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page Title (H1) | 2.5em (40px) | 600 | 1.2 |
| Section Header (H2) | 1.8em (28px) | 600 | 1.3 |
| Subsection (H3) | 1.3em (21px) | 600 | 1.4 |
| Body Text | 16px (1em) | 400 | 1.6 |
| Label/Caption | 0.95em (15px) | 500 | 1.5 |
| Small Text (Meta) | 0.9em (14px) | 400 | 1.4 |
| Extra Small (Timestamps) | 0.85em (13px) | 400 | 1.3 |

### Weight Usage
- **600 (Semi-bold):** Headers, buttons, emphasis
- **500 (Medium):** Labels, important meta
- **400 (Regular):** Body text, descriptions

### Line Height Ratios
- Headers: 1.2-1.4 (tight, visual impact)
- Body: 1.5-1.6 (readability)
- Meta: 1.3-1.4 (compact)

---

## Spacing & Layout Grid

### Grid System
**8px base unit grid**
- All spacing multiples of 8px
- Consistent visual rhythm
- Easier to calculate proportions

### Common Spacing Values
- **4px:** Micro-spacing (icon padding, tight groups)
- **8px:** Small gaps (adjacent elements)
- **12px:** Standard padding (form inputs, buttons)
- **16px:** Medium spacing (cards, sections)
- **20px:** Large spacing (page margins)
- **30px:** XL spacing (major sections)
- **40px:** XXL spacing (page margins bottom)

### Container Rules
- **Max-width:** 1200px (main content)
- **Padding:** 20px (all sides on desktop)
- **Gap between columns:** 16px
- **Card border-radius:** 8px or 12px
- **Button border-radius:** 6px or 8px

### Responsive Breakpoints
- **Desktop:** 1200px+
- **Tablet:** 768px - 1199px
- **Mobile:** < 768px

---

## Core Component Patterns

### Buttons

**Primary Button**
```
Background: Linear gradient #667eea → #764ba2
Text: White, 16px, semi-bold
Padding: 12px 24px
Border-radius: 8px
Hover: translateY(-2px), shadow 0 4px 12px rgba(102,126,234,0.4)
Disabled: opacity 0.6, cursor not-allowed
```

**Secondary Button**
```
Background: #f0f0f0
Border: 2px solid #e0e0e0
Text: #333, 16px
Padding: 12px 24px
Border-radius: 8px
Hover: background #e8e8e8, border #667eea
```

**Icon Button**
```
Background: None
Border: None
Font-size: 18px
Padding: 12px 16px
Hover: background #f0f0f0
```

### Form Inputs

**Text Input / Textarea**
```
Padding: 12px 16px
Border: 2px solid #e0e0e0
Border-radius: 8px
Font-size: 16px
Focus: outline none, border-color #667eea
Font-family: inherit
```

**Checkbox**
```
Size: 20px × 20px
Cursor: pointer
Margin: margin-right 12px
```

**Select Dropdown**
```
Padding: 6px 10px
Border: 2px solid #e0e0e0
Border-radius: 6px
Font-size: 0.95em
Focus: border #667eea, box-shadow 0 0 0 3px rgba(102,126,234,0.1)
```

### Cards & Panels

**Standard Card**
```
Background: #f5f5f5
Border: 1px solid #e0e0e0
Border-radius: 6px
Padding: 12px
Hover: background #efefef, border #667eea
```

**Feature Card (Frameworks)**
```
Background: Linear gradient #667eea → #764ba2
Border-radius: 12px
Padding: 20px
Color: white
Min-height: 200px
Hover: translateY(-4px), box-shadow 0 8px 20px rgba(102,126,234,0.4)
```

**Modal / Dialog**
```
Background: white
Border-radius: 8px
Box-shadow: 0 4px 15px rgba(0,0,0,0.1)
Max-width: 600px-800px
Padding: 20px-30px
Overlay: rgba(0,0,0,0.5) backdrop
```

### Badges & Indicators

**Credibility Badge**
```
Padding: 6px 12px
Border-radius: 4px
Font-size: 0.9em
Font-weight: 600
Colors:
  - High: #4caf50 (green)
  - Medium: #ff9800 (orange)
  - Low: #f44336 (red)
```

**Conflict Badge**
```
Background: #ffcdd2
Color: #c62828
Padding: 4px 12px
Border-radius: 12px
Font-size: 0.9em
```

**Method Badge**
```
Background: varies by method
Color: text color varies
Font-size: 0.85em
Icons: 🔬 🎯 📰 ✨
```

---

## Layout Components

### Header
- **Height:** 80px (flexible based on content)
- **Background:** White with shadow `0 4px 15px rgba(0,0,0,0.1)`
- **Logo/Title:** 2.5em, centered, text-shadow
- **Tagline:** 1.1em, opacity 0.9

### Search Form
- **Background:** White
- **Padding:** 20px
- **Border-radius:** 12px
- **Display:** Flex, gap 10px
- **Button Group Gap:** 8px
- **Alignment:** Center items

### Results Panel
- **Background:** White
- **Padding:** 30px
- **Border-radius:** 12px
- **Box-shadow:** 0 4px 15px rgba(0,0,0,0.1)
- **Margin-bottom:** 30px

### Sidebar / Modals
- **Max-height:** 400-600px (content dependent)
- **Overflow-y:** auto (scrollable)
- **Padding:** 16px
- **Gap between items:** 8px

### Progress Indicator
- **Spinner:** CSS animation, 40px size
- **Color:** #667eea
- **Text:** Below spinner, 16px, centered

---

## Interaction & Animation

### Transitions
- **Default:** 0.2s ease
- **Hover states:** 0.2s
- **Page transitions:** 0.3s

### Hover Effects
- **Buttons:** translateY(-2px) + shadow
- **Cards:** background change + border color
- **Links:** text-decoration underline
- **Inputs:** border color change

### Focus States
- **All interactive:** outline none, border-color #667eea
- **Visible focus indicator:** Essential for accessibility

### Loading States
- **Buttons:** opacity 0.6, cursor not-allowed
- **Text:** "Loading..." indicator
- **Spinner:** CSS animation, smooth

---

## Dark Mode (Future)

### Planned Dark Palette
- **Background:** `#1e1e1e`
- **Cards:** `#2d2d2d`
- **Text:** `#e0e0e0`
- **Accent:** `#667eea` (unchanged)
- **Borders:** `#3d3d3d`

Implementation would use:
```css
@media (prefers-color-scheme: dark) {
  /* dark theme variables */
}
```

---

## Tone & Voice

### Language Principles
1. **Clear & Direct:** Avoid jargon, use plain language
   - ❌ "Instantiate a novel research framework"
   - ✅ "Create a custom framework"

2. **Action-Oriented:** Use verbs that describe what happens
   - ✅ "Run Research"
   - ✅ "Add Note"
   - ❌ "Process"

3. **Positive & Encouraging:** Assume user competence
   - ✅ "Claim verified with 2+ sources"
   - ❌ "Claim possibly supported"

4. **Consistent Terminology:** 
   - "Research" not "Search"
   - "Framework" not "Template"
   - "Synthesis" not "Combining"
   - "Claims" not "Assertions"

### UI Text Guidelines

**Buttons:**
- Action verbs (Run, Create, Export, Delete)
- Title case
- 1-3 words max
- Examples: "Run Research", "Add Note", "Synthesize"

**Labels:**
- Descriptive, noun-based
- Sentence case when longer
- Examples: "Research cost", "Sources found", "Claim confidence"

**Error Messages:**
- Explain what went wrong
- Suggest how to fix
- Professional but friendly
- Example: "At least 2 searches required. Select more items to synthesize."

**Tooltips:**
- Brief explanation
- When to hover
- Max 1-2 sentences
- Example: "Verify claims and detect conflicts"

**Empty States:**
- Encourage action
- Explain what content belongs here
- Provide CTA
- Example: "No notes yet. Add one to get started!"

---

## Accessibility Standards

### WCAG 2.1 Compliance
- **Level AA** minimum for all components
- **Contrast Ratios:** 4.5:1 for text, 3:1 for graphics
- **Focus indicators:** Always visible
- **Semantic HTML:** Proper headings, landmarks
- **ARIA labels:** Where needed for clarity

### Color Choices
- Not reliant on color alone (use icons/text)
- High contrast between interactive elements
- Colorblind-safe palette

### Interactive Elements
- Minimum 44×44px touch target
- Keyboard accessible (Tab, Enter, Escape)
- Screen reader friendly (alt text, labels)

---

## Design Assets

### Icons
- **Style:** Emoji (built-in, emoji-based)
- **Usage:** Consistent across similar features
- **Sizes:** 16px, 18px, 24px, 40px

### Patterns Used
- 🔬 Research (Perplexity+Claude)
- 📰 Research (Perplexity-only)
- 🎯 Frameworks
- 📚 History/Sources
- 🔍 Search/Claims
- 📝 Notes
- 📈 Timeline
- ⚠️ Warnings/Conflicts
- ✓ Verified/Success
- 🗑️ Delete

### No Custom Graphics
- Minimalist, text-based design
- System fonts
- Pure CSS styling
- Emoji for visual interest
- Accessibility-first approach

---

## Browser & Device Support

### Tested Browsers
- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile browsers (iOS Safari, Chrome Android)

### Responsive Behavior
- Desktop (1200px+): Full sidebar, multi-column layouts
- Tablet (768-1199px): Adjusted padding, stacked when needed
- Mobile (<768px): Single column, full-width cards, touch-friendly

### Performance Optimization
- No custom fonts (system fonts)
- Minimal CSS (CSS Modules, no bloat)
- No animations on mobile
- Lazy-loaded components
