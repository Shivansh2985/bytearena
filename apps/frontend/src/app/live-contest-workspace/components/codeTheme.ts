import { tags as t } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';

export const codeArenaTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#010102', // Extreme black
    backgroundImage: 'radial-gradient(circle at 50% 0%, #151525 0%, #010102 60%)', // whitish shiny effect
    foreground: '#F8F8F2',
    caret: '#FF007F', // Neon pink caret
    selection: '#3D375E7F',
    selectionMatch: '#3D375E7F',
    lineHighlight: '#FFFFFF05',
    gutterBackground: '#010102',
    gutterForeground: '#5A5A7A',
  },
  styles: [
    { tag: t.comment, color: '#7E8E91', fontStyle: 'italic' },
    { tag: t.variableName, color: '#F8F8F2' },
    { tag: [t.string, t.special(t.brace)], color: '#E6DB74' }, // Bright yellow strings
    { tag: t.number, color: '#AE81FF' }, // Purple numbers
    { tag: t.bool, color: '#AE81FF' },
    { tag: t.null, color: '#AE81FF' },
    { tag: t.keyword, color: '#F92672', fontWeight: 'bold' }, // Neon pink keywords
    { tag: t.operator, color: '#FD971F' }, // Orange operators
    { tag: t.className, color: '#66D9EF', fontStyle: 'italic' }, // Cyan classes
    { tag: t.definition(t.typeName), color: '#66D9EF', fontStyle: 'italic' },
    { tag: t.typeName, color: '#66D9EF', fontStyle: 'italic' },
    { tag: t.angleBracket, color: '#F92672' },
    { tag: t.tagName, color: '#F92672' },
    { tag: t.attributeName, color: '#A6E22E' }, // Green attributes
    { tag: t.propertyName, color: '#66D9EF' },
    { tag: t.function(t.variableName), color: '#A6E22E', fontWeight: 'bold' }, // Bright Green functions
    { tag: t.function(t.propertyName), color: '#A6E22E', fontWeight: 'bold' },
    { tag: t.moduleKeyword, color: '#F92672', fontWeight: 'bold' },
    { tag: t.modifier, color: '#F92672', fontWeight: 'bold' },
    { tag: t.controlKeyword, color: '#F92672', fontWeight: 'bold' },
    { tag: t.standard(t.typeName), color: '#66D9EF' },
  ],
});
