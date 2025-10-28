/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand': {
                    'primary': '#32cd32',
                    'hover': '#28a428',
                },
                "gray": {
                    "100": "#D9D9D9"
                }
            },
            width: {
                'sidebar': 'min(250px, 70vw)',
            },
            animation: {
                'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fadeIn': 'fadeIn 0.2s ease-in-out',
                'slideUp': 'slideUp 0.3s ease-out',
            },
            scale: {
                '98': '0.98',
                '102': '1.02',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
} 