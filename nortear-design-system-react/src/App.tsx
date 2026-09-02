// SANDBOX: Este app existe para desenvolvimento isolado.
// A interface principal de documentação é o Storybook (npm run storybook, porta 6006).
// Novos componentes NÃO precisam ser registrados aqui — crie stories em src/components/ui/.
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './components/ui/sidebar';
import { Button } from './components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { Toaster } from './components/ui/sonner';
import { Moon, Sun, Home, MessageSquare, Sparkles } from 'lucide-react';
import { HomePage } from './components/HomePage';
import { ThemeSelector } from './components/ThemeSelector';
import { getThemeInfo, themeDisplayNames } from '@shared/themes/theme-config';

// Lazy-loaded documentation pages — only loaded when the user navigates to them
const lazyDocs: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'alert':        lazy(() => import('./components/docs/AlertDocs').then(m => ({ default: m.AlertDocs }))),
  'icons':        lazy(() => import('./components/docs/IconsDocs').then(m => ({ default: m.IconsDocs }))),
  'theme-colors': lazy(() => import('./components/docs/ThemeColorsDocs').then(m => ({ default: m.ThemeColorsDocs }))),
};

const componentCategories = [
  {
    name: "Foundations",
    icon: Sparkles,
    items: [
      { name: "Icons", path: "icons" },
      { name: "Theme Colors", path: "theme-colors" }
    ]
  },
  {
    name: "Feedback",
    icon: MessageSquare,
    items: [
      { name: "Alert", path: "alert" }
    ]
  }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isDark, setIsDark] = useState(false);
  // Inicialização de tema por subdomínio direto no initializer do useState
  // (evita flicker do primeiro render + atende react-hooks/set-state-in-effect)
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    const { theme, isDevMode } = getThemeInfo();
    return isDevMode ? 'default' : theme;
  });


  useEffect(() => {
    // Remove todas as classes de tema — o default INCLUÍDO. Ele era filtrado
    // daqui quando "Default" significava ausência de classe; hoje é um tema
    // como os outros, e deixá-lo de fora fazia a classe do index.html
    // sobreviver à troca. O resultado ainda era o certo, mas por acidente:
    // `default.css` é importado ANTES de warm/cold, então warm ganhava quando
    // as duas classes conviviam. Mudar a ordem dos @import inverteria isso sem
    // aviso.
    const themeClassNames = Object.keys(themeDisplayNames).map((id) => `tema-${id}`);
    document.documentElement.classList.remove('dark', ...themeClassNames);

    // Sempre aplica: os 39 tokens de cor só existem dentro de `.tema-<id>`.
    document.documentElement.classList.add(`tema-${currentTheme}`);

    // Aplica dark mode
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, [isDark, currentTheme]);

  const renderCurrentPage = () => {
    if (currentPage === 'home') {
      return <HomePage onNavigate={setCurrentPage} />;
    }

    const LazyComponent = lazyDocs[currentPage];
    if (LazyComponent) {
      return (
        <Suspense fallback={
          <div className="nds-app-loading nds-text-muted-foreground" aria-live="polite">
            <span className="nds-animate-pulse nds-text-caption">Carregando...</span>
          </div>
        }>
          <LazyComponent />
        </Suspense>
      );
    }

    return <HomePage onNavigate={setCurrentPage} />;
  };


  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="nds-skip-link nds-focus-shadow-md nds-focus-ring-inset"
      >
        Pular para conteúdo principal
      </a>
      <Sidebar>
        <SidebarHeader className="nds-app-sidebar-header">
          <div className="nds-app-sidebar-logo nds-inline-center" aria-hidden="true">
            <span className="nds-text-primary-foreground">S</span>
          </div>
          <span className="nds-text-3xl">Design System</span>
        </SidebarHeader>

        <SidebarContent className="nds-p-4">
          <nav aria-label="Navegação de componentes">
            <div className="nds-stack" data-spacing="sm">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={currentPage === 'home'}
                    onClick={() => setCurrentPage('home')}
                    tooltip="Home"
                  >
                    <Home className="nds-icon" aria-hidden="true" />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>

              <Accordion className="nds-w-full">
                {componentCategories.map((category) => (
                  <AccordionItem key={category.name} value={category.name} className="nds-border-none">
                    {/* Sem regra de rotação aqui: o AccordionTrigger já desenha o
                        próprio chevron (`.nds-accordion-icon`), e quem o gira é
                        `accordion.css`. A variante que estava neste ponto mirava
                        um `> svg` que o gatilho nunca teve nesta posição. */}
                    <AccordionTrigger className="nds-py-2 nds-px-2 nds-hover-bg-sidebar-accent nds-hover-text-sidebar-accent-foreground nds-rounded-md">
                      <span className="nds-cluster" data-spacing="sm">
                        <category.icon className="nds-icon" aria-hidden="true" />
                        <span>{category.name}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="nds-pb-0">
                      <div className="nds-ml-6 nds-p-1 nds-stack" data-spacing="xs">
                        {category.items.map((item) => (
                          <Button
                            key={item.path}
                            variant={currentPage === item.path ? 'secondary' : 'ghost'}
                            className="nds-w-full nds-text-left nds-text-caption"
                            onClick={() => setCurrentPage(item.path)}
                          >
                            {item.name}
                          </Button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="nds-mt-4 nds-pt-4 nds-border-t">
                <div className="nds-cluster nds-px-2 nds-py-1" data-justify="between">
                  <span className="nds-text-caption">Theme</span>
                  <ThemeSelector
                    currentTheme={currentTheme}
                    onThemeChange={setCurrentTheme}
                  />
                </div>
              </div>
            </div>
          </nav>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="nds-app-main">
        <header className="nds-app-header">
          {/* Empurra a ação para a direita: o header da shell alinha à esquerda,
              e este sandbox só tem o alternador de modo. */}
          <span className="nds-app-header-title" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDark(!isDark)}
            className="nds-inline-center"
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {isDark ? (
              <Sun className="nds-icon" aria-hidden="true" />
            ) : (
              <Moon className="nds-icon" aria-hidden="true" />
            )}
          </Button>
        </header>

        <main id="main-content" className="nds-app-content">
          {renderCurrentPage()}
        </main>
      </SidebarInset>
      <Toaster position="top-right" />
    </SidebarProvider>
  );
}
