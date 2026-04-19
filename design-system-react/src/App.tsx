// SANDBOX: Este app existe para desenvolvimento isolado e para a rota ?view=admin.
// A interface principal de documentação é o Storybook (npm run storybook, porta 6006).
// Novos componentes NÃO precisam ser registrados aqui — crie stories em src/components/ui/.
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { DocsEditor } from './admin/DocsEditor';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './components/ui/sidebar';
import { Button } from './components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { Toaster } from './components/ui/sonner';
import { Moon, Sun, Home, Palette, FileText, Database, MessageSquare, Sparkles } from 'lucide-react';
import { HomePage } from './components/HomePage';
import { ThemeSelector } from './components/ThemeSelector';
import { getThemeInfo, themeDisplayNames } from '@shared/themes/theme-config';

// Lazy-loaded documentation pages — only loaded when the user navigates to them
const lazyDocs: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'alert':        lazy(() => import('./components/docs/AlertDocs').then(m => ({ default: m.AlertDocs }))),
  'icons':        lazy(() => import('./components/docs/IconsDocs').then(m => ({ default: m.IconsDocs }))),
  'theme-colors': lazy(() => import('./components/docs/ThemeColorsDocs').then(m => ({ default: m.ThemeColorsDocs }))),
  'theming':      lazy(() => import('./components/docs/ThemingDocs').then(m => ({ default: m.ThemingDocs }))),
};

const componentCategories = [
  {
    name: "Foundations",
    icon: Sparkles,
    items: [
      { name: "Theming", path: "theming" },
      { name: "Theme Colors", path: "theme-colors" },
      { name: "Icons", path: "icons" }
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
  // Admin editor route: ?view=admin
  if (new URLSearchParams(window.location.search).get('view') === 'admin') {
    return <DocsEditor />;
  }

  const [currentPage, setCurrentPage] = useState('home');
  const [isDark, setIsDark] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');

  // Inicialização do tema por subdomínio
  useEffect(() => {
    const { theme, isDevMode } = getThemeInfo();

    // Se não estiver em dev mode, o tema é forçado pelo subdomínio
    if (!isDevMode) {
      setCurrentTheme(theme);
    }
  }, []);

  useEffect(() => {
    // Remove all possible theme classes
    const allThemes = Object.keys(themeDisplayNames);
    document.documentElement.classList.remove('dark', ...allThemes);

    // Apply current theme
    if (currentTheme !== 'default') {
      document.documentElement.classList.add(currentTheme);
    }

    // Apply dark mode
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
          <div className="flex items-center justify-center h-64 text-muted-foreground" aria-live="polite">
            <span className="animate-pulse text-sm">Carregando...</span>
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
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Pular para conteúdo principal
      </a>
      <Sidebar>
        <SidebarHeader className="h-16 px-6 border-b border-sidebar-border flex items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center" aria-hidden="true">
              <span className="text-primary-foreground">S</span>
            </div>
            <span className="font-semibold text-[30px]">Shadcn/UI</span>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-4">
          <nav aria-label="Navegação de componentes">
            <div className="space-y-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={currentPage === 'home'}
                    onClick={() => setCurrentPage('home')}
                    tooltip="Home"
                  >
                    <Home className="h-4 w-4" aria-hidden="true" />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>

              <Accordion type="multiple" className="w-full">
                {componentCategories.map((category) => (
                  <AccordionItem key={category.name} value={category.name} className="border-none">
                    <AccordionTrigger className="py-2 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md [&[data-state=open]>svg]:rotate-90">
                      <div className="flex items-center gap-2">
                        <category.icon className="h-4 w-4" aria-hidden="true" />
                        <span>{category.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="ml-6 p-1 space-y-1">
                        {category.items.map((item) => (
                          <Button
                            key={item.path}
                            variant={currentPage === item.path ? 'secondary' : 'ghost'}
                            className="w-full justify-start h-7 text-sm"
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

              <div className="mt-4 pt-4 border-t border-sidebar-border">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-sm text-sidebar-foreground">Theme</span>
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

      <SidebarInset className="flex flex-col">
        <header className="h-16 border-b border-border bg-background flex items-center justify-end px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDark(!isDark)}
              className="h-8 w-8 p-0"
              aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {isDark ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-auto">
          {renderCurrentPage()}
        </main>
      </SidebarInset>
      <Toaster position="top-right" />
    </SidebarProvider>
  );
}
