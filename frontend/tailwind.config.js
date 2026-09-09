/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CAMS Design Language System (DLS) - GIGW 3.0 Palette
        goi: {
          navy: '#0B2F5C',      // Top navigation, primary buttons, footers, major headings
          'navy-hover': '#072040',
          digital: '#1A5699',   // Active states, text links, interactive elements
          'digital-hover': '#13447a',
          bg: '#F4F6F9',        // Inspector Gray background
          surface: '#FFFFFF',   // Surface / Card white
          charcoal: '#111827',  // High contrast text
          slate: '#6B7280',     // Low contrast text
          success: '#16A34A',   // Metrology Green (Compliant)
          danger: '#DC2626',    // Violation Red (Non-Compliant)
          warning: '#D97706',   // Audit Yellow (Pending Review)
          border: '#D1D5DB'     // Standard GIGW border
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'Inter', 'sans-serif']
      },
      borderRadius: {
        'goi': '4px',           // GIGW 3.0 subtle rounding
        'pill': '9999px'
      },
      maxWidth: {
        'cams': '1440px'        // GIGW max-width container
      }
    },
  },
  plugins: [],
}
