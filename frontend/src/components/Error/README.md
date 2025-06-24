# Error Component & Error System

This directory contains the unified error handling system for the application.

## Components

### Error Component (`Error.tsx`)
A unified error display component that shows error messages in the MainFrame Dynamic Viewport.

**Features:**
- Centered layout in the MainFrame
- Large "qwq" emoji using Jua font (with transparency)
- Error message using Outfit Regular font
- Error code display (greyed out)
- Responsive design

**Props:**
- `errorCode`: The error code to display
- `errorMessage`: Custom error message (optional, defaults to "sumthin happnd...")
- `onBack`: Callback function for back navigation (optional)

## Error Codes System (`../../utils/errorCodes.ts`)

The application uses a comprehensive error code system:

### REST API Errors (1000-1999)
- **1000-1099**: Authentication errors
- **1100-1199**: Authorization errors  
- **1200-1299**: Validation errors
- **1300-1399**: Resource not found errors
- **1400-1499**: Server errors
- **1500-1599**: Network errors

### Internal Application Errors (2000-2999)
- **2000-2099**: Component loading errors
- **2100-2199**: Data fetching errors
- **2200-2299**: State management errors
- **2300-2399**: UI/UX errors
- **2400-2499**: Configuration errors

## Usage

### In Components
```tsx
import { useError } from '../../hooks/useError';
import { ERROR_CODES } from '../../utils/errorCodes';

const MyComponent = () => {
  const { showError } = useError();

  const handleApiCall = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        showError(ERROR_CODES.REST_API.NETWORK_ERROR, 'Failed to fetch data');
        return;
      }
      // Handle success
    } catch (error) {
      showError(ERROR_CODES.INTERNAL.DATA_FETCH_FAILED, 'Something went wrong');
    }
  };

  return (
    <button onClick={handleApiCall}>
      Load Data
    </button>
  );
};
```

### Error Codes Examples
```tsx
// REST API Errors
showError(ERROR_CODES.REST_API.UNAUTHORIZED, 'Please log in again');
showError(ERROR_CODES.REST_API.NOT_FOUND, 'Project not found');
showError(ERROR_CODES.REST_API.VALIDATION_ERROR, 'Invalid input');

// Internal Errors
showError(ERROR_CODES.INTERNAL.COMPONENT_LOAD_FAILED, 'Failed to load component');
showError(ERROR_CODES.INTERNAL.DATA_FETCH_FAILED, 'Could not load data');
```

## Navigation

The Error component has the highest view ID (11) in the MainFrame system, ensuring that:
- When an error occurs, it displays over other content
- The back button in the navbar returns to the previous view
- Navigation animations work correctly

## Styling

The Error component uses:
- **Jua font** for the "qwq" emoji (with transparency)
- **Outfit Regular font** for error messages
- Responsive design with mobile breakpoints
- Consistent spacing and typography

## Testing

To test the error system:
1. Navigate to the "About" section
2. Click any of the error simulation buttons
3. Observe the error display
4. Use the back button to return to the previous view 