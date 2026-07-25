import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Palette, Check } from 'lucide-react';
import { themeDisplayNames, getThemeInfo } from '@shared/themes/theme-config';

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  const { allowManualSelection } = getThemeInfo();

  // Se não permitir seleção manual (ex: em produção fixo pelo subdomínio), não exibe o seletor
  if (!allowManualSelection) {
    return null;
  }

  const themes = Object.entries(themeDisplayNames).map(([id, name]) => ({ id, name }));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Selecionar tema">
          <Palette className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className="flex items-center justify-between"
          >
            <span className="text-xs">{theme.name}</span>
            {currentTheme === theme.id && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}