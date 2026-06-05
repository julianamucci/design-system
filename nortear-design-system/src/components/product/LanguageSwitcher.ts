import { getLocale, setLocale, type Locale } from '@/lib/i18n';
import { track } from '@/lib/analytics';

const LOCALE_DEFS: { value: Locale; label: string; ariaLabel: string }[] = [
  { value: 'pt-BR', label: 'PT', ariaLabel: 'Português' },
  { value: 'en',    label: 'EN', ariaLabel: 'English'   },
  { value: 'es',    label: 'ES', ariaLabel: 'Español'   },
];

export function createLanguageSwitcher(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-lang-switcher';

  const renderButtons = () => {
    wrap.replaceChildren();
    const current = getLocale();
    LOCALE_DEFS.forEach(({ value, label, ariaLabel }) => {
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
