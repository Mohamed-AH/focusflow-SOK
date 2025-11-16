/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ["selector", 'class'],
  theme: {
  	extend: {
  		fontFamily: {
  			display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
  			sans: ['Manrope', 'system-ui', 'sans-serif'],
  		},
  		colors: {
  			primary: {
  				'100': '#e6f5e6',
  				'200': '#c2e0c2',
  				'300': '#9ecb9e',
  				'400': '#7ab67a',
  				'500': '#56a156',
  				'600': '#3d8c3d',
  				'700': '#2b772b',
  				'800': '#1a611a',
  				'900': '#0a4c0a',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			neutral: {
  				'100': '#f5f5f5',
  				'200': '#e5e5e5',
  				'300': '#d4d4d4',
  				'400': '#a3a3a3',
  				'500': '#737373',
  				'600': '#525252',
  				'700': '#404040',
  				'800': '#262626',
  				'900': '#171717'
  			},
  			// Custom landing page palette - deep ocean theme
  			ocean: {
  				'50': '#f0f9ff',
  				'100': '#e0f2fe',
  				'200': '#b9e6fe',
  				'300': '#7cd4fd',
  				'400': '#36bffa',
  				'500': '#0ba5e9',
  				'600': '#0086c9',
  				'700': '#026aa2',
  				'800': '#065986',
  				'900': '#0a4a6f',
  				'950': '#0a0e27',
  			},
  			coral: {
  				'50': '#fff1f1',
  				'100': '#ffe1e1',
  				'200': '#ffc7c7',
  				'300': '#ffa0a0',
  				'400': '#ff6b6b',
  				'500': '#f83b3b',
  				'600': '#e51d1d',
  				'700': '#c11414',
  				'800': '#a01414',
  				'900': '#841818',
  			},
  			electric: {
  				'50': '#ecfeff',
  				'100': '#cffafe',
  				'200': '#a5f3fc',
  				'300': '#67e8f9',
  				'400': '#22d3ee',
  				'500': '#06b6d4',
  				'600': '#0891b2',
  				'700': '#0e7490',
  				'800': '#155e75',
  				'900': '#164e63',
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		backgroundColor: {
  			'neutral-900': '#171717'
  		},
  		textColor: {
  			'neutral-900': '#171717'
  		},
  		borderRadius: {
  			button: '4px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		backgroundImage: {
  			'mesh-gradient': 'radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.15) 0px, transparent 50%), radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 0.12) 0px, transparent 50%), radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 0.15) 0px, transparent 50%), radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 0.12) 0px, transparent 50%), radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 0.1) 0px, transparent 50%), radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 0.13) 0px, transparent 50%), radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 0.11) 0px, transparent 50%)',
  			'ocean-mesh': 'radial-gradient(at 0% 0%, #0a0e27 0px, transparent 50%), radial-gradient(at 50% 0%, #1a1f3a 0px, transparent 50%), radial-gradient(at 100% 0%, #0a0e27 0px, transparent 50%)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

module.exports = config