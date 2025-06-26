/**
 * Error codes system for the application
 * 
 * REST API errors (1000-1999):
 * - 1000-1099: Authentication errors
 * - 1100-1199: Authorization errors
 * - 1200-1299: Validation errors
 * - 1300-1399: Resource not found errors
 * - 1400-1499: Server errors
 * - 1500-1599: Network errors
 * 
 * Internal application errors (2000-2999):
 * - 2000-2099: Component loading errors
 * - 2100-2199: Data fetching errors
 * - 2200-2299: State management errors
 * - 2300-2399: UI/UX errors
 * - 2400-2499: Configuration errors
 */

export const ERROR_CODES = {
  // REST API Errors
  REST_API: {
    // Authentication errors
    UNAUTHORIZED: '1001',
    INVALID_TOKEN: '1002',
    TOKEN_EXPIRED: '1003',
    INVALID_CREDENTIALS: '1004',
    
    // Authorization errors
    FORBIDDEN: '1101',
    INSUFFICIENT_PERMISSIONS: '1102',
    
    // Validation errors
    VALIDATION_ERROR: '1201',
    INVALID_INPUT: '1202',
    MISSING_REQUIRED_FIELD: '1203',
    
    // Resource not found errors
    NOT_FOUND: '1301',
    RESOURCE_NOT_FOUND: '1302',
    USER_NOT_FOUND: '1303',
    PROJECT_NOT_FOUND: '1304',
    
    // Server errors
    INTERNAL_SERVER_ERROR: '1401',
    SERVICE_UNAVAILABLE: '1402',
    DATABASE_ERROR: '1403',
    
    // Network errors
    NETWORK_ERROR: '1501',
    TIMEOUT: '1502',
    CONNECTION_FAILED: '1503',
  },
  
  // Internal Application Errors
  INTERNAL: {
    // Component loading errors
    COMPONENT_LOAD_FAILED: '2001',
    MODULE_NOT_FOUND: '2002',
    
    // Data fetching errors
    DATA_FETCH_FAILED: '2101',
    CACHE_ERROR: '2102',
    PARSING_ERROR: '2103',
    DATA_UPDATE_FAILED: '2104',
    
    // State management errors
    STATE_ERROR: '2201',
    CONTEXT_ERROR: '2202',
    
    // UI/UX errors
    RENDER_ERROR: '2301',
    ANIMATION_ERROR: '2302',
    LAYOUT_ERROR: '2303',
    IMAGE_LOAD_TIMEOUT: '2304',
    
    // Configuration errors
    CONFIG_ERROR: '2401',
    ENV_VAR_MISSING: '2402',
  }
} as const;

export type ErrorCode = typeof ERROR_CODES.REST_API[keyof typeof ERROR_CODES.REST_API] | 
                       typeof ERROR_CODES.INTERNAL[keyof typeof ERROR_CODES.INTERNAL];

/**
 * Get error message for a given error code
 */
export const getErrorMessage = (errorCode: ErrorCode): string => {
  const messages: Record<ErrorCode, string> = {
    // REST API Errors
    '1001': 'Unauthorized access',
    '1002': 'Invalid authentication token',
    '1003': 'Authentication token expired',
    '1004': 'Invalid credentials provided',
    '1101': 'Access forbidden',
    '1102': 'Insufficient permissions',
    '1201': 'Validation error occurred',
    '1202': 'Invalid input provided',
    '1203': 'Required field missing',
    '1301': 'Resource not found',
    '1302': 'Requested resource not found',
    '1303': 'User not found',
    '1304': 'Project not found',
    '1401': 'Internal server error',
    '1402': 'Service temporarily unavailable',
    '1403': 'Database error occurred',
    '1501': 'Network connection error',
    '1502': 'Request timeout',
    '1503': 'Connection failed',
    
    // Internal Application Errors
    '2001': 'Component failed to load',
    '2002': 'Module not found',
    '2101': 'Failed to fetch data',
    '2102': 'Cache error occurred',
    '2103': 'Data parsing error',
    '2104': 'Failed to update data',
    '2201': 'State management error',
    '2202': 'Context error occurred',
    '2301': 'Render error occurred',
    '2302': 'Animation error occurred',
    '2303': 'Layout error occurred',
    '2304': 'Image load timeout',
    '2401': 'Configuration error',
    '2402': 'Environment variable missing',
  };
  
  return messages[errorCode] || 'Unknown error occurred';
};

/**
 * Check if an error code is from REST API
 */
export const isRestApiError = (errorCode: ErrorCode): boolean => {
  return errorCode.startsWith('1');
};

/**
 * Check if an error code is from internal application
 */
export const isInternalError = (errorCode: ErrorCode): boolean => {
  return errorCode.startsWith('2');
}; 