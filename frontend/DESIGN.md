---
name: Vital Response System
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#59413d'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#8d706c'
  outline-variant: '#e1bfb9'
  surface-tint: '#b02d21'
  primary: '#9e2016'
  on-primary: '#ffffff'
  primary-container: '#c0392b'
  on-primary-container: '#ffe5e1'
  inverse-primary: '#ffb4a9'
  secondary: '#b4271d'
  on-secondary: '#ffffff'
  secondary-container: '#fe5c4a'
  on-secondary-container: '#610001'
  tertiary: '#005f2f'
  on-tertiary: '#ffffff'
  tertiary-container: '#007a3e'
  on-tertiary-container: '#a1ffb8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4a9'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#8e130c'
  secondary-fixed: '#ffdad5'
  secondary-fixed-dim: '#ffb4a9'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#910807'
  tertiary-fixed: '#7efba4'
  tertiary-fixed-dim: '#61de8a'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005228'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is centered on the intersection of medical urgency and human empathy. It is designed for a mobile-first environment where clarity saves lives. The brand personality is **authoritative yet approachable**, stripping away the cold, clinical feel of traditional healthcare software in favor of a warm, reliable, and highly efficient interface.

The visual style follows a **Corporate / Modern** approach with a focus on high-clarity minimalism. It prioritizes information density for quick scanning during emergencies while using generous whitespace to reduce cognitive load. The emotional response should be one of calm confidence—reassuring the user that the coordination is under control.

## Colors

This color palette utilizes a high-contrast red-base to signify the critical nature of blood donation without inducing panic. 

- **Primary (#C0392B):** Used for the most critical actions (e.g., "Donate Now," "Confirm Emergency"). It provides the professional "anchor" for the brand.
- **Secondary (#E74C3C):** A more vibrant red used for accents, active states in navigation, and urgent alert icons to draw the eye immediately.
- **Surface/Cards (#FFF5F5):** A warm, tinted white used to distinguish content containers from the pure white background without the harshness of cold grays.
- **Success/Warning:** Standard semantic colors are used for status updates (e.g., "Donation Completed" or "Pending Verification").

## Typography

The design system utilizes **Inter** for its exceptional legibility on mobile screens and its neutral, systematic character. 

Headlines use a bold weight with slightly tighter letter-spacing to create a sense of importance and "news" urgency. Body text is set with generous line-height to ensure readability for users who may be in high-stress situations. Labels are used for metadata (e.g., blood types, distances, and timestamps) to provide a clear information hierarchy.

## Layout & Spacing

The layout follows a **fluid grid** model optimized for mobile devices. It utilizes a 4-column grid for mobile and a 12-column grid for tablet/desktop views. 

The spacing rhythm is based on a **4px baseline**, ensuring all elements align to a consistent mathematical scale. 
- **Margins:** Standard 16px lateral margins on mobile to maximize horizontal real estate while maintaining "breathability."
- **Gutters:** 16px gutters between cards and list items to ensure clear visual separation.
- **Stacking:** Vertical spacing between disparate sections should use 32px (xl) to indicate a shift in context.

## Elevation & Depth

This design system uses **Tonal Layers** combined with **Ambient Shadows** to create a sense of physical space. Depth is functional, not decorative:

- **Level 0 (Background):** Pure White (#FFFFFF).
- **Level 1 (Cards/Surfaces):** Very Light Pink (#FFF5F5). These elements sit flush or have a 1px border (#FADBD8) in flat states.
- **Level 2 (Active/Floating):** Use a soft, diffused shadow (0px 4px 12px, 8% opacity of the Primary Red) to lift critical elements like the "Request Help" button or active emergency cards above the base layer.
- **Overlays:** Modals and bottom sheets use a 40% opacity neutral backdrop to pull focus entirely to the interaction.

## Shapes

The shape language is **Rounded**, designed to feel friendly and modern. 

- **Containers (Cards/Modals):** Use `rounded-xl` (24px on mobile) for large surface areas to soften the professional tone.
- **Primary Buttons:** Use `rounded-lg` (16px) to create a distinct, touch-friendly target.
- **Inputs & Small Components:** Use 8px (standard base) to maintain a structured, organized feel for data entry.
- **Icons:** Should follow a rounded-corner style to match the UI components.

## Components

### Buttons
- **Primary:** Solid Deep Crimson (#C0392B) with white text. High-contrast, bold weight.
- **Secondary:** Outline version of Primary or a solid white button with Primary text for use on tinted surfaces.
- **Urgent CTA:** Uses a slight pulse animation or a heavier shadow to indicate immediate action is required.

### Cards (Donation/Emergency Requests)
- Cards use the Surface color (#FFF5F5) with a 1px soft red stroke. 
- Information is stacked: Blood Type (Top Left, Large Label), Distance (Top Right, Small Label), and Location/Time in the body.

### Inputs
- Fields use an 8px radius with a subtle 1px border. When focused, the border shifts to Primary Red with a soft glow (2px spread).

### Chips & Status Indicators
- **Blood Type Chips:** Bold, high-contrast badges using Secondary Red.
- **Status Pills:** Use green (#27AE60) for "Available" or "Confirmed" and Amber (#F39C12) for "In Transit" or "Pending."

### List Items
- Clean, tight rows with 16px padding. Use thin separators (1px, #EEEEEE) and chevron-right icons to indicate drill-down navigation, mimicking standard mobile messaging patterns for familiarity.
