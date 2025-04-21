import type { Config } from 'tailwindcss';
import type { DefaultColors } from 'tailwindcss/types/generated/colors';

const themeDark = (colors: DefaultColors) => ({
  50: '#0a0a0a',
  100: '#111111',
  200: '#1c1c1c',
});

const themeLight = (colors: DefaultColors) => ({
  50: '#fcfcf9',
  100: '#f3f3ee',
  200: '#e8e8e3',
});

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderColor: ({ colors }) => {
        return {
          light: themeLight(colors),
          dark: themeDark(colors),
        };
      },
      colors: ({ colors }) => {
        const colorsDark = themeDark(colors);
        const colorsLight = themeLight(colors);

        return {
          dark: {
            primary: colorsDark[50],
            secondary: colorsDark[100],
            ...colorsDark,
          },
          light: {
            primary: colorsLight[50],
            secondary: colorsLight[100],
            ...colorsLight,
          },
          brand: {
            25: 'var(--color-brand-25)',
            50: 'var(--color-brand-50)',
            100: 'var(--color-brand-100)',
            200: 'var(--color-brand-200)',
            300: 'var(--color-brand-300)',
            400: 'var(--color-brand-400)',
            500: 'var(--color-brand-500)',
            600: 'var(--color-brand-600)',
            700: 'var(--color-brand-700)',
            800: 'var(--color-brand-800)',
            900: 'var(--color-brand-900)',
            950: 'var(--color-brand-950)',
          },
          'blue-light': {
            25: 'var(--color-blue-light-25)',
            50: 'var(--color-blue-light-50)',
            100: 'var(--color-blue-light-100)',
            200: 'var(--color-blue-light-200)',
            300: 'var(--color-blue-light-300)',
            400: 'var(--color-blue-light-400)',
            500: 'var(--color-blue-light-500)',
            600: 'var(--color-blue-light-600)',
            700: 'var(--color-blue-light-700)',
            800: 'var(--color-blue-light-800)',
            900: 'var(--color-blue-light-900)',
            950: 'var(--color-blue-light-950)',
          },
          gray: {
            25: 'var(--color-gray-25)',
            50: 'var(--color-gray-50)',
            100: 'var(--color-gray-100)',
            200: 'var(--color-gray-200)',
            300: 'var(--color-gray-300)',
            400: 'var(--color-gray-400)',
            500: 'var(--color-gray-500)',
            600: 'var(--color-gray-600)',
            700: 'var(--color-gray-700)',
            800: 'var(--color-gray-800)',
            900: 'var(--color-gray-900)',
            950: 'var(--color-gray-950)',
          },
          orange: {
            25: 'var(--color-orange-25)',
            50: 'var(--color-orange-50)',
            100: 'var(--color-orange-100)',
            200: 'var(--color-orange-200)',
            300: 'var(--color-orange-300)',
            400: 'var(--color-orange-400)',
            500: 'var(--color-orange-500)',
            600: 'var(--color-orange-600)',
            700: 'var(--color-orange-700)',
            800: 'var(--color-orange-800)',
            900: 'var(--color-orange-900)',
            950: 'var(--color-orange-950)',
          },
          success: {
            25: 'var(--color-success-25)',
            50: 'var(--color-success-50)',
            100: 'var(--color-success-100)',
            200: 'var(--color-success-200)',
            300: 'var(--color-success-300)',
            400: 'var(--color-success-400)',
            500: 'var(--color-success-500)',
            600: 'var(--color-success-600)',
            700: 'var(--color-success-700)',
            800: 'var(--color-success-800)',
            900: 'var(--color-success-900)',
            950: 'var(--color-success-950)',
          },
          error: {
            25: 'var(--color-error-25)',
            50: 'var(--color-error-50)',
            100: 'var(--color-error-100)',
            200: 'var(--color-error-200)',
            300: 'var(--color-error-300)',
            400: 'var(--color-error-400)',
            500: 'var(--color-error-500)',
            600: 'var(--color-error-600)',
            700: 'var(--color-error-700)',
            800: 'var(--color-error-800)',
            900: 'var(--color-error-900)',
            950: 'var(--color-error-950)',
          },
          warning: {
            25: 'var(--color-warning-25)',
            50: 'var(--color-warning-50)',
            100: 'var(--color-warning-100)',
            200: 'var(--color-warning-200)',
            300: 'var(--color-warning-300)',
            400: 'var(--color-warning-400)',
            500: 'var(--color-warning-500)',
            600: 'var(--color-warning-600)',
            700: 'var(--color-warning-700)',
            800: 'var(--color-warning-800)',
            900: 'var(--color-warning-900)',
            950: 'var(--color-warning-950)',
          },
          theme: {
            pink: {
              500: 'var(--color-theme-pink-500)',
            },
            purple: {
              500: 'var(--color-theme-purple-500)',
            },
          },
        };
      },
      fontSize: {
        'title-2xl': ['var(--text-title-2xl)', {
          lineHeight: 'var(--text-title-2xl--line-height)'
        }],
        'title-xl': ['var(--text-title-xl)', {
          lineHeight: 'var(--text-title-xl--line-height)'
        }],
        'title-lg': ['var(--text-title-lg)', {
          lineHeight: 'var(--text-title-lg--line-height)'
        }],
        'title-md': ['var(--text-title-md)', {
          lineHeight: 'var(--text-title-md--line-height)'
        }],
        'title-sm': ['var(--text-title-sm)', {
          lineHeight: 'var(--text-title-sm--line-height)'
        }],
        'theme-xl': ['var(--text-theme-xl)', {
          lineHeight: 'var(--text-theme-xl--line-height)'
        }],
        'theme-sm': ['var(--text-theme-sm)', {
          lineHeight: 'var(--text-theme-sm--line-height)'
        }],
        'theme-xs': ['var(--text-theme-xs)', {
          lineHeight: 'var(--text-theme-xs--line-height)'
        }],
      },
      boxShadow: {
        'theme-md': 'var(--shadow-theme-md)',
        'theme-lg': 'var(--shadow-theme-lg)',
        'theme-sm': 'var(--shadow-theme-sm)',
        'theme-xs': 'var(--shadow-theme-xs)',
        'theme-xl': 'var(--shadow-theme-xl)',
        'datepicker': 'var(--shadow-datepicker)',
        'focus-ring': 'var(--shadow-focus-ring)',
        'slider-navigation': 'var(--shadow-slider-navigation)',
        'tooltip': 'var(--shadow-tooltip)',
        'input-focus': 'var(--shadow-input-focus)',
        'button-hover': 'var(--shadow-button-hover)',
        'button-click': 'var(--shadow-button-click)',
      },
      dropShadow: {
        '4xl': 'var(--drop-shadow-4xl)',
      },
      // z-index 확장
      // zIndex: {
      //   1: 'var(--z-index-1)',
      //   9: 'var(--z-index-9)',
      //   99: 'var(--z-index-99)',
      //   999: 'var(--z-index-999)',
      //   9999: 'var(--z-index-9999)',
      //   99999: 'var(--z-index-99999)',
      //   999999: 'var(--z-index-999999)',
      // },
      // 브레이크포인트 확장
      // screens: {
      //   '2xsm': 'var(--breakpoint-2xsm)',
      //   'xsm': 'var(--breakpoint-xsm)',
      //   '3xl': 'var(--breakpoint-3xl)',
      //   'sm': 'var(--breakpoint-sm)',
      //   'md': 'var(--breakpoint-md)',
      //   'lg': 'var(--breakpoint-lg)',
      //   'xl': 'var(--breakpoint-xl)',
      //   '2xl': 'var(--breakpoint-2xl)',
      // },
      fontFamily: {
        outfit: 'var(--font-outfit)',
      },
      borderRadius: {
        'input': '0.5rem',
        'button': '0.5rem',
      },
      transitionProperty: {
        'shadow': 'box-shadow',
        'colors': 'background-color, border-color, color, fill, stroke',
      },
      backgroundColor: {
        'dark': {
          'primary': 'var(--color-gray-900)',
          'secondary': 'var(--color-gray-800)',
        }
      },
      textColor: {
        'dark': {
          'primary': 'var(--color-white)',
          'secondary': 'var(--color-gray-400)',
        }
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
