import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { getLocale, setLocale, locale, type Locale } from '@/lib/i18n';
import { track } from '@/lib/analytics';

const LOCALE_DEFS: { value: Locale; label: string; ariaLabel: string }[] = [
  { value: 'pt-BR', label: 'PT', ariaLabel: 'Português' },
  { value: 'en',    label: 'EN', ariaLabel: 'English'   },
  { value: 'es',    label: 'ES', ariaLabel: 'Español'   },
];

@Component({
  selector: 'nds-language-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'nds-lang-switcher' },
  template: `
    @for (def of defs; track def.value) {
      <button
        type="button"
        class="nds-lang-switcher-button"
        [attr.data-locale]="def.value"
        [attr.aria-label]="def.ariaLabel"
        [attr.aria-pressed]="def.value === locale()"
        (click)="select(def.value)"
      >{{ def.label }}</button>
    }
  `,
})
export class NdsLanguageSwitcher {
  protected readonly defs = LOCALE_DEFS;
  // Signal de locale: o template re-renderiza sozinho na troca, sem o
  // `renderButtons()` manual que o Vanilla precisa.
  protected readonly locale = locale;

  protected select(next: Locale): void {
    const prev = getLocale();
    if (prev === next) return;
    track('language_switched', { previous_language: prev, new_language: next });
    setLocale(next);
  }
}
