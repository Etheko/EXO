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