import { create } from 'twrnc';

// Exact match with HTML tailwind.config
const tw = create({
  theme: {
    extend: {
      colors: {
        primary: '#ff386c',
        primaryLight: '#fff0f4',
        textMain: '#1e1e1e',
        textSub: '#8a8a8a',
        bgLight: '#fcfcfc',
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
