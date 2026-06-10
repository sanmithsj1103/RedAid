/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9e2016',
          container: '#c0392b',
        },
        'on-primary': '#ffffff',
        'primary-container': '#c0392b',
        'on-primary-container': '#ffe5e1',
        'inverse-primary': '#ffb4a9',
        
        secondary: {
          DEFAULT: '#b4271d',
          container: '#fe5c4a',
        },
        'on-secondary': '#ffffff',
        'secondary-container': '#fe5c4a',
        'on-secondary-container': '#610001',
        
        tertiary: {
          DEFAULT: '#005f2f',
          container: '#007a3e',
        },
        'on-tertiary': '#ffffff',
        'tertiary-container': '#007a3e',
        'on-tertiary-container': '#a1ffb8',
        
        surface: {
          DEFAULT: '#fcf9f8',
          dim: '#dcd9d9',
          bright: '#fcf9f8',
          lowest: '#ffffff',
          low: '#f6f3f2',
          container: '#f0eded',
          high: '#eae7e7',
          highest: '#e5e2e1',
          'container-lowest': '#ffffff',
          'container-low': '#f6f3f2',
          'container-high': '#eae7e7',
          'container-highest': '#e5e2e1',
        },
        'surface-dim': '#dcd9d9',
        'surface-bright': '#fcf9f8',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f6f3f2',
        'surface-container': '#f0eded',
        'surface-container-high': '#eae7e7',
        'surface-container-highest': '#e5e2e1',
        'surface-variant': '#e5e2e1',
        'surface-tint': '#b02d21',
        
        on: {
          surface: '#1c1b1b',
          'surface-variant': '#59413d',
          background: '#1c1b1b',
        },
        'on-surface': '#1c1b1b',
        'on-surface-variant': '#59413d',
        'inverse-surface': '#313030',
        'inverse-on-surface': '#f3f0ef',
        
        background: '#fcf9f8',
        'on-background': '#1c1b1b',
        
        outline: '#8d706c',
        'outline-variant': '#e1bfb9',
        
        success: '#27ae60',
        warning: '#f39c12',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        // fixed colors
        'primary-fixed': '#ffdad5',
        'primary-fixed-dim': '#ffb4a9',
        'on-primary-fixed': '#410000',
        'on-primary-fixed-variant': '#8e130c',
        'secondary-fixed': '#ffdad5',
        'secondary-fixed-dim': '#ffb4a9',
        'on-secondary-fixed': '#410000',
        'on-secondary-fixed-variant': '#910807',
        'tertiary-fixed': '#7efba4',
        'tertiary-fixed-dim': '#61de8a',
        'on-tertiary-fixed': '#00210c',
        'on-tertiary-fixed-variant': '#005228',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      }
    },
  },
  plugins: [],
}
