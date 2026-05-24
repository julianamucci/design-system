import { Languages } from "lucide-react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { useI18nStore } from "@/lib/i18n";
import { track } from "@/lib/analytics";

/**
 * Componente de Produto: Seletor de Idioma
 * Centraliza a lógica de troca de idioma da documentação.
 * Utiliza o ToggleGroup da UI para garantir agrupamento visual e semântica de seleção única.
 * Rastreia trocas de idioma via GA4.
 */
export function LanguageSwitcher() {
  const { locale, setLocale } = useI18nStore();

  return (
    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-(--radius-input) border border-border/40">
      <ToggleGroup
        type="single"
        value={locale}
        onValueChange={(value: string) => {
          if (!value || value === locale) return;
          track('language_switched', {
            previous_language: locale,
            new_language: value as typeof locale,
          });
          setLocale(value as typeof locale);
        }}
        variant="outline"
        size="sm"
        className="h-(--height-sm)"
      >
        <ToggleGroupItem
          value="pt-BR"
          aria-label="Português"
          className="h-(--height-xs) px-2 text-[10px] data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
        >
          PT
        </ToggleGroupItem>
        <ToggleGroupItem
          value="en"
          aria-label="English"
          className="h-(--height-xs) px-2 text-[10px] data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
        >
          EN
        </ToggleGroupItem>
        <ToggleGroupItem
          value="es"
          aria-label="Español"
          className="h-(--height-xs) px-2 text-[10px] data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
        >
          ES
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="ml-1 border-l border-border/50 h-3 pl-2 flex items-center">
        <Languages className="h-3 w-3 text-muted-foreground/50" />
      </div>
    </div>
  );
}
