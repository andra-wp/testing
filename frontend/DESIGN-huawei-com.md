---
name: Huawei
url: https://huawei.com
colors:
  primary: '#c7000b'
  primary-hover: '#e02128'
  primary-active: '#e02128'
  primary-disabled: 'rgba(231, 67, 74, 0.6)' # from dark mode brand-disabled
  background: '#ffffff'
  background-light: '#f3f3f3'
  background-subtle: '#eeeeee'
  background-dark: '#000000'
  text-primary: '#333333'
  text-secondary: '#595757'
  text-dark: '#191919'
  text-muted: '#666666'
  text-subtle: '#777777'
  text-placeholder: '#aeaeae'
  text-inverse: '#ffffff'
  text-disabled: '#999999' # inferred from common disabled text color
  border: '#e6e6e6'
  border-separator: '#f3f3f3'
  surface: '#f3f3f3'
  surface-hover: 'rgba(25, 25, 25, 0.05)' # from --hwp-color-fill-hover
  dark-background: '#000000'
  dark-text: '#f3f3f3'
  dark-border: '#777777'
typography:
  display:
    family: 'HuaweiSans-Bold, sans-serif'
    size: 48px
    weight: 600
    line-height: 1.1
  heading-xl:
    family: 'HuaweiSans-Bold, sans-serif'
    size: 36px
    weight: 400
    line-height: 1.2
  heading-lg:
    family: 'HuaweiSans-Bold, sans-serif'
    size: 30px
    weight: 400
    line-height: 1.2
  heading-md:
    family: 'HuaweiSans-Bold, sans-serif'
    size: 24px
    weight: 400
    line-height: 1.2
  body:
    family: 'HuaweiSans-Regular, sans-serif'
    size: 16px
    weight: 400
    line-height: 1.5
  small:
    family: 'HuaweiSans-Regular, sans-serif'
    size: 14px
    weight: 400
    line-height: 1.5
  caption:
    family: 'HuaweiSans-Regular, sans-serif'
    size: 12px
    weight: 400
    line-height: 1.5
  code:
    family: 'monospace'
    size: 13px
    weight: 400
    line-height: 1.5
spacing:
  base: 4px
  scale: [4, 8, 12, 16, 20, 24, 32, 48, 64, 80, 128]
radius:
  xs: 4px
  sm: 6px
  md: 16px
  full: 9999px
elevation:
  card: '0 1px 6px 0 rgba(0,0,0,0.08)'
  hover: '0 8px 24px 0 rgba(0,0,0,0.08)'
motion:
  duration-base: '0.2s'
  easing-standard: 'cubic-bezier(0.25, 1, 0.5, 1)' # inferred from common ease-out
components:
  button-primary:
    bg: '{colors.primary}'
    text: '{colors.text-inverse}'
    radius: '{radius.sm}'
    padding: '10px 24px'
  card:
    bg: '{colors.surface}'
    radius: '{radius.md}'
    shadow: '{elevation.card}'
---

# Design System Inspired by Huawei

## 1. Visual Theme & Atmosphere

Huawei's design system is characterized by a clean, professional aesthetic, leveraging a stark `#c7000b` red as its primary accent against a predominantly `#ffffff` and `#f3f3f3` neutral background. Large, impactful imagery and autoplay video elements are used to convey product innovation and brand stories, often featuring human subjects or product shots like the Huawei Watch GT 7 Pro. Typography, primarily set in `HuaweiSans-Bold` and `HuaweiSans-Regular`, maintains a clear hierarchy, with display text reaching `48px` to command attention.

The layout emphasizes structured content blocks with generous `32px` to `48px` vertical spacing, often presented within cards featuring a `16px` border-radius and subtle `0 1px 6px 0 rgba(0,0,0,0.08)` shadows. Interactive elements, such as links and buttons, utilize the brand red for hover states, providing clear feedback. The overall impression is one of technological leadership and accessibility, with a focus on clear communication and engaging visual storytelling.

**Key Characteristics**:
-   **Primary Red Accent**: `#c7000b` for key interactive elements.
-   **Clean Neutral Palette**: Dominant `#ffffff` and `#f3f3f3` backgrounds.
-   **Bold Typography**: `HuaweiSans-Bold` for headings, `48px` display size.
-   **Rounded Cards**: `16px` border-radius with soft `0 1px 6px 0 rgba(0,0,0,0.08)` shadows.
-   **Ample Whitespace**: `32px` to `48px` vertical padding between sections.
-   **Video Integration**: Autoplay video elements for dynamic content.
-   **Subtle Interactions**: Color changes on hover for links and buttons.

## 2. Color Palette & Roles

Huawei's color system is built around a vibrant primary red, supported by a comprehensive neutral scale for text and backgrounds, and specific interactive states.

-   **Primary**
    -   **Primary** (`#c7000b`) — The core brand red, used for primary calls-to-action, active states, and accent text.
    -   **Primary Hover** (`#e02128`) — A slightly darker shade of red, used for hover states on primary interactive elements.
    -   **Primary Active** (`#e02128`) — The active state color for primary interactive elements, matching the hover state.
    -   **Primary Disabled** (`rgba(231, 67, 74, 0.6)`) — A semi-transparent, desaturated red for disabled primary elements, ensuring visibility without being interactive.

-   **Neutral Scale**
    -   **Background** (`#ffffff`) — The main page background color, providing a clean canvas.
    -   **Background Light** (`#f3f3f3`) — Used for secondary background areas and content sections, offering subtle visual separation.
    -   **Background Subtle** (`#eeeeee`) — A very light gray for minor background variations or dividers.
    -   **Background Dark** (`#000000`) — Used for dark mode backgrounds or specific dark sections and overlays.
    -   **Text Primary** (`#333333`) — The default color for main body text and headings, offering high contrast.
    -   **Text Secondary** (`#595757`) — Used for secondary information, subheadings, or less prominent text.
    -   **Text Dark** (`#191919`) — A darker text shade used for specific headings or high-emphasis text.
    -   **Text Muted** (`#666666`) — For less critical information, captions, or supplementary text.
    -   **Text Subtle** (`#777777`) — Used for very subtle text, such as timestamps or meta-information. Also used for dark mode borders.
    -   **Text Placeholder** (`#aeaeae`) — The color for placeholder text in input fields.
    -   **Text Inverse** (`#ffffff`) — Used for text displayed on dark or primary-colored backgrounds.
    -   **Text Disabled** (`#999999` (inferred from screenshot)) — For disabled text elements, indicating non-interactivity.

-   **Surface & Borders**
    -   **Border** (`#e6e6e6`) — A light gray for borders around interactive elements, inputs, and structural components.
    -   **Border Separator** (`#f3f3f3`) — Used for subtle horizontal or vertical dividers.
    -   **Surface** (`#f3f3f3`) — The background color for cards and content containers.
    -   **Surface Hover** (`rgba(25, 25, 25, 0.05)`) — A very subtle dark overlay for hover states on cards or clickable surfaces.

-   **Dark Mode Pairings**
    -   **Dark Background** (`#000000`) — The primary background for dark mode.
    -   **Dark Text** (`#f3f3f3`) — The default text color when displayed on a dark background.
    -   **Dark Border** (`#777777`) — Border color for elements within a dark theme.

## 3. Typography Rules

-   **Font Family**:
    -   Primary: `HuaweiSans-Regular`, `sans-serif`
    -   Headings: `HuaweiSans-Bold`, `sans-serif`
    -   Monospace: `monospace`

-   **Hierarchy**:
    -   **Display**: `HuaweiSans-Bold` `48px` `600` · line-height `1.1` · tracking `normal` · Used for hero headlines and impactful statements.
    -   **Heading XL**: `HuaweiSans-Bold` `36px` `400` · line-height `1.2` · tracking `normal` · Main section titles and prominent content headings.
    -   **Heading LG**: `HuaweiSans-Bold` `30px` `400` · line-height `1.2` · tracking `normal` · Secondary section titles and important subheadings.
    -   **Heading MD**: `HuaweiSans-Bold` `24px` `400` · line-height `1.2` · tracking `normal` · Card titles and significant content blocks.
    -   **Body**: `HuaweiSans-Regular` `16px` `400` · line-height `1.5` · tracking `normal` · Standard paragraph text and most content.
    -   **Small**: `HuaweiSans-Regular` `14px` `400` · line-height `1.5` · tracking `normal` · Used for auxiliary information, navigation links, and form labels.
    -   **Caption**: `HuaweiSans-Regular` `12px` `400` · line-height `1.5` · tracking `normal` · Timestamps, legal text, and minor annotations.
    -   **Code/Mono**: `monospace` `13px` `400` · line-height `1.5` · tracking `normal` · For code snippets or technical representations.

-   **Principles**
    -   **Clarity and Readability**: Prioritize `HuaweiSans-Regular` at `16px` with a `1.5` line-height for all body text to ensure optimal readability on diverse screens.
    -   **Hierarchical Emphasis**: Utilize `HuaweiSans-Bold` and varying font sizes from `48px` down to `12px` to establish a clear visual hierarchy, guiding users through content.
    -   **Brand Consistency**: Maintain the brand's distinct typographic voice by exclusively using `HuaweiSans` for all primary content and headings, with `sans-serif` as a robust fallback.
    -   **Controlled Contrast**: Ensure sufficient contrast for all text elements, particularly `text-primary` (`#333333`) on `background` (`#ffffff`), which achieves a `12.63:1` ratio, passing AAA.

## 4. Component Stylings

### Buttons

Huawei buttons are designed for clear interaction, using the brand red for primary actions and subtle outlines for secondary ones. All buttons include smooth `0.2s` transitions for state changes.

#### Primary Button

A bold, red button for key calls-to-action, providing strong visual emphasis. On hover, it slightly darkens, and when active, it maintains this darker shade.

```css
.btn-primary {
  background-color: var(--color-primary, #c7000b);
  color: var(--color-text-inverse, #ffffff);
  font-family: var(--typography-body-family, 'HuaweiSans-Regular', sans-serif);
  font-size: var(--typography-small-size, 14px);
  font-weight: var(--typography-body-weight, 400);
  padding: 10px 24px; /* inferred from screenshot */
  border: none;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: background-color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1)),
              box-shadow var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1));
}

.btn-primary:hover {
  background-color: var(--color-primary-hover, #e02128);
}

.btn-primary:active {
  background-color: var(--color-primary-active, #e02128);
}

.btn-primary:disabled {
  background-color: var(--color-primary-disabled, rgba(231, 67, 74, 0.6)); /* inferred from dark mode brand-disabled */
  cursor: not-allowed;
  opacity: 0.7; /* inferred from screenshot */
}
```


<details>
<summary>Secondary Button</summary>

A button with a clear border, typically used for less critical actions or as an alternative to the primary button. Its background subtly lightens on hover.

```css
.btn-secondary {
  background-color: transparent;
  color: var(--color-text-primary, #333333);
  font-family: var(--typography-body-family, 'HuaweiSans-Regular', sans-serif);
  font-size: var(--typography-small-size, 14px);
  font-weight: var(--typography-body-weight, 400);
  padding: 10px 24px; /* inferred from screenshot */
  border: 1px solid var(--color-text-primary, #333333);
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: background-color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1)),
              color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1)),
              border-color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1));
}

.btn-secondary:hover {
  background-color: var(--color-surface-hover, rgba(25, 25, 25, 0.05));
  border-color: var(--color-primary, #c7000b); /* inferred from screenshot */
  color: var(--color-primary, #c7000b); /* inferred from screenshot */
}

.btn-secondary:active {
  background-color: var(--color-surface-hover, rgba(25, 25, 25, 0.05));
  border-color: var(--color-primary-active, #e02128); /* inferred from screenshot */
  color: var(--color-primary-active, #e02128); /* inferred from screenshot */
}

.btn-secondary:disabled {
  color: var(--color-text-disabled, #999999);
  border-color: var(--color-text-disabled, #999999);
  cursor: not-allowed;
  opacity: 0.7; /* inferred from screenshot */
}
```

</details>

<details>
<summary>Ghost Button</summary>

A text-only button, often used for navigation or less prominent actions. Its text color changes to the primary red on hover.

```css
.btn-ghost {
  background-color: transparent;
  color: var(--color-text-primary, #333333);
  font-family: var(--typography-body-family, 'HuaweiSans-Regular', sans-serif);
  font-size: var(--typography-small-size, 14px);
  font-weight: var(--typography-body-weight, 400);
  padding: 8px 12px; /* inferred from screenshot */
  border: none;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1));
}

.btn-ghost:hover {
  color: var(--color-primary, #c7000b);
}

.btn-ghost:active {
  color: var(--color-primary-active, #e02128);
}

.btn-ghost:disabled {
  color: var(--color-text-disabled, #999999);
  cursor: not-allowed;
  opacity: 0.7; /* inferred from screenshot */
}
```

</details>
### Cards & Containers

Cards are used to group related content, featuring rounded corners and subtle shadows. On hover, their shadow deepens to indicate interactivity.

#### Standard Card

A versatile container for content, news items, or product showcases. It has a `16px` border-radius and a light shadow, which expands on hover.

```css
.card {
  background-color: var(--color-surface, #f3f3f3);
  border-radius: var(--radius-md, 16px);
  box-shadow: var(--elevation-card, 0 1px 6px 0 rgba(0,0,0,0.08));
  padding: 24px; /* inferred from screenshot */
  transition: box-shadow var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1));
}

.card:hover {
  box-shadow: var(--elevation-hover, 0 8px 24px 0 rgba(0,0,0,0.08));
}
```

### Inputs & Forms

Input elements are clean and functional, with clear focus states to enhance accessibility.

#### Text Input

A standard text input field with a light border and subtle `4px` border-radius. When focused, the border highlights in the primary red, and a `2px` outline appears.

```css
.input-text {
  background-color: var(--color-background, #ffffff);
  color: var(--color-text-primary, #333333);
  font-family: var(--typography-body-family, 'HuaweiSans-Regular', sans-serif);
  font-size: var(--typography-body-size, 16px);
  font-weight: var(--typography-body-weight, 400);
  padding: 8px 12px; /* inferred from screenshot */
  border: 1px solid var(--color-border, #e6e6e6);
  border-radius: var(--radius-xs, 4px);
  transition: border-color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1)),
              box-shadow var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1));
}

.input-text::placeholder {
  color: var(--color-text-placeholder, #aeaeae);
}

.input-text:focus {
  border-color: var(--color-primary, #c7000b);
  outline: 2px solid var(--color-primary, #c7000b); /* inferred from pseudoStates for .hwp-link:focus-visible */
  outline-offset: 2px; /* inferred from pseudoStates */
}

.input-text:disabled {
  background-color: var(--color-background-light, #f3f3f3); /* inferred from screenshot and --hwp-color-fill-disabled */
  color: var(--color-text-disabled, #999999);
  cursor: not-allowed;
  box-shadow: none;
}
```


<details>
<summary>Form Label</summary>

Labels for form fields, ensuring clear association with their respective inputs.

```css
.form-label {
  color: var(--color-text-primary, #333333);
  font-family: var(--typography-small-family, 'HuaweiSans-Regular', sans-serif);
  font-size: var(--typography-small-size, 14px);
  font-weight: var(--typography-small-weight, 400);
  margin-bottom: var(--spacing-4, 4px); /* inferred from screenshot */
  display: block;
}
```

</details>

<details>
<summary>Checkbox/Radio</summary>

Custom checkboxes and radio buttons that visually indicate their checked state with a brand-colored background.

```css
.checkbox-container {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  appearance: none;
  width: 18px; /* inferred from screenshot */
  height: 18px; /* inferred from screenshot */
  border: 1px solid var(--color-border, #e6e6e6);
  border-radius: var(--radius-xs, 4px);
  margin-right: var(--spacing-8, 8px);
  position: relative;
  transition: background-color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1)),
              border-color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1));
}

.checkbox-input:checked {
  background-color: var(--color-primary, #c7000b); /* from pseudoStates.checked */
  border-color: var(--color-primary, #c7000b);
}

.checkbox-input:checked::after {
  content: '';
  position: absolute;
  top: 3px; /* inferred from screenshot */
  left: 3px; /* inferred from screenshot */
  width: 10px; /* inferred from screenshot */
  height: 5px; /* inferred from screenshot */
  border: 2px solid var(--color-text-inverse, #ffffff);
  border-top: none;
  border-right: none;
  transform: rotate(-45deg) scale(1); /* from pseudoStates.checked */
  transition: transform var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1));
}

.checkbox-input:disabled {
  background-color: var(--color-background-light, #f3f3f3); /* inferred */
  border-color: var(--color-text-disabled, #999999); /* inferred */
  cursor: not-allowed;
}

.checkbox-input:checked:disabled {
  background-color: var(--color-primary-disabled, rgba(231, 67, 74, 0.6)); /* inferred */
  border-color: var(--color-primary-disabled, rgba(231, 67, 74, 0.6)); /* inferred */
}
```

</details>
### Navigation

Navigation elements are designed for clarity and ease of use, with subtle visual feedback on interaction.

#### Top Navigation Bar

The main navigation bar at the top of the page, providing access to primary sections. It features a subtle bottom border.

```css
.nav-bar {
  background-color: var(--color-background, #ffffff);
  border-bottom: 1px solid var(--color-border-separator, #f3f3f3);
  padding: var(--spacing-16, 16px) var(--spacing-32, 32px); /* inferred from screenshot */
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10; /* from zIndexValues.navbar-header */
}
```


<details>
<summary>Navigation Link</summary>

Individual links within the navigation, changing color to the primary red on hover and when active.

```css
.nav-link {
  color: var(--color-text-primary, #333333);
  font-family: var(--typography-small-family, 'HuaweiSans-Regular', sans-serif);
  font-size: var(--typography-small-size, 14px);
  font-weight: var(--typography-small-weight, 400);
  text-decoration: none;
  padding: var(--spacing-8, 8px) var(--spacing-12, 12px); /* inferred from screenshot */
  transition: color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1));
}

.nav-link:hover {
  color: var(--color-primary, #c7000b);
}

.nav-link.active,
.nav-link[aria-current="page"] {
  color: var(--color-primary, #c7000b);
  font-weight: var(--typography-heading-xl-weight, 700); /* inferred from screenshot */
}
```

</details>

<details>
<summary>Dropdown Menu</summary>

A context menu that appears on interaction, offering additional navigation options. It has a subtle shadow and rounded corners.

```css
.dropdown-menu {
  background-color: var(--color-background, #ffffff);
  border-radius: var(--radius-sm, 6px);
  box-shadow: var(--elevation-card, 0 1px 6px 0 rgba(0,0,0,0.08));
  padding: var(--spacing-12, 12px) 0;
  position: absolute;
  z-index: 100; /* inferred from common dropdown z-index */
  min-width: 180px; /* inferred from screenshot */
  transition: opacity var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1));
}

.dropdown-menu-item {
  color: var(--color-text-primary, #333333);
  font-family: var(--typography-small-family, 'HuaweiSans-Regular', sans-serif);
  font-size: var(--typography-small-size, 14px);
  font-weight: var(--typography-small-weight, 400);
  text-decoration: none;
  padding: var(--spacing-8, 8px) var(--spacing-16, 16px);
  display: block;
  transition: background-color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1)),
              color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1));
}

.dropdown-menu-item:hover {
  background-color: var(--color-surface-hover, rgba(25, 25, 25, 0.05));
  color: var(--color-primary, #c7000b);
}

.dropdown-menu-item:active {
  background-color: var(--color-surface-hover, rgba(25, 25, 25, 0.05));
  color: var(--color-primary-active, #e02128);
}
```

</details>
### Links

Links are designed for clear indication of interactivity, with the primary red accenting hover states.

#### Standard Link

Default inline text links, changing to the primary red and underlining on hover.

```css
.link-standard {
  color: var(--color-text-primary, #333333);
  text-decoration: none;
  transition: color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1)),
              text-decoration-color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1));
}

.link-standard:hover {
  color: var(--color-primary, #c7000b);
  text-decoration: underline; /* inferred from screenshot */
  text-decoration-color: var(--color-primary, #c7000b); /* inferred from screenshot */
}

.link-standard:visited {
  color: var(--color-text-primary, #333333); /* inferred from screenshot */
}
```


<details>
<summary>Secondary Link</summary>

Links used for less prominent actions or within content blocks, often appearing as "Learn More" or "Read More" prompts. These also use the primary red on hover.

```css
.link-secondary {
  color: var(--color-text-secondary, #595757);
  font-family: var(--typography-small-family, 'HuaweiSans-Regular', sans-serif);
  font-size: var(--typography-small-size, 14px);
  font-weight: var(--typography-small-weight, 400);
  text-decoration: none;
  transition: color var(--motion-duration-base, 0.2s) var(--motion-easing-standard, cubic-bezier(0.25, 1, 0.5, 1));
}

.link-secondary:hover {
  color: var(--color-primary, #c7000b);
  text-decoration: underline; /* inferred from screenshot */
}

.link-secondary:visited {
  color: var(--color-text-secondary, #595757); /* inferred from screenshot */
}
```

</details>
### Badges
(none observed in source)

## 5. Layout Principles

-   **Spacing System**: Huawei utilizes a `4px` base unit for its spacing system, creating a consistent and harmonious visual rhythm across the interface.
    -   **Base**: `4px`
    -   **Scale**: `[4, 8, 12, 16, 20, 24, 32, 48, 64, 80, 128]`
    -   **Usage Context**:
        -   `4px`: Fine-grained element separation, e.g., between icon and text.
        -   `8px`: Small gaps, internal padding for compact elements.
        -   `12px`: Standard padding for inputs, spacing between form elements.
        -   `16px`: Padding for navigation items, small component margins.
        -   `20px`: Moderate spacing within content blocks.
        -   `24px`: Standard padding for cards, spacing between minor sections.
        -   `32px`: Vertical separation between major content sections.
        -   `48px`: Large vertical padding for hero sections or significant content breaks.
        -   `64px`: Generous spacing for hero sections or full-width content.
        -   `80px`: Extra large spacing for distinct page sections.
        -   `128px`: Maximum spacing for hero banners or full-screen content.

-   **Grid & Container** _Note: container widths and column counts are not extracted from the source. The values below are reasonable defaults inferred from the visible layout density._:
    -   **Max Width**: `1200px` (inferred from screenshot)
    -   **Columns**: `12` (inferred from common practice)
    -   **Gutter**: `24px` (inferred from spacing scale)
    -   **Section Padding**: `48px` vertical, `32px` horizontal (inferred from screenshot)

-   **Whitespace Philosophy**: Huawei's design embraces generous and intentional whitespace to enhance readability and highlight key content. Large vertical `32px` to `48px` gaps between sections create clear visual breaks, preventing clutter. Internal padding of `24px` within cards and containers ensures content breathes, while smaller `8px` and `12px` units manage micro-spacing for precise alignment. This approach fosters a sense of openness and sophistication, directing user focus efficiently.

-   **Border Radius Scale**:
    -   **XS**: `4px` — Used for input fields and subtle button rounding.
    -   **SM**: `6px` — Standard for buttons and small interactive elements.
    -   **MD**: `16px` — Prominent rounding for cards, image containers, and larger content blocks.
    -   **Full**: `9999px` — For pill-shaped elements or circular avatars.

## 6. Depth & Elevation

Huawei employs a subtle elevation system using shadows to create hierarchy and distinguish interactive elements, while leveraging z-index for stacking context.

-   **Flat (z-0)**: `none` — Default for most static background elements and text.
-   **Card (z-1)**: `0 1px 6px 0 rgba(0,0,0,0.08)` — Used for standard content cards, news items, and informational blocks to give them a slight lift.
-   **Interactive (z-4)**: `0 1px 6px 0 rgba(0,0,0,0.08)` — Applied to clickable cards or elements that might have a hover state, like `www-showcase-cc-card-link`.
-   **Hover (z-5)**: `0 8px 24px 0 rgba(0,0,0,0.08)` — A more pronounced shadow for interactive elements like cards on hover, indicating a raised state.
-   **Navigation (z-10)**: `none` — The main navigation bar, positioned above most content.
-   **Modal (z-1100)**: `none` — Overlays and modal dialogs, ensuring they appear on top of all other content.

**Shadow Philosophy**: Shadows are used sparingly and subtly to provide depth without distracting from content. A light `0 1px 6px 0 rgba(0,0,0,0.08)` shadow is the default for cards, offering a soft separation from the background. On interaction, a more pronounced `0 8px 24px 0 rgba(0,0,0,0.08)` shadow is applied, creating a clear visual cue for clickable elements. This approach maintains a clean aesthetic while effectively communicating interactivity and hierarchy.

## 7. Do's and Don'ts

### Do's

-   **Do** use `HuaweiSans-Bold` at `48px` with `line-height: 1.1` for hero headlines to maximize visual impact.
-   **Do** apply `border-radius: 16px` to all `.card` components to maintain the consistent soft aesthetic.
-   **Do** ensure all primary calls-to-action use the `Primary Button` style with `background-color: #c7000b`.
-   **Do** use `padding: 24px` for internal spacing within `.card` components to provide ample breathing room for content.
-   **Do** make sure `Text Primary` (`#333333`) on `Background` (`#ffffff`) is the default for body text, providing a `12.63:1` contrast ratio (passes AAA).
-   **Do** transition `color` to `#c7000b` on `:hover` for all `Standard Link` elements.
-   **Do** utilize `spacing` values of `32px` and `48px` for vertical separation between major content sections.
-   **Do** use `outline: 2px solid #c7000b` with `outline-offset: 2px` for `:focus` states on all `Text Input` fields for accessibility.
-   **Do** ensure `Navigation Link` elements use `font-size: 14px` and `color: #333333` in their default state.
-   **Do** use the `0 1px 6px 0 rgba(0,0,0,0.08)` shadow for all `.card` elements in their resting state.

### Don'ts

-   **Don't** use `#595757` on `#f2f2f2` for body text; its `6.41:1` ratio barely passes AA, consider `Text Primary` (`#333333`) for better readability.
-   **Don't** introduce custom `border-radius` values; stick to the `4px`, `6px`, `16px`, and `9999px` scale.
-   **Don't** use `font-weight: 700` for `Body` text; reserve `HuaweiSans-Bold` for headings and use `400` for body content.
-   **Don't** use any spacing values outside the defined `[4, 8, 12, 16, 20, 24, 32, 48, 64, 80, 128]` scale.
-   **Don't** use `#808080` on `background` (`#ffffff`) for critical information; its `3.95:1` ratio only passes AA-large, not standard AA.
-   **Don't** use `background-color: #c7000b` for `Secondary Button` elements; they should be transparent with a border.
-   **Don't** use `text-decoration: underline` on `Standard Link` elements in their default state; apply it only on `:hover`.
-   **Don't** apply `box-shadow: 0 8px 24px 0 rgba(0,0,0,0.08)` to `.card` elements in their resting state; reserve it for the `:hover` state.
-   **Don't** use `color: #c7000b` for `Navigation Link` elements unless they are in an `:hover` or `.active` state.
-   **Don't** use `font-size: 16px` for `Caption` text; it should always be `12px` to distinguish it from body content.

## 8. Responsive Behavior
_Note: breakpoints below are from the source's actual media queries. These values are measured from the live DOM/CSSOM._

-   **Breakpoints**:
    -   **Mobile Small** (~767px): Content stacks vertically, navigation collapses to hamburger menu.
    -   **Mobile Large** (~991px): Cards adjust to 1-2 columns, typography scales down.
    -   **Tablet** (~1024px): Navigation may transition to a more compact form, grid layouts adapt.
    -   **Desktop** (~1025px): Standard desktop layout with multi-column grids.
    -   **Desktop Large** (~1200px): Wider layouts, increased content density, and larger hero sections.

-   **Touch Targets**:
    -   Ensure all interactive elements, like `Primary Button` and `Navigation Link`, have a minimum tap area of `44px` by `44px` (inferred).
    -   Maintain at least `8px` of clear space between adjacent touch targets to prevent accidental taps.

-   **Collapsing Strategy**:
    -   **Navigation**: The top navigation bar collapses `Consumer Products`, `Business Products`, etc., into a hamburger menu below `767px` viewport width.
    -   **Cards**: `.card` components transition from multi-column grids to single-column stacking on viewports below `991px`.
    -   **Typography**: `Display` and `Heading XL` font sizes scale down by approximately `20-30%` on mobile breakpoints to fit smaller screens.
    -   **Padding**: Section padding, such as `48px` vertical, reduces to `24px` or `32px` on mobile to optimize screen real estate.
    -   **Forms**: `Text Input` fields maintain full width on mobile, with labels stacked above.
    -   **Spacing**: Horizontal spacing, like `32px` gutters, reduces to `16px` or `20px` on smaller screens.

## 9. Agent Prompt Guide

-   **Quick Color Reference**
    -   primary: `#c7000b`
    -   primary-hover: `#e02128`
    -   background: `#ffffff`
    -   background-light: `#f3f3f3`
    -   text-primary: `#333333`
    -   text-secondary: `#595757`
    -   text-inverse: `#ffffff`
    -   border: `#e6e6e6`
    -   surface: `#f3f3f3`

-   **Iteration Guide**:
    1.  Always use `Primary Button` for main calls-to-action, with `background: #c7000b` and `padding: 10px 24px`.
    2.  Ensure `Display` typography is `HuaweiSans-Bold 48px 600` with `line-height: 1.1` for hero sections.
    3.  Apply `border-radius: 16px` to all `Card` components, with `box-shadow: 0 1px 6px 0 rgba(0,0,0,0.08)`.
    4.  Utilize the `4px` spacing base and the `[4, 8, 12, 16, 20, 24, 32, 48, 64, 80, 128]` scale for all layout and component spacing.
    5.  Implement `Text Input` fields with `border: 1px solid #e6e6e6` and `border-radius: 4px`.
    6.  Ensure `Standard Link` elements change `color` to `#c7000b` on hover.
    7.  Maintain `text-primary` (`#333333`) on `background` (`#ffffff`) for body text, ensuring AAA contrast.
    8.  For responsive design, collapse navigation to a hamburger menu below `767px` viewport width.
    9.  Apply `outline: 2px solid #c7000b` with `outline-offset: 2px` for all `:focus` states on interactive elements.
    10. All interactive elements must include a `transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);` for smooth state changes.
    11. Use `background-light` (`#f3f3f3`) for secondary background areas and `background-subtle` (`#eeeeee`) for subtle dividers.
    12. On hover, `Card` components should transition to `box-shadow: 0 8px 24px 0 rgba(0,0,0,0.08)`.