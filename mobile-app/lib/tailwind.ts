import { create } from 'twrnc';
import { COLORS } from './theme';

// Exact match with HTML tailwind.config
const tw = create({
  theme: {
    extend: {
      colors: {
        primary: COLORS.primary,
        primaryLight: COLORS.primaryLight,
        textMain: COLORS.textMain,
        textSub: COLORS.textSub,
        bgLight: COLORS.bgLight,
        app: {
          black: '#1A1A1A',
          gray: '#6B7280',
          light: '#F3F4F6'
        }
      },
      fontFamily: {
        urbanist: ['Urbanist', 'sans-serif'],
      }
    }
  }
});

export default tw;
