import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Globe, 
  Paintbrush, 
  Terminal, 
  Code2, 
  CheckCircle2, 
  ExternalLink,
  Laptop
} from 'lucide-react';
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/product/LanguageSwitcher";
import themingTranslations from "./content/theming/translations.json";

export function ThemingDocs() {
  const { t } = useTranslation(themingTranslations);

  return (
    <div className="flex-1 h-full overflow-auto ds-docs">
      <div className="p-8 max-w-4xl mx-auto space-y-12">
        
        {/* --- Header --- */}
        <header className="space-y-4 border-b pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">{t("badge")}</Badge>
              <Badge variant="outline">{t("category")}</Badge>
            </div>
            <LanguageSwitcher />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{t("subtitle")}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t("description")}
          </p>
        </header>

        {/* --- Conceito --- */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <Globe className="size-5 text-primary" />
            <h2>{t("howItWorks.title")}</h2>
          </div>
          <p className="text-muted-foreground">
            {t("howItWorks.description")}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-muted/30 border-none shadow-none">
              <CardContent className="pt-6 space-y-2">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <span className="font-bold text-xs text-primary">1</span>
                </div>
                <h3 className="font-semibold">{t("howItWorks.step1Title")}</h3>
                <p className="text-xs text-muted-foreground text-balance">
                  {t("howItWorks.step1Desc")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-none shadow-none">
              <CardContent className="pt-6 space-y-2">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <span className="font-bold text-xs text-primary">2</span>
                </div>
                <h3 className="font-semibold">{t("howItWorks.step2Title")}</h3>
                <p className="text-xs text-muted-foreground text-balance">
                  {t("howItWorks.step2Desc")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-none shadow-none">
              <CardContent className="pt-6 space-y-2">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <span className="font-bold text-xs text-primary">3</span>
                </div>
                <h3 className="font-semibold">{t("howItWorks.step3Title")}</h3>
                <p className="text-xs text-muted-foreground text-balance">
                  {t("howItWorks.step3Desc")}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* --- Adicionando Marca --- */}
        <section className="space-y-6 p-6 border rounded-2xl bg-card shadow-sm">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <Paintbrush className="size-5 text-indigo-500" />
            <h2>{t("guide.title")}</h2>
          </div>
          
          <div className="space-y-8 mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">A</div>
                 <h4 className="font-medium text-foreground">{t("guide.stepA")}</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("guide.stepADesc")}
              </p>
              <pre className="p-4 bg-muted rounded-xl text-xs overflow-x-auto border">
{`.tema-tres {
  --primary: 221 83% 53%; /* Blue */
  --radius: 0.3rem; 
}
.dark.tema-tres {
  --background: 222 47% 11%;
}`}
              </pre>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">B</div>
                 <h4 className="font-medium text-foreground">{t("guide.stepB")}</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("guide.stepBDesc")}
              </p>
              <pre className="p-4 bg-muted rounded-xl text-xs overflow-x-auto border">
{`/* Temas de Marca */
@import "./themes/crystal.css";
@import "./themes/industrial.css";
@import "./themes/nova-marca.css"; /* <--- Adicionar aqui */`}
              </pre>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">C</div>
                 <h4 className="font-medium text-foreground">{t("guide.stepC")}</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("guide.stepCDesc")}
              </p>
              <pre className="p-4 bg-muted rounded-xl text-xs overflow-x-auto border">
{`export const subdomainThemeMap: Record<string, string> = {
  'novo-subdominio': 'tema-tres',
  'crystal': 'tema-um',
};`}
              </pre>
            </div>
          </div>
        </section>

        {/* --- Testes --- */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <Terminal className="size-5 text-amber-500" />
            <h2>{t("localTesting.title")}</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {t("localTesting.description")}
            </p>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 border rounded-xl flex items-start gap-4">
                <Laptop className="size-6 text-muted-foreground shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium mb-1">{t("localTesting.method1Title")}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("localTesting.method1Desc")}
                  </p>
                  <code className="px-2 py-1 bg-muted rounded text-xs select-all">
                    http://localhost:5173/?theme-selector
                  </code>
                </div>
              </div>

              <div className="p-4 border rounded-xl flex items-start gap-4 bg-amber-500/5 border-amber-500/10">
                <Code2 className="size-6 text-amber-500 shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium mb-1">{t("localTesting.method2Title")}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("localTesting.method2Desc")}
                  </p>
                  <code className="px-2 py-1 bg-muted rounded text-xs block mb-2">
                    127.0.0.1 crystal.localhost
                  </code>
                  <p className="text-[10px] italic text-amber-600/80">
                    {t("localTesting.note")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Boas Práticas --- */}
        <section className="pt-8 border-t">
          <div className="bg-primary/5 p-6 rounded-2xl flex gap-4">
             <CheckCircle2 className="size-6 text-primary shrink-0" />
             <div className="space-y-2">
               <h4 className="font-semibold">{t("bestPractices.title")}</h4>
               <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                 <li>{t("bestPractices.item1")}</li>
                 <li>{t("bestPractices.item2")}</li>
                 <li>{t("bestPractices.item3")}</li>
               </ul>
             </div>
          </div>
        </section>

      </div>
    </div>
  );
}
