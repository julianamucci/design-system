import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Palette,
  ExternalLink,
  Info,
  Paintbrush,
  Cloud,
  Sun,
  Copy,
  Check,
} from 'lucide-react';
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/product/LanguageSwitcher";
import { sanitizeHtml } from "@/lib/sanitize-html";
import colorsTranslations from "./content/colors/translations.json";

interface ColorItemProps {
  name: string;
  variable: string;
  hex: string;
  copyLabel?: string;
}

const ColorItem = ({ name, variable, hex, copyLabel = "Copiado!" }: ColorItemProps) => {
  const [copied, setCopied] = React.useState(false);

  const copyHex = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-2 group">
      <div 
        onClick={copyHex}
        className="h-20 rounded-xl border border-border/50 shadow-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md flex items-end justify-end p-2 relative overflow-hidden"
        style={{ backgroundColor: hex }}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        <div className="bg-white/90 backdrop-blur-md rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm flex items-center gap-1.5">
           {copied ? (
             <>
               <Check className="size-3 text-green-600" />
               <span className="text-[10px] font-bold text-green-600">{copyLabel}</span>
             </>
           ) : (
             <Copy className="size-3 text-muted-foreground" />
           )}
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wide">{name}</span>
          <span className="text-[10px] tabular-nums text-muted-foreground uppercase">{hex}</span>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground truncate">{variable}</p>
      </div>
    </div>
  );
};

const ColorGroup = ({ title, subtitle, colors, copyLabel }: { title: string, subtitle: string, colors: any[], copyLabel: string }) => (
  <div className="space-y-4">
    <div className="space-y-1">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {colors.map(color => <ColorItem key={color.variable} {...color} copyLabel={copyLabel} />)}
    </div>
  </div>
);

export function ThemeColorsDocs() {
  const { t } = useTranslation(colorsTranslations);

  const nortearColors = [
    { name: "Primary", variable: "--primary", hex: "#171717" },
    { name: "Secondary", variable: "--secondary", hex: "#f5f5f5" },
    { name: "Muted", variable: "--muted", hex: "#f5f5f5" },
    { name: "Accent", variable: "--accent", hex: "#f5f5f5" },
    { name: "Success", variable: "--success", hex: "#22c55e" },
    { name: "Warning", variable: "--warning", hex: "#eab308" },
    { name: "Error", variable: "--destructive", hex: "#ef4444" },
    { name: "Info", variable: "--info", hex: "#3b82f6" },
  ];

  const crystalColors = [
    { name: "Primary", variable: "--primary (Crystal)", hex: "#7c3aed" },
    { name: "Background", variable: "--background", hex: "#020617" },
    { name: "Border", variable: "--border", hex: "#1e293b" },
  ];

  const industrialColors = [
    { name: "Primary", variable: "--primary (Industrial)", hex: "#f59e0b" },
    { name: "Background", variable: "--background", hex: "#000000" },
    { name: "Border", variable: "--border", hex: "#262626" },
  ];

  const navItems = [
    { id: "introducao", label: t("title") },
    { id: "nortear", label: t("nortear.title") },
    { id: "crystal", label: t("crystal.title") },
    { id: "industrial", label: t("industrial.title") },
  ];

  return (
    <div className="ds-docs flex-1 h-full overflow-auto bg-background scroll-smooth">
      <div className="p-8 max-w-6xl mx-auto">
        
        {/* --- Header --- */}
        <header id="introducao" className="space-y-4 border-b pb-8 mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">{t("category")}</Badge>
              <Badge variant="outline">{t("title")}</Badge>
            </div>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center gap-3">
             <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
             <Palette className="size-8 text-primary/20" />
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
            {t("description")}
          </p>
        </header>

        <div className="flex gap-16 items-start">
          
          {/* --- Conteúdo Principal --- */}
          <div className="flex-1 min-w-0 space-y-20">
            
            {/* Tema Nortear */}
            <section id="nortear" className="space-y-8">
              <div className="flex items-center gap-2 text-xl font-semibold border-b pb-2">
                <Paintbrush className="size-5 text-primary" />
                <h2>{t("nortear.title")}</h2>
              </div>
              <ColorGroup 
                title={t("nortear.title")} 
                subtitle={t("nortear.subtitle")}
                colors={nortearColors} 
                copyLabel={t("copy")}
              />
            </section>

            {/* Tema Crystal */}
            <section id="crystal" className="space-y-8">
              <div className="flex items-center gap-2 text-xl font-semibold border-b pb-2">
                <Cloud className="size-5 text-[#7c3aed]" />
                <h2>{t("crystal.title")}</h2>
              </div>
              <ColorGroup 
                title={t("crystal.title")} 
                subtitle={t("crystal.subtitle")}
                colors={crystalColors} 
                copyLabel={t("copy")}
              />
            </section>

            {/* Tema Industrial */}
            <section id="industrial" className="space-y-8">
              <div className="flex items-center gap-2 text-xl font-semibold border-b pb-2">
                <Sun className="size-5 text-[#f59e0b]" />
                <h2>{t("industrial.title")}</h2>
              </div>
              <ColorGroup 
                title={t("industrial.title")} 
                subtitle={t("industrial.subtitle")}
                colors={industrialColors} 
                copyLabel={t("copy")}
              />
            </section>

            {/* Guia de Uso */}
            <section id="uso" className="pt-8 border-t">
              <div className="bg-primary/5 p-6 rounded-2xl flex gap-4 border border-primary/10">
                 <Info className="size-6 text-primary shrink-0" />
                 <div className="space-y-4">
                   <h4 className="font-semibold text-lg">{t("usage.title")}</h4>
                   <p className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(t("usage.content")) }} />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-green-600">
                        <Check className="size-3" /> {t("usage.do")}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-red-400">
                        <XCircle className="size-3" /> {t("usage.dont")}
                      </div>
                   </div>
                 </div>
              </div>
            </section>
          </div>

          {/* --- Navegação Vertical --- */}
          <aside className="hidden lg:block w-48 sticky top-8 h-fit self-start border-l pl-6 py-2">
            <h5 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-4">{t("onPage")}</h5>
            <nav className="space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors border-l-2 border-transparent hover:border-primary/30 pl-3 -ml-[26px]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 pt-6 border-t">
               <Button variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-primary" asChild>
                  <a href="#" className="flex items-center gap-1">
                    Ver Variáveis HSL <ExternalLink className="size-3" />
                  </a>
               </Button>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

// Pequeno componente auxiliar para o X que não importei corretamente
function XCircle({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
    </svg>
  );
}
