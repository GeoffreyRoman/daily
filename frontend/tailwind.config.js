/** @type {import('tailwindcss').Config} */
module.exports = {
    // darkMode removed
    content: [
        './src/**/*.{html,ts}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif']
            },
            colors: {
                brand: {
                    DEFAULT: '#6366F1',
                    50: '#EEF2FF',
                    100: '#E0E7FF',
                    200: '#C7D2FE',
                    300: '#A5B4FC',
                    400: '#818CF8',
                    500: '#6366F1',
                    600: '#4F46E5',
                    700: '#4338CA',
                    800: '#3730A3',
                    900: '#312E81'
                }
            },
            boxShadow: {
                'soft': '0 2px 8px -2px rgba(0,0,0,0.08), 0 4px 16px -2px rgba(0,0,0,0.06)',
                'elevated': '0 4px 12px -2px rgba(0,0,0,0.12), 0 8px 24px -4px rgba(0,0,0,0.08)'
            },
            animation: {
                'fade-in': 'fadeIn 0.35s ease-out',
                'scale-in': 'scaleIn 0.25s ease'
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 }
                },
                scaleIn: {
                    '0%': { opacity: 0, transform: 'scale(.95)' },
                    '100%': { opacity: 1, transform: 'scale(1)' }
                }
            }
        },
    },
    plugins: [
    ],
}
