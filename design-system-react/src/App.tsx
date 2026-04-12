import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './components/ui/sidebar';
import { Button } from './components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { Toaster } from './components/ui/sonner';
import { Moon, Sun, Home, LayoutGrid, MousePointer, Palette, FileText, Settings, Database, MessageSquare, Sparkles } from 'lucide-react';
import { HomePage } from './components/HomePage';
import { ThemeSelector } from './components/ThemeSelector';

// Lazy-loaded documentation pages — only loaded when the user navigates to them
const lazyDocs: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'accordion':            lazy(() => import('./components/docs/AccordionDocs').then(m => ({ default: m.AccordionDocs }))),
  'alert-dialog':         lazy(() => import('./components/docs/AlertDialogDocs').then(m => ({ default: m.AlertDialogDocs }))),
  'alert':                lazy(() => import('./components/docs/AlertDocs').then(m => ({ default: m.AlertDocs }))),
  'aspect-ratio':         lazy(() => import('./components/docs/AspectRatioDocs').then(m => ({ default: m.AspectRatioDocs }))),
  'avatar':               lazy(() => import('./components/docs/AvatarDocs').then(m => ({ default: m.AvatarDocs }))),
  'badge':                lazy(() => import('./components/docs/BadgeDocs').then(m => ({ default: m.BadgeDocs }))),
  'breadcrumb':           lazy(() => import('./components/docs/BreadcrumbDocs').then(m => ({ default: m.BreadcrumbDocs }))),
  'button':               lazy(() => import('./components/docs/ButtonDocs').then(m => ({ default: m.ButtonDocs }))),
  'button-group':         lazy(() => import('./components/docs/ButtonGroupDocs').then(m => ({ default: m.ButtonGroupDocs }))),
  'calendar':             lazy(() => import('./components/docs/CalendarDocs').then(m => ({ default: m.CalendarDocs }))),
  'card':                 lazy(() => import('./components/docs/CardDocs').then(m => ({ default: m.CardDocs }))),
  'carousel':             lazy(() => import('./components/docs/CarouselDocs').then(m => ({ default: m.CarouselDocs }))),
  'chart':                lazy(() => import('./components/docs/ChartDocs').then(m => ({ default: m.ChartDocs }))),
  'checkbox':             lazy(() => import('./components/docs/CheckboxDocs').then(m => ({ default: m.CheckboxDocs }))),
  'collapsible':          lazy(() => import('./components/docs/CollapsibleDocs').then(m => ({ default: m.CollapsibleDocs }))),
  'command':              lazy(() => import('./components/docs/CommandDocs').then(m => ({ default: m.CommandDocs }))),
  'context-menu':         lazy(() => import('./components/docs/ContextMenuDocs').then(m => ({ default: m.ContextMenuDocs }))),
  'design-tokens':        lazy(() => import('./components/docs/DesignTokensDocs').then(m => ({ default: m.DesignTokensDocs }))),
  'dialog':               lazy(() => import('./components/docs/DialogDocs').then(m => ({ default: m.DialogDocs }))),
  'display-showcase':     lazy(() => import('./components/docs/DisplayShowcaseDocs').then(m => ({ default: m.DisplayShowcaseDocs }))),
  'drawer':               lazy(() => import('./components/docs/DrawerDocs').then(m => ({ default: m.DrawerDocs }))),
  'dropdown-menu':        lazy(() => import('./components/docs/DropdownMenuDocs').then(m => ({ default: m.DropdownMenuDocs }))),
  'empty':                lazy(() => import('./components/docs/EmptyDocs').then(m => ({ default: m.EmptyDocs }))),
  'feedback-showcase':    lazy(() => import('./components/docs/FeedbackShowcaseDocs').then(m => ({ default: m.FeedbackShowcaseDocs }))),
  'field':                lazy(() => import('./components/docs/FieldDocs').then(m => ({ default: m.FieldDocs }))),
  'form':                 lazy(() => import('./components/docs/FormDocs').then(m => ({ default: m.FormDocs }))),
  'form-showcase':        lazy(() => import('./components/docs/FormShowcaseDocs').then(m => ({ default: m.FormShowcaseDocs }))),
  'hover-card':           lazy(() => import('./components/docs/HoverCardDocs').then(m => ({ default: m.HoverCardDocs }))),
  'icons':                lazy(() => import('./components/docs/IconsDocs').then(m => ({ default: m.IconsDocs }))),
  'input':                lazy(() => import('./components/docs/InputDocs').then(m => ({ default: m.InputDocs }))),
  'input-group':          lazy(() => import('./components/docs/InputGroupDocs').then(m => ({ default: m.InputGroupDocs }))),
  'input-otp':            lazy(() => import('./components/docs/InputOtpDocs').then(m => ({ default: m.InputOtpDocs }))),
  'item':                 lazy(() => import('./components/docs/ItemDocs').then(m => ({ default: m.ItemDocs }))),
  'kbd':                  lazy(() => import('./components/docs/KbdDocs').then(m => ({ default: m.KbdDocs }))),
  'label':                lazy(() => import('./components/docs/LabelDocs').then(m => ({ default: m.LabelDocs }))),
  'layout-showcase':      lazy(() => import('./components/docs/LayoutShowcaseDocs').then(m => ({ default: m.LayoutShowcaseDocs }))),
  'menubar':              lazy(() => import('./components/docs/MenubarDocs').then(m => ({ default: m.MenubarDocs }))),
  'navigation-menu':      lazy(() => import('./components/docs/NavigationMenuDocs').then(m => ({ default: m.NavigationMenuDocs }))),
  'navigation-showcase':  lazy(() => import('./components/docs/NavigationShowcaseDocs').then(m => ({ default: m.NavigationShowcaseDocs }))),
  'overlay-showcase':     lazy(() => import('./components/docs/OverlayShowcaseDocs').then(m => ({ default: m.OverlayShowcaseDocs }))),
  'pagination':           lazy(() => import('./components/docs/PaginationDocs').then(m => ({ default: m.PaginationDocs }))),
  'popover':              lazy(() => import('./components/docs/PopoverDocs').then(m => ({ default: m.PopoverDocs }))),
  'progress':             lazy(() => import('./components/docs/ProgressDocs').then(m => ({ default: m.ProgressDocs }))),
  'radio-group':          lazy(() => import('./components/docs/RadioGroupDocs').then(m => ({ default: m.RadioGroupDocs }))),
  'resizable':            lazy(() => import('./components/docs/ResizableDocs').then(m => ({ default: m.ResizableDocs }))),
  'scroll-area':          lazy(() => import('./components/docs/ScrollAreaDocs').then(m => ({ default: m.ScrollAreaDocs }))),
  'select':               lazy(() => import('./components/docs/SelectDocs').then(m => ({ default: m.SelectDocs }))),
  'separator':            lazy(() => import('./components/docs/SeparatorDocs').then(m => ({ default: m.SeparatorDocs }))),
  'sheet':                lazy(() => import('./components/docs/SheetDocs').then(m => ({ default: m.SheetDocs }))),
  'sidebar':              lazy(() => import('./components/docs/SidebarDocs').then(m => ({ default: m.SidebarDocs }))),
  'skeleton':             lazy(() => import('./components/docs/SkeletonDocs').then(m => ({ default: m.SkeletonDocs }))),
  'slider':               lazy(() => import('./components/docs/SliderDocs').then(m => ({ default: m.SliderDocs }))),
  'sonner':               lazy(() => import('./components/docs/SonnerDocs').then(m => ({ default: m.SonnerDocs }))),
  'spinner':              lazy(() => import('./components/docs/SpinnerDocs').then(m => ({ default: m.SpinnerDocs }))),
  'stepper':              lazy(() => import('./components/docs/StepperDocs').then(m => ({ default: m.StepperDocs }))),
  'switch':               lazy(() => import('./components/docs/SwitchDocs').then(m => ({ default: m.SwitchDocs }))),
  'table':                lazy(() => import('./components/docs/TableDocs').then(m => ({ default: m.TableDocs }))),
  'tabs':                 lazy(() => import('./components/docs/TabsDocs').then(m => ({ default: m.TabsDocs }))),
  'textarea':             lazy(() => import('./components/docs/TextareaDocs').then(m => ({ default: m.TextareaDocs }))),
  'theming':              lazy(() => import('./components/docs/ThemingDocs').then(m => ({ default: m.ThemingDocs }))),
  'toggle':               lazy(() => import('./components/docs/ToggleDocs').then(m => ({ default: m.ToggleDocs }))),
  'toggle-group':         lazy(() => import('./components/docs/ToggleGroupDocs').then(m => ({ default: m.ToggleGroupDocs }))),
  'tooltip':              lazy(() => import('./components/docs/TooltipDocs').then(m => ({ default: m.TooltipDocs }))),
  'use-mobile':           lazy(() => import('./components/docs/UseMobileDocs').then(m => ({ default: m.UseMobileDocs }))),
  'utilities-showcase':   lazy(() => import('./components/docs/UtilitiesShowcaseDocs').then(m => ({ default: m.UtilitiesShowcaseDocs }))),
  'utils':                lazy(() => import('./components/docs/UtilsDocs').then(m => ({ default: m.UtilsDocs }))),
};

const componentCategories = [
  {
    name: "Foundations",
    icon: Sparkles,
    items: [
      { name: "Design Tokens", path: "design-tokens" },
      { name: "Theming", path: "theming" },
      { name: "Icons", path: "icons" },
      { name: "Utils", path: "utils" }
    ]
  },
  {
    name: "Layout",
    icon: LayoutGrid,
    items: [
      { name: "Layout Showcase", path: "layout-showcase" },
      { name: "Aspect Ratio", path: "aspect-ratio" },
      { name: "Card", path: "card" },
      { name: "Resizable", path: "resizable" },
      { name: "Scroll Area", path: "scroll-area" },
      { name: "Separator", path: "separator" },
      { name: "Sidebar", path: "sidebar" }
    ]
  },
  {
    name: "Navigation",
    icon: MousePointer,
    items: [
      { name: "Navigation Showcase", path: "navigation-showcase" },
      { name: "Breadcrumb", path: "breadcrumb" },
      { name: "Menubar", path: "menubar" },
      { name: "Navigation Menu", path: "navigation-menu" },
      { name: "Pagination", path: "pagination" },
      { name: "Stepper", path: "stepper" },
      { name: "Tabs", path: "tabs" }
    ]
  },
  {
    name: "Form",
    icon: FileText,
    items: [
      { name: "Form Showcase", path: "form-showcase" },
      { name: "Button", path: "button" },
      { name: "Button Group", path: "button-group" },
      { name: "Calendar", path: "calendar" },
      { name: "Checkbox", path: "checkbox" },
      { name: "Field", path: "field" },
      { name: "Form", path: "form" },
      { name: "Input", path: "input" },
      { name: "Input Group", path: "input-group" },
      { name: "Input OTP", path: "input-otp" },
      { name: "Label", path: "label" },
      { name: "Radio Group", path: "radio-group" },
      { name: "Select", path: "select" },
      { name: "Slider", path: "slider" },
      { name: "Switch", path: "switch" },
      { name: "Textarea", path: "textarea" },
      { name: "Toggle", path: "toggle" },
      { name: "Toggle Group", path: "toggle-group" }
    ]
  },
  {
    name: "Feedback",
    icon: MessageSquare,
    items: [
      { name: "Feedback Showcase", path: "feedback-showcase" },
      { name: "Alert", path: "alert" },
      { name: "Alert Dialog", path: "alert-dialog" },
      { name: "Badge", path: "badge" },
      { name: "Empty", path: "empty" },
      { name: "Kbd", path: "kbd" },
      { name: "Progress", path: "progress" },
      { name: "Skeleton", path: "skeleton" },
      { name: "Sonner", path: "sonner" },
      { name: "Spinner", path: "spinner" }
    ]
  },
  {
    name: "Display",
    icon: Palette,
    items: [
      { name: "Display Showcase", path: "display-showcase" },
      { name: "Avatar", path: "avatar" },
      { name: "Carousel", path: "carousel" },
      { name: "Chart", path: "chart" },
      { name: "Item", path: "item" },
      { name: "Table", path: "table" }
    ]
  },
  {
    name: "Overlay",
    icon: Settings,
    items: [
      { name: "Overlay Showcase", path: "overlay-showcase" },
      { name: "Command", path: "command" },
      { name: "Context Menu", path: "context-menu" },
      { name: "Dialog", path: "dialog" },
      { name: "Drawer", path: "drawer" },
      { name: "Dropdown Menu", path: "dropdown-menu" },
      { name: "Hover Card", path: "hover-card" },
      { name: "Popover", path: "popover" },
      { name: "Sheet", path: "sheet" },
      { name: "Tooltip", path: "tooltip" }
    ]
  },
  {
    name: "Utilities",
    icon: Database,
    items: [
      { name: "Utilities Showcase", path: "utilities-showcase" },
      { name: "Accordion", path: "accordion" },
      { name: "Collapsible", path: "collapsible" },
      { name: "useIsMobile", path: "use-mobile" }
    ]
  }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isDark, setIsDark] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');

  useEffect(() => {
    // Remove all theme classes
    document.documentElement.classList.remove('default', 'tema-personalizado', 'dark');

    // Apply current theme
    if (currentTheme === 'tema-personalizado') {
      document.documentElement.classList.add('tema-personalizado');
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
