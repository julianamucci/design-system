import { getLocale, setLocale, type Locale } from '@/lib/i18n';
import { track } from '@/lib/analytics';

const LOCALE_DEFS: { value: Locale; label: string; 'aria-label': string }[] = [
  { value: 'pt-BR', label: 'PT', 'aria-label': 'Português' },
  { value: 'en',    label: 'EN', 'aria-label': 'English'   },
  { value: 'es',    label: 'ES', 'aria-label': 'Español'   },
];

export function createLanguageSwitcher(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-lang-switcher';

  const renderButtons = () => {
    wrap.replaceChildren();
    const current = getLocale();
    LOCALE_DEFS.forEach(({ value, label, 'aria-label': ariaLabel }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'nds-lang-switcher-button';
      b.dataset.locale = value;
      b.setAttribute('aria-label', ariaLabel);
      b.textContent = label;
      const active = value === current;
      b.setAttribute('aria-pressed', String(active));
      b.addEventListener('click', () => {
        const prev = getLocale();
        if (prev === value) return;
        track('language_switched', { previous_language: prev, new_language: value });
        setLocale(value);
        renderButtons();
      });
      wrap.appendChild(b);
    });
  };

  renderButtons();
  return wrap;
}
