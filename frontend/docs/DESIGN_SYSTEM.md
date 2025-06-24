# EXO Frontend - Design System

This document outlines the design principles and component architecture for the EXO application frontend. The goal is to create a consistent, modern, and visually appealing user interface.

## Core Principles

1.  **Responsiveness**: All components MUST be fully responsive and adapt gracefully to all viewport sizes, from mobile to desktop.
2.  **Layout**: A strict left-to-right layout will be enforced. No centered text or elements, unless specified (e.g., card images). This ensures a clean, organized look.
3.  **Padding**: Components rendered inside the `MainFrame` must not have their own padding. The `MainFrame` itself provides a consistent padding of `2.5rem` on all sides to ensure a spacious and uncluttered feel.

## Component Structure

Each component rendered within the main content area (`MainFrame`) will follow this structure:

-   **Header/Hero Section**:
    -   Located at the top of the component.
    -   Displays the section title (e.g., "My Projects").
    -   **Font**: `Outfit Bold`, large size.
    -   **Underline**: A thin, white underline that spans the full width of the component's content area, visually separating the header from the content.

-   **Content Section**:
    -   Located below the header.
    -   Contains the main content of the component, which will adhere to the "Cards Layout System".

## Cards Layout System (CLS)

CLS is the primary method for displaying collections of items.

### Base Card Style

-   **Container**: All cards will be contained within a vessel featuring a subtle, semi-transparent white outline and rounded corners, consistent with the `Navbar` and `MainFrame` aesthetic.
-   **Hover Animation**: On hover, cards will slightly increase in size (`transform: scale(1.05)`). The transition will be smooth and include a subtle elastic/bounce effect (`cubic-bezier(0.175, 0.885, 0.32, 1.275)`).

### CLS Layouts

#### 1. CLS Grid

A layout for vertically-oriented cards.

-   **Grid Behavior**: Items are arranged in a responsive grid. Cards maintain a minimum height to ensure a vertical aspect ratio and have equal widths.
-   **Card Content**:
    -   **Image/Enumeration**:
        -   Cards can feature an optional image, which will be centered vertically and horizontally.
        -   If no image is present, a dynamic enumeration number (`01`, `02`, etc.) will be displayed instead. The number will be large, use the `Outfit Bold` font, and be aligned to the left.
    -   **Title**: `Outfit Bold`, white text.
    -   **Description**: `Outfit Regular`, slightly transparent white text. Long descriptions will be truncated with an ellipsis (`...`).
    -   **Alignment**: All text content within the card is strictly left-aligned.
    -   **Technology Tags**:
        -   Small tags used to display the technologies of a project.
        -   **Style**: They have a subtle background, rounded corners, and contain the technology name and a corresponding icon.
        -   **Icons**: Icons are from the Tabler Icons library to maintain visual consistency.

#### 2. CLS List

A layout for horizontally-oriented cards, resembling a list.

-   **List Behavior**: Items are stacked vertically. Each card will span the full available width of the component, with a shorter height to create a horizontal aspect ratio.
-   **Card Content**:
    -   Follows the same principles as the Grid layout for title, description, and image/enumeration. 

## Buttons

This section defines the styling and behavior for different types of buttons used in the application.

### Button Types

#### Primary Action Button (PAB)

PABs represent the primary action a user is encouraged to take within a specific context.

-   **Usage**: They MUST always be associated with positive or neutral actions (e.g., "Save," "Submit," "Create").
-   **Negative Actions**: They MUST NOT be used for negative actions. For instance, in a deletion confirmation dialog, the "Cancel" button should be the PAB, while "Confirm Deletion" should be a Secondary Action Button (SAB).

#### Secondary Action Button (SAB)

SABs are used for actions that are secondary to the primary action within the same context.

-   **Usage**: They can be associated with positive, neutral, or negative actions.

#### Icon-Only Button (IOB)

IOBs are compact, square buttons whose primary (and often only) content is an icon. They have **no visible housing in their default state**; the housing animates in on hover, giving them a clean, unobtrusive appearance when idle while still conforming to SAB visuals when interacted with.

-   **Default (Idle) State**
    -   **Content**: Only the icon is visible.
    -   **Icon Size**: Slightly larger than the hovered‐state icon (e.g., `1.4×` scale) so it feels touch-friendly and legible without a background.
    -   **Housing**: **None** – no background, no outline, no shadow.
    -   **Colour**: Icon is light grey (`rgba(255,255,255,0.8)`).

-   **Hover / Active State**  
    _The moment the pointer enters the button area, the component MUST visually match an SAB._
    -   **Housing**: A translucent grey background (`rgba(255,255,255,0.08)`) and lighter grey outline (`rgba(255,255,255,0.4)`), with the same border-radius as standard SABs (8 px).
    -   **Elevation**: Subtle drop-shadow (`0 8px 20px rgba(0,0,0,0.2)`).
    -   **Icon Animation**: Icon smoothly scales **down** to fit the newly-appeared housing (e.g., from `1.4×` ➜ `0.9×`).
    -   **Colour**: Icon turns pure white for higher contrast.

-   **Interaction**
    -   IOBs MUST use the _Sentient Button_ behaviour (cursor-follower) consistent with other buttons.
    -   They respect the same disabled, focus, and active states as SABs.

-   **Sizing**
    -   Container dimensions are fixed (e.g., **40 × 40 px**). The housing pseudo-element scales from `0.6` ➜ `1` on hover using the elastic cubic-bezier curve (`0.175, 0.885, 0.32, 1.275`).

-   **Tooltip System**
    -   IOBs that lack descriptive text MUST include a tooltip to provide context about their function.
    -   **Tooltip Display**: Tooltips appear in a dedicated center section of the navbar (desktop only, viewport ≥ 768px).
    -   **Animation**: Tooltips use a terminal-style typing/deletion animation with a "> " prefix.
    -   **Font**: Space Grotesk Regular (`font-weight: 400`).
    -   **Color**: Semi-transparent white (`rgba(255, 255, 255, 0.4)`).
    -   **Implementation**: Use the `createTooltipHandlers(text)` function to generate mouse/touch event handlers:
        ```tsx
        const createTooltipHandlers = (text: string) => ({
          onMouseEnter: () => setHoveredTooltip(text),
          onMouseLeave: () => setHoveredTooltip(null),
          onTouchStart: () => setHoveredTooltip(text),
          onTouchEnd: () => setHoveredTooltip(null),
        });
        
        <SentientIOB {...createTooltipHandlers('tooltip text')}>
          <IconComponent />
        </SentientIOB>
        ```
    -   **Responsive Behavior**: Tooltips are automatically hidden on mobile devices (viewport < 768px) to maintain clean mobile UI.

This specification ensures that icon-only controls like the navbar **chevron back button** look minimalist by default yet remain perfectly consistent with SABs when hovered, maintaining a cohesive visual language throughout the application.

### Generic Styling and Behavior

The following rules apply to all button types unless specified otherwise.

-   **Hover Elevation**: On hover, buttons will "elevate" by projecting a subtle drop shadow, which disappears when the hover state ends.
-   **Hover Interaction**: To enhance user feedback, non-disabled buttons will subtly shift their position to follow the user's mouse cursor on hover, creating a "sentient" feel.
-   **Content Layout**: Buttons can contain text, an icon, or both. When both are present, the icon MUST be placed to the left of the text.

### PAB Styling

-   **Background**: Solid pitch-white (`#FFFFFF`).
-   **Content Color**: Pitch-black (`#000000`) for text and icons.

### SAB Styling

-   **Background**: Grey, with a slightly lighter grey outline, matching the style of `MainFrame` and cards.
-   **Content Color**: Light grey for text and icons.
-   **Negative Action SABs**: For SABs tied to negative actions (e.g., "Delete," "Remove"), the button's outline and background will turn red on hover to signal a destructive action.

## Links

-   **Default Style**: All hyperlinks MUST have an underline and be pitch-white (`#FFFFFF`).
-   **Hover Style**: On hover, hyperlinks will turn blue.

## Icons

-   **Icon Library**: The [Tabler Icons](https://tabler-icons.io/) library is the single source of icons for this project. Use of any other icon library is strictly forbidden to ensure visual consistency. 