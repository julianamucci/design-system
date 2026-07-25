import { useI18nStore } from "@/lib/i18n";
import { track } from "@/lib/analytics";

/**
 * Componente de Produto: Seletor de Idioma.
 * Botões PT/EN/ES agrupados via CSS standalone `.nds-lang-switcher` (mesma
 * aparência das 4 stacks). Seleção única via `aria-pressed`. Rastreia trocas
 * de idioma via GA4.
 */
const LOCALE_DEFS = [
  { value: "pt-BR", label: "PT", ariaLabel: "Português" },
  { value: "en", label: "EN", ariaLabel: "English" },
  { value: "es", label: "ES", ariaLabel: "Español" },
] as const;

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18nStore();

  return (
    <div className="nds-lang-switcher" role="group" aria-label="Idioma">
      {LOCALE_DEFS.map(({ value, label, ariaLabel }) => (
        <button
          key={value}
          type="button"
          className="nds-lang-switcher-button"
          data-locale={value}
          aria-label={ariaLabel}
          aria-pressed={value === locale}
          onClick={() => {
            if (value === locale) return;
            track("language_switched", {
              previous_language: locale,
              new_language: value,
            });
            setLocale(value);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
