/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ["selector", 'class'],
  theme: {
  	extend: {
  		fontFamily: {
  			display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
  			sans: ['Inter', 'system-ui', 'sans-serif'],
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
  			// Brand palette — restrained, premium SaaS neutrals + one accent.
  			// "ocean" = deep neutral surface, "electric" = indigo accent,
  			// "coral" = warm signal color (streaks, warnings).
  			ocean: {
  				'50': '#f8fafc',
  				'100': '#f1f5f9',
  				'200': '#e2e8f0',
  				'300': '#cbd5e1',
  				'400': '#94a3b8',
  				'500': '#64748b',
  				'600': '#475569',
  				'700': '#334155',
  				'800': '#1e293b',
  				'900': '#0f172a',
  				'950': '#020617',
  			},
  			coral: {
  				'50': '#fff7ed',
  				'100': '#ffedd5',
  				'200': '#fed7aa',
  				'300': '#fdba74',
  				'400': '#fb923c',
  				'500': '#f97316',
  				'600': '#ea580c',
  				'700': '#c2410c',
  				'800': '#9a3412',
  				'900': '#7c2d12',
  			},
  			electric: {
  				'50': '#eef2ff',
  				'100': '#e0e7ff',
  				'200': '#c7d2fe',
  				'300': '#a5b4fc',
  				'400': '#818cf8',
  				'500': '#6366f1',
  				'600': '#4f46e5',
  				'700': '#4338ca',
  				'800': '#3730a3',
  				'900': '#312e81',
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
  			'mesh-gradient': 'radial-gradient(at 20% 0%, hsla(239, 84%, 67%, 0.06) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(239, 84%, 67%, 0.04) 0px, transparent 50%)',
  			'ocean-mesh': 'radial-gradient(at 0% 0%, #020617 0px, transparent 50%), radial-gradient(at 50% 0%, #0f172a 0px, transparent 50%), radial-gradient(at 100% 0%, #020617 0px, transparent 50%)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

module.exports = config