/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0B0D13', // Deep dark blue-black from reference
                surface: '#15171C', // Slightly lighter panel color
                surfaceHover: '#1B1E24',
                borderContent: '#22252B',
                accent: '#D0A1FF', // For subtle glows or active states
                textMain: '#F2F2F2',
                textMuted: '#8B8D91',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
