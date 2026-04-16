import { useCallback, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ComponentDemo } from "@/components/ComponentDemo";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Trash2, Info, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/product/LanguageSwitcher";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitize-html";
import uiTranslations from "@/i18n/ui.json";
import alertDialogTranslations from "./content/alert-dialog/translations.json";

// ─── Navegação interna ────────────────────────────────────────────────────────

const getNavGroups = (t: any) => [
  {
    label: t("nav.overview"),
    sections: [
      { id: "demonstracao", label: t("nav.demonstration") },
      { id: "anatomia",     label: t("nav.anatomy")     },
      { id: "quando-usar",  label: t("nav.usage")  },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "propriedades", label: t("nav.props") },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes", label: t("nav.testes") },
    ],
  },
];

function useActiveSection(ids: string[], onSectionChange?: (id: string) => void) {
  const [activeId, setActiveId] = useState<string>(ids[0]);

  useEffect(() => {
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveId(id);
            onSectionChange?.(id);
          }
        },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach((obs) => obs?.disconnect());
  }, [ids, onSectionChange]);

  return activeId;
}

function ComponentDocsSidebar({ navGroups, allIds, onSectionChange }: { navGroups: any[], allIds: string[], onSectionChange?: (id: string) => void }) {
  const activeId = useActiveSection(allIds, onSectionChange);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Navegação das seções do componente"
      className="sticky top-8 w-52 shrink-0 self-start space-y-5"
    >
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground mb-1 px-2">
            {group.label}
          </p>
          <ul className="list-none space-y-0.5">
            {group.sections.map((section: any) => (
              <li key={section.id}>
                <button
                  onClick={() => scrollTo(section.id)}
                  aria-current={activeId === section.id ? "location" : undefined}
                  className={[
                    "w-full text-left text-sm px-2 py-1 rounded-md transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    activeId === section.id
                      ? "font-semibold text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  ].join(" ")}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AlertDialogDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(alertDialogTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(() => navGroups.flatMap((g) => g.sections.map((s) => s.id)), [navGroups]);

  // ─── SEO & GEO (Guideline 20) ────────────────────────────────────────────
  useSeoEffect({
    title: `${tContent("title")} — ${tContent("category")}`,
    description: tContent("description"),
    locale,
    componentSlug: "alert-dialog",
  });

  // ─── Analytics — page view ───────────────────────────────────────────────
  useEffect(() => {
    track("docs_page_view", {
      component_name: "alert-dialog",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  // ─── Analytics — section view ────────────────────────────────────────────
  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "alert-dialog",
        locale,
      });
    },
    [locale],
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* ── Header (Hero) ──────────────────────────────────────────────── */}
      <header className="ds-docs mb-12 border-b pb-8 border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0">
              {tContent("category")}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground font-normal px-2 py-0">
              {tContent("type")}
            </Badge>
          </div>
          
          <LanguageSwitcher />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {tContent("title")}
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
            {tContent("description")}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground/80">
          <span className="flex items-center gap-1.5">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">
              npx shadcn@latest add alert-dialog
            </code>
          </span>
        </div>
      </header>

      <div className="flex gap-16 items-start">
        <ComponentDocsSidebar navGroups={navGroups} allIds={allIds} onSectionChange={handleSectionChange} />
        <div className="ds-docs flex-1 space-y-12">

          <section id="demonstracao">
            <h2 className="text-xl font-semibold mb-4">{tContent("demonstration.title")}</h2>
            <ComponentDemo>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {tContent("demonstration.trigger")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        {tContent("demonstration.confirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {tContent("demonstration.confirmDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tContent("demonstration.cancel")}</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {tContent("demonstration.action")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </ComponentDemo>
          </section>

          <section id="anatomia">
            <h2 className="text-xl font-semibold mb-4">{tContent("anatomy.title")}</h2>
            <ComponentDemo>
              <div className="w-full overflow-x-auto border rounded-xl shadow-sm">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left bg-muted/50 font-medium">
                      <th className="p-4 border-r border-border">{tContent("anatomy.table.part")}</th>
                      <th className="p-4 border-r border-border">{tContent("anatomy.table.component")}</th>
                      <th className="p-4">{tContent("anatomy.table.function")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['root', 'trigger', 'content', 'header', 'title', 'desc', 'footer', 'cancel', 'action'].map(key => (
                      <tr key={key} className="border-b border-border last:border-0 hover:bg-muted/5 transition-colors">
                        <td className="p-4 border-r border-border font-medium capitalize text-xs tracking-tight">{key}</td>
                        <td className="p-4 border-r border-border"><code className="bg-muted px-2 py-0.5 rounded text-[10px] font-mono text-primary border border-border/40">AlertDialog{key === 'root' ? '' : key.charAt(0).toUpperCase() + key.slice(1)}</code></td>
                        <td className="p-4 text-xs text-muted-foreground leading-relaxed">{tContent(`anatomy.table.${key}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ComponentDemo>
          </section>

          <section id="quando-usar">
            <h2 className="text-xl font-semibold mb-4">{tContent("usage.title")}</h2>
            <div className="space-y-8">
                <div className="bg-muted/30 border p-6 rounded-xl space-y-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        {tContent("usage.guidelines.title")}
                    </h4>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
                        {[1, 2, 3, 4].map(i => <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent(`usage.guidelines.item${i}`)) }} />)}
                    </ul>
                </div>

                <div className="border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr className="text-left font-semibold">
                                <th className="p-4 border-r border-border">{tContent("usage.scenarios.cols.scenario")}</th>
                                <th className="p-4 border-r border-border">{tContent("usage.scenarios.cols.use")}</th>
                                <th className="p-4">{tContent("usage.scenarios.cols.alternative")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3].map(i => (
                                <tr key={i} className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                                    <td className="p-4 border-r border-border text-xs">{tContent(`usage.scenarios.item${i}.s`)}</td>
                                    <td className="p-4 border-r border-border font-semibold text-primary text-xs">{tContent(`usage.scenarios.item${i}.u`)}</td>
                                    <td className="p-4 text-xs text-muted-foreground">{tContent(`usage.scenarios.item${i}.a`)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-4">
                    <h4 className="font-semibold text-sm">{tContent("uxWriting.title")}</h4>
                    <div className="w-full overflow-x-auto border rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/70 text-left font-semibold">
                                    <th className="p-4 border-r border-border">{locale === 'pt-BR' ? 'Elemento' : 'Element'}</th>
                                    <th className="p-4 border-r border-border">{locale === 'pt-BR' ? 'Regra de Formato' : 'Format Rule'}</th>
                                    <th className="p-4 border-r border-border text-green-700 dark:text-green-400">{tNav("common.do")}</th>
                                    <th className="p-4 text-red-700 dark:text-red-400">{tNav("common.dont")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['title', 'description'].map(key => (
                                    <tr key={key} className="border-b border-border last:border-0 hover:bg-muted/5">
                                        <td className="p-4 border-r border-border font-medium text-xs">{tContent(`uxWriting.table.${key}.name`)}</td>
                                        <td className="p-4 border-r border-border text-xs text-muted-foreground">{tContent(`uxWriting.table.${key}.format`)}</td>
                                        <td className="p-4 border-r border-border text-xs text-green-600 font-medium">{tContent(`uxWriting.table.${key}.good`)}</td>
                                        <td className="p-4 text-xs text-red-600 font-medium">{tContent(`uxWriting.table.${key}.bad`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          </section>

          <section id="propriedades">
            <h2 className="text-xl font-semibold mb-4">{tContent("props.title")}</h2>
            <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-muted/50 border-b text-left">
                    <tr>
                      <th className="p-4 border-r border-border font-semibold">{locale === 'pt-BR' ? 'Propriedade' : 'Property'}</th>
                      <th className="p-4 font-semibold">{tContent("anatomy.table.function")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['open', 'onOpenChange', 'asChild'].map(key => (
                      <tr key={key} className="border-b last:border-0 hover:bg-muted/5 transition-colors text-xs">
                        <td className="p-4 border-r border-border font-mono font-bold text-primary">{key}</td>
                        <td className="p-4 text-muted-foreground italic">{tContent(`props.table.${key}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </section>

          <section id="acessibilidade">
            <h2 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
                 <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">♿</span>
                 {tContent("accessibility.title")}
            </h2>
            <div className="space-y-6">
                <div className="bg-muted/30 border p-6 rounded-xl space-y-4 shadow-sm">
                    <ul className="list-none space-y-3 p-0">
                        {[1, 2, 3].map(i => (
                            <li key={i} className="flex gap-3 text-sm text-muted-foreground bg-card p-3 rounded-lg border border-border/40 hover:border-primary/20 transition-colors">
                                <span className="text-primary font-bold">✓</span>
                                {tContent(`accessibility.item${i}`)}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-card border rounded-xl p-5 shadow-sm hover:ring-1 hover:ring-primary/10 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <code className="text-[10px] bg-muted px-2 py-0.5 rounded-md uppercase font-bold text-primary border border-border/60">ESC</code>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed italic">{tContent("accessibility.keyboard.esc")}</p>
                    </div>
                    <div className="bg-card border rounded-xl p-5 shadow-sm hover:ring-1 hover:ring-primary/10 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <code className="text-[10px] bg-muted px-2 py-0.5 rounded-md uppercase font-bold text-primary border border-border/60">TAB</code>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed italic">{tContent("accessibility.keyboard.tab")}</p>
                    </div>
                </div>
            </div>
          </section>

          <section id="analytics">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-lg">📊</span>
                {tContent("analytics.title")}
            </h2>
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{tContent("analytics.description")}</p>
                <div className="border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-muted/50 border-b font-semibold text-left">
                            <tr>
                                <th className="p-4 border-r border-border">{locale === 'pt-BR' ? 'Interação' : 'Interaction'}</th>
                                <th className="p-4">{locale === 'pt-BR' ? 'Evento disparado' : 'Event fired'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                                <td className="p-4 border-r border-border text-xs font-medium">{locale === 'pt-BR' ? 'Abertura do diálogo' : 'Opening the dialog'}</td>
                                <td className="p-4 font-mono text-xs text-primary font-bold tracking-tight">{tContent("analytics.table.open")}</td>
                            </tr>
                            <tr className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                                <td className="p-4 border-r border-border text-xs font-medium">{locale === 'pt-BR' ? 'Confirmação da ação' : 'Confirming the action'}</td>
                                <td className="p-4 font-mono text-xs text-primary font-bold tracking-tight">{tContent("analytics.table.confirm")}</td>
                            </tr>
                            <tr className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                                <td className="p-4 border-r border-border text-xs font-medium">{locale === 'pt-BR' ? 'Cancelamento/Fechamento' : 'Cancel/Close'}</td>
                                <td className="p-4 font-mono text-xs text-primary font-bold tracking-tight">{tContent("analytics.table.cancel")}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
          </section>

          <section id="testes">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                 <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-lg">🧪</span>
                 {tContent("testes.title")}
            </h2>
            <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-muted/50 border-b font-semibold text-left">
                        <tr>
                            <th className="p-4 border-r border-border">{tNav("common.userAction")}</th>
                            <th className="p-4 border-r border-border">{tNav("common.expectedResult")}</th>
                            <th className="p-4 w-32">{tNav("common.priority")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="hover:bg-muted/5 transition-colors">
                            <td className="p-4 border-r border-border text-xs font-medium">{tContent("testes.action")}</td>
                            <td className="p-4 border-r border-border text-xs text-muted-foreground">{tContent("testes.result")}</td>
                            <td className="p-4">
                                <Badge className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/10 h-6 font-bold text-[9px] uppercase tracking-wider shadow-none">
                                    {tContent("testes.priority")}
                                </Badge>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
