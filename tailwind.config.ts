import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'agt': {
          primary: '#10b981',
          dark: '#0f172a',
          darker: '#020617',
        }
      }
    },
  },
  plugins: [],
}
export default config
