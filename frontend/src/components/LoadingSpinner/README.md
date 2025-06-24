# LoadingSpinner Component

A minimalistic, text-based loading component that supports both full viewport and dynamic container layouts. Designed to be cohesive with the Error component design.

## Features

- **Dual Layout Support**: Can be used as a full viewport component or within any container
- **Minimalistic Design**: Text-based loading with cute, random phrases
- **Cohesive Styling**: Matches the Error component design language
- **Performance Optimized**: Lightweight animations with minimal resource usage
- **Responsive**: Adapts to different screen sizes
- **Smooth Transitions**: Fade and zoom animations between phrases

## Design Philosophy

The LoadingSpinner follows the same design principles as the Error component:
- Uses SpaceGrotesk-Regular font
- White text with reduced alpha for subtlety
- Clean, minimalistic approach
- Cohesive visual language

## Usage

### Full Viewport Layout (like Error component)

```tsx
import LoadingSpinner from '../LoadingSpinner';

// Takes the full available space in the MainFrame viewport
<LoadingSpinner fullViewport={true} />
```

### Dynamic Container Layout

```tsx
import LoadingSpinner from '../LoadingSpinner';

// Adapts to its container's dimensions
<div style={{ width: '200px', height: '150px' }}>
  <LoadingSpinner />
</div>
```

### Custom Styling

```tsx
// Custom color
<LoadingSpinner 
  color="rgba(255, 69, 109, 0.8)"
  className="my-custom-class"
/>

// Full viewport with custom styling
<LoadingSpinner 
  fullViewport={true}
  color="rgba(0, 255, 255, 0.7)"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fullViewport` | `boolean` | `false` | When true, takes full viewport space. When false, adapts to container |
| `size` | `number` | `undefined` | Not used in current design (kept for compatibility) |
| `color` | `string` | `rgba(255, 255, 255, 0.7)` | Color of the loading text |
| `className` | `string` | `''` | Additional CSS classes |

## Animation Details

The component displays random loading phrases with smooth transitions:
- **Duration**: 10 seconds per phrase
- **Transition**: 0.6 seconds fade/zoom animation
- **Easing**: Material 3 easing curve `[0.4, 0.0, 0.2, 1]`
- **Effect**: Text fades out while zooming away, new text fades in while zooming in

## Loading Phrases

The component cycles through 25 cute loading phrases including:
- "loading..."
- "please wait..."
- "almost there..."
- "just a moment..."
- "preparing..."
- And many more...

## Layout Modes

### Full Viewport Mode
- Uses absolute positioning to fill the entire available space
- Similar to the Error component layout
- Responsive padding adjustments
- Perfect for main loading states

### Dynamic Mode
- Uses relative positioning to adapt to container dimensions
- Minimum height of 100px for visibility
- Perfect for inline loading states
- Adapts to any container size 