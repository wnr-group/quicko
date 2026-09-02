# Quiko Design System
## Production-Ready Design Specifications v1.0

**Last Updated**: July 10, 2026  
**Status**: Production Ready  
**Platform**: iOS & Android Mobile Apps

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Icons](#icons)
7. [Animations](#animations)
8. [Patterns](#patterns)
9. [Accessibility](#accessibility)
10. [Developer Handoff](#developer-handoff)

---

## Brand Identity

### Brand Essence
**Quiko** transforms travel into opportunity. We're fast, trustworthy, and sustainable.

**Voice & Tone:**
- Energetic yet professional
- Clear and transparent
- Friendly but not casual
- Empowering

**Personality:**
- ⚡ **Fast** - Every moment matters
- 🤝 **Trustworthy** - Safety first, always
- 🌱 **Sustainable** - Green by design
- 💪 **Empowering** - Turn trips into tips

---

## Color System

### Primary Colors

```
Primary Yellow (Brand)
HEX: #FFD93D
RGB: 255, 217, 61
HSL: 48, 100%, 62%
Usage: CTAs, highlights, success states, brand elements
Accessibility: Use on dark backgrounds only (contrast ratio: 1.6:1 on white - fails WCAG)
```

```
Primary Black (Brand)
HEX: #1A1A1A
RGB: 26, 26, 26
HSL: 0, 0%, 10%
Usage: Text, headers, secondary buttons, backgrounds
Accessibility: AAA rated on white (contrast ratio: 16.9:1)
```

### Neutral Colors (Grayscale)

```
Gray 50 (Backgrounds)
HEX: #FAFAFA
RGB: 250, 250, 250

Gray 100 (Subtle backgrounds)
HEX: #F5F5F5
RGB: 245, 245, 245

Gray 200 (Borders)
HEX: #EEEEEE
RGB: 238, 238, 238

Gray 300 (Borders hover)
HEX: #E0E0E0
RGB: 224, 224, 224

Gray 400 (Disabled)
HEX: #BDBDBD
RGB: 189, 189, 189

Gray 500 (Placeholder)
HEX: #9E9E9E
RGB: 158, 158, 158

Gray 600 (Secondary text)
HEX: #757575
RGB: 117, 117, 117

Gray 700 (Body text)
HEX: #616161
RGB: 97, 97, 97

Gray 800 (Primary text)
HEX: #424242
RGB: 66, 66, 66

Gray 900 (Headings)
HEX: #212121
RGB: 33, 33, 33
```

### Semantic Colors

```
Success Green
HEX: #4CAF50
RGB: 76, 175, 80
Usage: Success messages, completed states, verified badges

Error Red
HEX: #F44336
RGB: 244, 67, 54
Usage: Errors, warnings, destructive actions

Info Blue
HEX: #2196F3
RGB: 33, 150, 243
Usage: Information, neutral notifications

Warning Orange
HEX: #FF9800
RGB: 255, 152, 0
Usage: Warnings, caution states
```

### Color Usage Rules

**DO:**
- Use Primary Yellow on dark backgrounds (black, gray 800+)
- Use Primary Black for text on light backgrounds
- Always check contrast ratios (WCAG AA minimum)
- Use semantic colors consistently

**DON'T:**
- Never use Yellow on white (fails accessibility)
- Don't mix yellow with light grays (low contrast)
- Avoid using red/green together (colorblind users)

### Gradient (Optional Enhancement)

```
Primary Gradient
Background: linear-gradient(135deg, #FFD93D 0%, #FFC107 100%)
Usage: Premium features, celebration screens
```

---

## Typography

### Font Family

**Primary**: System Font Stack (Native)
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 
             'Fira Sans', 'Droid Sans', 'Helvetica Neue', 
             sans-serif;
```

**Why System Fonts?**
- Native feel on iOS and Android
- No web font loading delay
- Better performance
- Automatic right-to-left (RTL) support

### Type Scale

Based on **Major Third (1.250)** ratio for harmonious scaling.

```
Display Large (Hero)
Size: 40px / 2.5rem
Weight: 700 (Bold)
Line Height: 48px (1.2)
Letter Spacing: -0.5px
Usage: Splash screen, celebration pages

Display Medium
Size: 32px / 2rem
Weight: 700 (Bold)
Line Height: 40px (1.25)
Letter Spacing: -0.5px
Usage: Page titles, major headings

Heading 1
Size: 28px / 1.75rem
Weight: 700 (Bold)
Line Height: 36px (1.29)
Letter Spacing: -0.25px
Usage: Screen headers

Heading 2
Size: 24px / 1.5rem
Weight: 600 (Semi-Bold)
Line Height: 32px (1.33)
Letter Spacing: 0
Usage: Section headers

Heading 3
Size: 20px / 1.25rem
Weight: 600 (Semi-Bold)
Line Height: 28px (1.4)
Letter Spacing: 0
Usage: Card titles, subsections

Body Large
Size: 18px / 1.125rem
Weight: 400 (Regular)
Line Height: 28px (1.56)
Letter Spacing: 0
Usage: Large body text, important info

Body Regular
Size: 16px / 1rem
Weight: 400 (Regular)
Line Height: 24px (1.5)
Letter Spacing: 0
Usage: Default body text, form labels

Body Small
Size: 14px / 0.875rem
Weight: 400 (Regular)
Line Height: 20px (1.43)
Letter Spacing: 0
Usage: Secondary info, captions

Caption
Size: 13px / 0.8125rem
Weight: 400 (Regular)
Line Height: 18px (1.38)
Letter Spacing: 0
Usage: Timestamps, metadata

Label Small
Size: 12px / 0.75rem
Weight: 600 (Semi-Bold)
Line Height: 16px (1.33)
Letter Spacing: 0.5px (uppercase)
Usage: Badges, tags, tiny labels

Button Text
Size: 16px / 1rem
Weight: 600 (Semi-Bold)
Line Height: 24px (1.5)
Letter Spacing: 0.25px
Usage: All buttons
```

### Font Weights

```
Regular: 400 - Body text
Medium: 500 - Emphasis (optional, use Semi-Bold instead)
Semi-Bold: 600 - Headings, buttons, labels
Bold: 700 - Major headings, display text
```

### Typography Guidelines

**DO:**
- Use Bold (700) for display text and H1
- Use Semi-Bold (600) for all buttons and smaller headings
- Maintain consistent line height ratios
- Use negative letter-spacing on large text

**DON'T:**
- Don't use more than 3 weights in one screen
- Avoid light weights (300 or below) on mobile
- Don't use all caps except for small labels/badges
- Never go below 12px font size

---

## Spacing & Layout

### Spacing Scale

Based on **8px base unit** for consistent rhythm.

```
Space 0: 0px      - No space
Space 1: 4px      - Tiny gaps (icon-text spacing)
Space 2: 8px      - Small gaps (tight elements)
Space 3: 12px     - Default gaps (list items)
Space 4: 16px     - Standard padding (cards, buttons)
Space 5: 20px     - Medium spacing (sections)
Space 6: 24px     - Large spacing (major sections)
Space 8: 32px     - Extra large (page padding)
Space 10: 40px    - Huge spacing (major breaks)
Space 12: 48px    - Massive spacing (hero sections)
Space 16: 64px    - Ultra spacing (rare)
Space 20: 80px    - Maximum spacing (splash screens)
```

### Layout Grid

**Mobile (320px - 768px):**
```
Container: 100% width
Padding: 20px (Space 5) on sides
Max Width: 100%
Columns: 4 columns (optional, mostly single column)
Gutter: 16px (Space 4)
```

**Tablet (768px+):**
```
Container: 600px max-width
Padding: 32px (Space 8) on sides
Centered
```

### Safe Zones

```
Top Safe Area: 44px (iOS status bar)
Bottom Safe Area: 34px (iOS home indicator)
Side Padding: 20px minimum
Tap Target: 44px × 44px minimum (iOS HIG)
```

### Border Radius

```
Radius XS: 4px   - Small elements (badges)
Radius SM: 8px   - Inputs, small buttons
Radius MD: 12px  - Cards, buttons, containers
Radius LG: 16px  - Large cards, modals
Radius XL: 20px  - Hero sections
Radius 2XL: 24px - Modal corners
Radius Full: 9999px - Pills, circular elements
```

### Elevation (Shadows)

```
Shadow SM (Subtle)
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 
            0 1px 2px rgba(0, 0, 0, 0.08);
Usage: Input fields, subtle cards

Shadow MD (Default)
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 
            0 2px 4px rgba(0, 0, 0, 0.06);
Usage: Cards, buttons (hover)

Shadow LG (Elevated)
box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15), 
            0 4px 8px rgba(0, 0, 0, 0.1);
Usage: Modals, floating elements

Shadow XL (Maximum)
box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), 
            0 10px 20px rgba(0, 0, 0, 0.15);
Usage: Dialogs, overlays
```

---

## Components

### Buttons

#### Primary Button
```
Background: Primary Yellow (#FFD93D)
Text Color: Primary Black (#1A1A1A)
Font: Semi-Bold 16px
Padding: 16px (vertical) × 24px (horizontal)
Border Radius: 12px (Radius MD)
Min Height: 48px (tap target)
Shadow: Shadow MD

States:
- Default: Yellow background
- Hover: Background lighten by 10%
- Active: Scale 0.98, shadow reduces
- Disabled: Opacity 0.5, no interaction
- Loading: Spinner replaces text
```

#### Secondary Button
```
Background: Primary Black (#1A1A1A)
Text Color: Primary Yellow (#FFD93D)
Font: Semi-Bold 16px
Padding: 16px × 24px
Border Radius: 12px
Min Height: 48px
Shadow: None

States:
- Hover: Background lighten to Gray 800
- Active: Scale 0.98
- Disabled: Opacity 0.5
```

#### Outline Button
```
Background: Transparent
Border: 2px solid Primary Yellow
Text Color: Primary Black
Font: Semi-Bold 16px
Padding: 14px × 22px (adjusted for border)
Border Radius: 12px
Min Height: 48px

States:
- Hover: Background Yellow, Text Black
- Active: Scale 0.98
```

#### Text Button
```
Background: None
Text Color: Primary Black
Font: Semi-Bold 16px
Padding: 8px × 12px
Underline on hover
```

#### Icon Button
```
Size: 44px × 44px (circular)
Background: Gray 100 or Yellow
Icon: 20px × 20px
Border Radius: Full (circular)
Center aligned
```

### Cards

#### Standard Card
```
Background: White
Border: 2px solid Gray 200
Border Radius: 16px (Radius LG)
Padding: 20px (Space 5)
Shadow: Shadow SM
Margin Bottom: 16px (Space 4)

Hover State:
- Border Color: Primary Yellow
- Shadow: Shadow MD
- Transform: translateY(-2px)
- Transition: 0.2s ease
```

#### Clickable Card (Interactive)
```
Same as Standard Card, plus:
Cursor: Pointer
Active State: Scale 0.98
Ripple effect on tap (optional)
```

#### Profile Card (Traveler/Sender)
```
Standard Card, plus:
- Header: Name + Rating (Heading 3)
- Badge: Verified (top-right)
- Info Rows: Icon + Text (Body Small)
- Footer: CTA Button (Primary Small)
```

### Form Elements

#### Text Input
```
Background: White
Border: 2px solid Gray 300
Border Radius: 12px (Radius MD)
Padding: 14px (Space 3.5)
Font: Regular 16px (Body Regular)
Min Height: 48px
Placeholder Color: Gray 500

States:
- Focus: Border Primary Yellow, outline none
- Error: Border Error Red, helper text red
- Disabled: Background Gray 100, opacity 0.6
- Success: Border Success Green (optional)
```

#### Label
```
Font: Semi-Bold 14px (Body Small)
Color: Primary Black
Margin Bottom: 8px (Space 2)
Display: Block
```

#### Helper Text
```
Font: Regular 13px (Caption)
Color: Gray 600
Margin Top: 6px
```

#### Select Dropdown
```
Same as Text Input, plus:
- Dropdown Arrow: 12px × 12px chevron (right aligned)
- Padding Right: 40px (space for arrow)
- Options Menu: White bg, Shadow LG, Radius MD
```

#### Checkbox
```
Size: 20px × 20px
Border: 2px solid Gray 400
Border Radius: 4px (Radius XS)
Checked: Background Yellow, White checkmark
Spacing: 12px from label text
```

#### Radio Button
```
Size: 20px × 20px
Border: 2px solid Gray 400
Border Radius: Full (circular)
Selected: Yellow dot (10px) inside
Spacing: 12px from label text
```

#### Slider (Range)
```
Track: Height 6px, Gray 300 background, Radius Full
Thumb: 24px × 24px circle, Yellow, Shadow MD
Active Track: Yellow fill
```

### Navigation

#### Header Bar
```
Height: 60px (56px content + 4px shadow)
Background: Primary Yellow
Padding: 12px 20px
Display: Flex (space-between, center aligned)
Shadow: Shadow SM
Position: Sticky (top: 0)

Left: Back button (44px × 44px)
Center: Title (Heading 3, Black)
Right: Action button or icon
```

#### Bottom Navigation (Optional)
```
Height: 64px (+ safe area)
Background: White
Border Top: 1px solid Gray 200
Shadow: Shadow MD (inverted, top shadow)
Position: Fixed (bottom: 0)

Items: 3-5 items
- Icon: 24px × 24px
- Label: Caption (12px)
- Active: Yellow icon + label
- Inactive: Gray 600
```

#### Back Button
```
Icon: Chevron left (24px)
Size: 44px × 44px
Background: Transparent
Color: Primary Black
Tap Area: Full 44px (larger than icon)
```

### Lists

#### List Item
```
Padding: 16px 20px
Border Bottom: 1px solid Gray 200
Display: Flex (space-between)
Min Height: 64px
Background: White

Hover/Press: Background Gray 100
Active: Background Gray 200 (brief)
```

#### Info Row (Icon + Text)
```
Display: Flex (align center)
Gap: 12px (Space 3)
Font: Body Small (14px)
Color: Gray 700

Icon: 20px × 20px, Gray 600
Text: Regular weight
```

### Badges & Tags

#### Badge (Status)
```
Background: Yellow or Green or Gray
Color: Black or White (contrast dependent)
Padding: 4px 12px
Border Radius: 12px (Radius MD, pill shape)
Font: Label Small (12px Semi-Bold, uppercase)
Display: Inline-flex (center aligned)
```

Types:
- Verified: Green background, White text
- New: Yellow background, Black text
- Premium: Black background, Yellow text

#### Tag (Category)
```
Background: Gray 100
Color: Gray 700
Border: 1px solid Gray 300
Padding: 6px 12px
Border Radius: 8px (Radius SM)
Font: Caption (13px Regular)
Display: Inline-flex
```

### Modals & Overlays

#### Modal
```
Background: White
Border Radius: 24px (top corners only)
Padding: 24px
Max Height: 90vh
Overflow: Auto

Backdrop: rgba(0, 0, 0, 0.5)
Animation: Slide up from bottom
```

#### Toast Notification
```
Background: Gray 900 (dark) or White (light)
Color: White (dark) or Gray 900 (light)
Padding: 16px 20px
Border Radius: 12px
Shadow: Shadow LG
Max Width: 90%
Position: Fixed (top or bottom)
Animation: Slide in + fade out
Duration: 3 seconds
```

### Chat

#### Message Bubble (Sent)
```
Background: Primary Yellow
Color: Primary Black
Padding: 12px 16px
Border Radius: 16px
Border Bottom Right Radius: 4px (speech bubble effect)
Max Width: 70%
Align: Right
Font: Body Regular (16px)
```

#### Message Bubble (Received)
```
Background: Gray 100
Color: Primary Black
Padding: 12px 16px
Border Radius: 16px
Border Bottom Left Radius: 4px
Max Width: 70%
Align: Left
Font: Body Regular (16px)
```

#### Quick Reply Button
```
Background: Gray 100
Color: Gray 700
Padding: 8px 16px
Border Radius: 20px (pill)
Font: Caption (13px)
Display: Inline-flex
Margin: 4px

Hover: Background Gray 200
Active: Background Yellow
```

### OTP Input

```
Input Box Size: 56px × 56px
Border: 2px solid Gray 300
Border Radius: 12px
Font: Bold 24px
Text Align: Center
Gap: 12px (Space 3) between boxes

Focus: Border Yellow
Filled: Border Black, background Gray 50
```

### Rating Stars

```
Star Size: 40px × 40px
Color Inactive: Gray 300
Color Active: Primary Yellow
Gap: 8px (Space 2)
Interactive: Tap to select
Animation: Scale on tap
```

---

## Icons

### Icon System

**Source**: Use emoji or icon library (Lucide React, Heroicons)

**Sizes:**
```
Icon XS: 16px × 16px - Inline with text
Icon SM: 20px × 20px - Info rows, list items
Icon MD: 24px × 24px - Buttons, nav items
Icon LG: 32px × 32px - Headers, emphasis
Icon XL: 48px × 48px - Empty states
Icon 2XL: 64px × 64px - Hero sections
Icon 3XL: 80px × 80px - Celebration screens
```

### Icon Usage

**Navigation:**
- Back: Chevron Left
- Forward: Chevron Right
- Close: X
- Menu: Hamburger (3 lines)
- Search: Magnifying glass
- Filter: Funnel

**Actions:**
- Add: Plus
- Remove: Minus
- Edit: Pencil
- Delete: Trash
- Share: Share arrow
- Download: Download arrow
- Upload: Upload arrow
- Call: Phone
- Message: Chat bubble

**Status:**
- Success: Checkmark in circle
- Error: X in circle
- Warning: Exclamation in triangle
- Info: i in circle
- Loading: Spinner

**Core Features:**
- Package: 📦 Box
- Location: 📍 Pin
- Calendar: 📅
- Time: ⏰ Clock
- Weight: ⚖️ Scale
- Dimensions: 📏 Ruler
- Money: 💰 or ₹
- Rating: ⭐ Star
- Profile: 👤 Person
- Verified: ✓ Checkmark

**Transport:**
- Flight: ✈️
- Train: 🚂
- Bus: 🚌
- Car: 🚗

### Icon Guidelines

**DO:**
- Use consistent icon set (one library)
- Maintain 1:1 aspect ratio
- Use same stroke width (2px recommended)
- Align icons vertically with text

**DON'T:**
- Mix icon styles (outline + filled)
- Use icons below 16px
- Overcrowd screen with icons
- Use icons without labels (except common actions)

---

## Animations

### Timing Functions

```
Ease Out (Default): cubic-bezier(0.4, 0, 0.2, 1)
Usage: Elements appearing, expanding

Ease In: cubic-bezier(0.4, 0, 1, 1)
Usage: Elements disappearing, collapsing

Ease In Out: cubic-bezier(0.4, 0, 0.2, 1)
Usage: Smooth transitions

Spring: cubic-bezier(0.175, 0.885, 0.32, 1.275)
Usage: Playful animations (match celebration)
```

### Duration

```
Fast: 150ms - Micro-interactions (hover, focus)
Normal: 250ms - Default transitions (page changes)
Slow: 400ms - Complex animations (modals)
Very Slow: 600ms - Hero animations (splash screen)
```

### Animation Patterns

#### Page Transition
```
Type: Slide + Fade
From: translateX(20px), opacity 0
To: translateX(0), opacity 1
Duration: 250ms
Easing: Ease Out
```

#### Modal Enter
```
Type: Slide Up + Fade
From: translateY(100%), opacity 0
To: translateY(0), opacity 1
Duration: 300ms
Easing: Ease Out
Backdrop: Fade in (200ms)
```

#### Button Press
```
Type: Scale
Active: scale(0.98)
Duration: 150ms
Easing: Ease Out
```

#### Card Hover
```
Type: Lift + Shadow
Transform: translateY(-2px)
Shadow: Increase elevation
Duration: 200ms
Easing: Ease Out
```

#### Match Celebration
```
Type: Scale + Bounce
From: scale(0)
To: scale(1)
Duration: 600ms
Easing: Spring
Additional: Confetti or particles (optional)
```

#### Loading Spinner
```
Type: Rotate
Rotation: 360deg continuous
Duration: 1000ms
Easing: Linear
```

#### Skeleton Loading
```
Type: Shimmer
Background: Linear gradient moving left to right
Colors: Gray 200 → Gray 100 → Gray 200
Duration: 1500ms
Easing: Ease In Out
Loop: Infinite
```

### Animation Guidelines

**DO:**
- Keep animations subtle and purposeful
- Use consistent durations across similar actions
- Respect reduced motion preferences
- Test on low-end devices

**DON'T:**
- Animate too many elements at once
- Use long durations (>600ms) for common actions
- Add animation just for decoration
- Forget to disable animations in reduced-motion mode

---

## Patterns

### Empty States

```
Layout:
- Icon (Icon 2XL, 64px, gray)
- Heading (Heading 2, "No packages yet")
- Description (Body Small, gray)
- CTA Button (Primary, "Create Posting")

Spacing:
- Icon to Heading: 16px
- Heading to Description: 8px
- Description to Button: 24px

Alignment: Center
Padding: 60px 20px
```

### Loading States

**Skeleton Screen (Preferred):**
- Replace content with gray rectangles
- Animate shimmer effect
- Maintain layout dimensions
- Show for <500ms loads

**Spinner:**
- Use for actions <2 seconds
- Center in container
- Size: 40px × 40px
- Color: Primary Yellow or Gray

### Error States

```
Layout:
- Icon (Error icon, 48px, red)
- Heading (Heading 3, "Something went wrong")
- Message (Body Small, describe error)
- Retry Button (Primary, "Try Again")

Colors:
- Icon: Error Red
- Text: Gray 700
- Background: White or light red tint

Spacing: Similar to empty state
```

### Success Confirmation

```
Layout:
- Icon (Checkmark, 80px, green, animated scale-in)
- Heading (Heading 2, "Success!")
- Message (Body Regular, confirm action)
- Continue Button (Primary)

Animation:
- Icon: Scale in with bounce
- Content: Fade in delayed
- Auto-dismiss after 3s (optional)
```

### Search/Filter

```
Search Bar:
- Full width input
- Search icon (left, 20px)
- Clear button (right, when typing)
- Debounce: 300ms

Filters:
- Pill buttons (horizontal scroll)
- Active: Yellow background
- Inactive: Gray background
- Count badge (optional)
```

### Pagination/Infinite Scroll

**Infinite Scroll (Recommended for mobile):**
- Load more on scroll to bottom
- Show loading spinner at bottom
- Maintain scroll position on back navigation

**Pagination:**
- Show "Load More" button
- Display count: "Showing 10 of 45"
- Simple prev/next arrows

---

## Accessibility

### WCAG 2.1 Level AA Compliance

#### Color Contrast

**Text Contrast:**
- Large Text (≥18px regular or ≥14px bold): Minimum 3:1
- Normal Text: Minimum 4.5:1
- Interactive Elements: Minimum 3:1

**Our Compliance:**
- ✅ Black on White: 16.9:1 (AAA)
- ✅ Gray 700 on White: 7.9:1 (AAA)
- ✅ Gray 600 on White: 5.9:1 (AA)
- ❌ Yellow on White: 1.6:1 (FAILS - never use)
- ✅ Yellow on Black: 13.1:1 (AAA)
- ✅ Black on Yellow: 13.1:1 (AAA)

#### Touch Targets

**Minimum Size:**
- 44px × 44px (iOS HIG)
- 48dp × 48dp (Android Material)
- We use: **48px × 48px** minimum

**Spacing:**
- Minimum 8px gap between tap targets
- Recommended: 12px gap

#### Focus States

**Keyboard Navigation:**
- Visible focus indicator (2px Yellow outline)
- Logical tab order (top to bottom, left to right)
- Skip links for main content

**Focus Indicator:**
```
outline: 2px solid Primary Yellow
outline-offset: 2px
border-radius: inherit
```

#### Screen Reader Support

**Semantic HTML:**
- Use proper heading hierarchy (h1 → h2 → h3)
- Label all form inputs
- Use `<button>` for interactive elements
- Add alt text to images

**ARIA Labels:**
```
aria-label: Descriptive action name
aria-labelledby: Reference to label element
aria-describedby: Additional context
role: Button, navigation, dialog, etc.
```

**Live Regions:**
```
aria-live: polite | assertive
aria-atomic: true (announce entire region)
role: alert | status
```

#### Motion Sensitivity

**Respect Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Color Blindness

**Don't Rely on Color Alone:**
- Use icons + text labels
- Error states: Red + X icon + text
- Success states: Green + checkmark + text
- Info states: Icon + text

**Safe Color Combinations:**
- Avoid red/green only (use yellow/blue instead)
- Ensure sufficient contrast
- Use patterns/textures when needed

---

## Developer Handoff

### Design Tokens (Tailwind Config)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      yellow: {
        DEFAULT: '#FFD93D',
        50: '#FFF9E6',
        100: '#FFF3CC',
      },
      black: {
        DEFAULT: '#1A1A1A',
      },
      gray: {
        50: '#FAFAFA',
        100: '#F5F5F5',
        // ... full scale
      },
      green: '#4CAF50',
      red: '#F44336',
      blue: '#2196F3',
      orange: '#FF9800',
    },
    spacing: {
      0: '0',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      8: '32px',
      10: '40px',
      12: '48px',
      16: '64px',
      20: '80px',
    },
    fontSize: {
      'xs': ['12px', { lineHeight: '16px' }],
      'sm': ['13px', { lineHeight: '18px' }],
      'base': ['14px', { lineHeight: '20px' }],
      'md': ['16px', { lineHeight: '24px' }],
      'lg': ['18px', { lineHeight: '28px' }],
      'xl': ['20px', { lineHeight: '28px' }],
      '2xl': ['24px', { lineHeight: '32px' }],
      '3xl': ['28px', { lineHeight: '36px' }],
      '4xl': ['32px', { lineHeight: '40px' }],
      '5xl': ['40px', { lineHeight: '48px' }],
    },
    borderRadius: {
      'xs': '4px',
      'sm': '8px',
      'md': '12px',
      'lg': '16px',
      'xl': '20px',
      '2xl': '24px',
      'full': '9999px',
    },
  }
}
```

### Component Props

**Button Component:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'text'
  size: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  onClick: () => void
  children: React.ReactNode
}
```

**Card Component:**
```typescript
interface CardProps {
  clickable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
}
```

### Responsive Breakpoints

```javascript
// Tailwind breakpoints
screens: {
  'sm': '640px',   // Mobile landscape
  'md': '768px',   // Tablet portrait
  'lg': '1024px',  // Tablet landscape
  'xl': '1280px',  // Desktop
}

// But Quiko is mobile-first, so mainly use:
// Default: 320px - 640px (mobile)
// md: 640px+ (tablet)
```

### File Naming Conventions

```
Components:
- PascalCase: Button.tsx, PackageCard.tsx
- Co-locate styles: Button.module.css (if needed)
- Stories: Button.stories.tsx (Storybook)

Pages:
- kebab-case: create-package.tsx, browse-travelers.tsx

Utilities:
- camelCase: formatPrice.ts, calculateDistance.ts

Constants:
- SCREAMING_SNAKE_CASE: API_ENDPOINTS.ts, ROUTES.ts
```

### Git Commit Convention

```
feat: Add pickup confirmation screen
fix: Correct pricing formula calculation
style: Update button border radius
refactor: Simplify chat message component
docs: Add component usage examples
test: Add unit tests for price calculator
```

### Code Quality

**ESLint + Prettier:**
- Max line length: 100
- Semi-colons: Yes
- Quotes: Single
- Trailing comma: es5
- Tab width: 2 spaces

**TypeScript:**
- Strict mode enabled
- No implicit any
- Interface over type (for objects)

---

## Version History

**v1.0 - July 10, 2026**
- Initial design system
- Complete component library
- Accessibility guidelines
- Developer handoff specs

---

## Credits & Tools

**Design Tools:**
- Figma (recommended for design)
- Adobe XD (alternative)
- Sketch (Mac only)

**Development:**
- React / Next.js
- Tailwind CSS
- Framer Motion (animations)
- Shadcn UI (component library)
- Lucide Icons

**Testing:**
- Lighthouse (accessibility audit)
- WAVE (accessibility checker)
- Axe DevTools (a11y testing)

---

*This design system is a living document. Update as the product evolves.*

**Questions?** Refer to PRODUCT_SPEC.md and DESIGN_DECISIONS.md for context.
