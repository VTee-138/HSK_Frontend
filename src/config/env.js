// Config for different environments
const config = {
  development: {
    REACT_APP_API_BASE_URL: "http://localhost:4000/api/v2",
  },
  production: {
    REACT_APP_API_BASE_URL: "https://backend.tiengtrung86hsk.com/api/v2",
  },
};

// Get current environment
const env = process.env.NODE_ENV || 'development';
const currentConfig = config[env] || config.development;

export const REACT_APP_API_BASE_URL = currentConfig.REACT_APP_API_BASE_URL;

// For backward compatibility
export default currentConfig;