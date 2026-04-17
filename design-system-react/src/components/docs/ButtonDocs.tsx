import { useCallback, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ComponentDemo } from "@/components/ComponentDemo";
import { XCircle, Mail, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/product/LanguageSwitcher";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitize-html";
import uiTranslations from "@/i18n/ui.json";
import buttonTranslations from "@shared/content/button/translations.json";

// ─── Navegação interna ────────────────────────────────────────────────────────

const getNavGroups = (t: any) => [
  {
    label: t("nav.overview"),
    sections: [
      { id: "demonstracao", label: t("nav.demonstration") },
      { id: "anatomia",     label: t("nav.anatomy")     },
      { id: "quando-usar",  label: t("nav.usage")  },
      { id: "do-dont",      label: t("nav.doDont")   },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao",   label: t("nav.import")   },
      { id: "exemplos",     label: t("nav.examples")     },
      { id: "variantes",    label: t("nav.variants")    },
      { id: "estados",      label: t("nav.states")      },
      { id: "propriedades", label: t("nav.props") },
      { id: "tokens",       label: t("nav.tokens")       },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados",   label: t("nav.related")   },
      { id: "notas",          label: t("nav.notes")          },
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
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveId(id);
            onSectionChange?.(id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids, onSectionChange]);

  return activeId;
}

function ComponentDocsSidebar({ navGroups, allIds, onSectionChange }: { navGroups: any[], allIds: string[], onSectionChange?: (id: string) => void }) {
  const activeId = useActiveSection(allIds, onSectionChange);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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

export function ButtonDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(buttonTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(() => navGroups.flatMap((g) => g.sections.map((s) => s.id)), [navGroups]);

  // ─── SEO & GEO (Guideline 20) ────────────────────────────────────────────
  useSeoEffect({
    title: `${tContent("title")} — ${tContent("category")}`,
    description: tContent("seo.description"),
    locale,
    componentSlug: "button",
  });

  // ─── Analytics — page view ───────────────────────────────────────────────
  useEffect(() => {
    track("docs_page_view", {
      component_name: "button",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  // ─── Analytics — section view ────────────────────────────────────────────
  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "button",
        locale,
      });
    },
    [locale],
  );

  const codeBasic = '<Button>Salvar</Button>';
  const codeWithIcon = '<Button variant="outline">\n  Cancelar\n  <XCircle className="h-4 w-4 ml-2" />\n</Button>\n<Button>\n  <Mail className="h-4 w-4 mr-2" />\n  Salvar\n</Button>';
  const codeDisabled = '<Button disabled>Desabilitado</Button>';

  return (
    <div className="ds-docs p-8 max-w-5xl mx-auto">

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
              npx shadcn@latest add button
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
              <div className="flex flex-wrap gap-3">
                <Button>{tContent("demonstration.labels.save")}</Button>
                <Button variant="outline">{tContent("demonstration.labels.cancel")}</Button>
                <Button variant="destructive">{tContent("demonstration.labels.delete")}</Button>
              </div>
            </ComponentDemo>
          </section>

          <section id="anatomia">
            <h2 className="text-xl font-semibold mb-4">{tContent("anatomy.title")}</h2>
            <ComponentDemo>
              <div className="space-y-4 w-full">
                <ol className="space-y-3 text-sm list-none p-0 m-0">
                  {[1, 2, 3].map(i => (
                    <li key={i} className="flex gap-3 list-none">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{i}</span>
                      <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent(`anatomy.item${i}`)) }} />
                    </li>
                  ))}
                </ol>
                <div className="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4">
                  <p className="text-xs text-muted-foreground mb-2">{tContent("anatomy.structureLabel")}</p>
                  <pre className="text-xs font-mono leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent("anatomy.structureCode")) }} />
                </div>
              </div>
            </ComponentDemo>
          </section>

          <section id="quando-usar">
            <h2 className="text-xl font-semibold mb-4">{tContent("usage.title")}</h2>
            <div className="border rounded-xl p-6 shadow-sm space-y-6">
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium text-sm">{tContent("usage.guidelines.title")}</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                        {[1, 2, 3, 4].map(i => <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent(`usage.guidelines.item${i}`)) }} />)}
                    </ul>
                </div>

                <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-border text-left bg-muted/50 font-medium">
                                    <th className="p-3 border-r border-border">{tContent("usage.scenarios.cols.scenario")}</th>
                                    <th className="p-3 border-r border-border">{tContent("usage.scenarios.cols.use")}</th>
                                    <th className="p-3">{tContent("usage.scenarios.cols.alternative")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3].map(i => (
                                    <tr key={i} className="border-b border-border hover:bg-muted/5">
                                        <td className="p-3 border-r border-border">{tContent(`usage.scenarios.item${i}.s`)}</td>
                                        <td className="p-3 border-r border-border font-medium text-primary">{tContent(`usage.scenarios.item${i}.u`)}</td>
                                        <td className="p-3 text-muted-foreground">{tContent(`usage.scenarios.item${i}.a`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                </div>

                <div className="space-y-3">
                    <h3 className="font-medium text-sm">{tContent("uxWriting.title")}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/70 text-left">
                                    <th className="p-3 border-r border-border font-semibold">{tContent("uxWriting.table.element")}</th>
                                    <th className="p-3 border-r border-border font-semibold">{tContent("uxWriting.table.rules")}</th>
                                    <th className="p-3 border-r border-border font-semibold text-green-700 dark:text-green-400"><span className="flex items-center gap-1.5"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>{tContent("uxWriting.table.correct")}</span></th>
                                    <th className="p-3 font-semibold text-red-700 dark:text-red-400"><span className="flex items-center gap-1.5"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>{tContent("uxWriting.table.avoid")}</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {['label', 'destructive', 'cancel'].map(key => (
                                    <tr key={key} className="border-b border-border last:border-0 hover:bg-muted/5">
                                        <td className="p-3 border-r border-border font-medium">{tContent(`uxWriting.table.${key}.name`)}</td>
                                        <td className="p-3 border-r border-border">{tContent(`uxWriting.table.${key}.format`)}</td>
                                        <td className="p-3 border-r border-border font-medium text-green-600 dark:text-green-500">{tContent(`uxWriting.table.${key}.good`)}</td>
                                        <td className="p-3 font-medium text-red-600 dark:text-red-500">{tContent(`uxWriting.table.${key}.bad`)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-green-600 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                      {tContent("usage.do.title")}
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
                      {[1, 2, 3, 4].map(i => <li key={i}>{tContent(`usage.do.item${i}`)}</li>)}
                    </ul>
                  </div>
                  <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-red-600 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                        {tContent("usage.dont.title")}
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
                      {[1, 2, 3].map(i => <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent(`usage.dont.item${i}`)) }} />)}
                    </ul>
                  </div>
                </div>
            </div>
          </section>

          <section id="do-dont">
            <h2 className="text-xl font-semibold mb-4">{tContent("doDont.title")}</h2>
            <ComponentDemo>
               <div className="space-y-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                      <span className="text-sm font-semibold uppercase tracking-wider">{tNav("common.do")}</span>
                    </div>
                    <div className="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10 flex gap-2">
                        <Button variant="outline">{tContent("demonstration.labels.cancel")}</Button>
                        <Button>{tContent("demonstration.labels.save")}</Button>
                    </div>
                    <p className="text-sm text-muted-foreground italic px-1">{tContent("doDont.pair1.do")}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                      <span className="text-sm font-semibold uppercase tracking-wider">{tNav("common.dont")}</span>
                    </div>
                    <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10 flex gap-2">
                        <Button>OK</Button>
                        <Button>Click here</Button>
                    </div>
                    <p className="text-sm text-muted-foreground italic px-1">{tContent("doDont.pair1.dont")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                      <span className="text-sm font-semibold uppercase tracking-wider">{tNav("common.do")}</span>
                    </div>
                    <div className="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
                      <Button size="icon" aria-label="Close dialog">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground italic px-1" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent("doDont.pair2.do")) }} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                      <span className="text-sm font-semibold uppercase tracking-wider">{tNav("common.dont")}</span>
                    </div>
                    <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
                      <Button size="icon">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground italic px-1" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent("doDont.pair2.dont")) }} />
                  </div>
                </div>
               </div>
            </ComponentDemo>
          </section>

          <section id="importacao">
            <h2 className="text-xl font-semibold mb-4">{tContent("import.title")}</h2>
            <ComponentDemo>
              <div className="space-y-4 w-full">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">{tContent("import.basic")}</p>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm border">
                    {`import { Button } from "@/components/ui/button"`}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-3">{tContent("import.variants")}</p>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm border">
                    {`import { buttonVariants } from "@/components/ui/button"`}
                  </div>
                </div>
              </div>
            </ComponentDemo>
          </section>

          <section id="exemplos">
            <h2 className="text-xl font-semibold mb-4">{tContent("examples.title")}</h2>
            <div className="space-y-8">
                <div className="space-y-3">
                    <h3 className="text-sm font-medium">{tContent("examples.basic")}</h3>
                    <ComponentDemo>
                        <Button>{tContent("demonstration.labels.save")}</Button>
                    </ComponentDemo>
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code className="whitespace-pre">{codeBasic}</code></div>
                </div>
                <div className="space-y-3">
                    <h3 className="text-sm font-medium">{tContent("examples.withIcon")}</h3>
                    <ComponentDemo>
                        <div className="flex gap-4">
                            <Button variant="outline">
                                {tContent("demonstration.labels.cancel")}
                                <XCircle className="h-4 w-4 ml-2" />
                            </Button>
                            <Button>
                                <Mail className="h-4 w-4 mr-2" />
                                {tContent("demonstration.labels.save")}
                            </Button>
                        </div>
                    </ComponentDemo>
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code className="whitespace-pre">{codeWithIcon}</code></div>
                </div>
                <div className="space-y-3">
                    <h3 className="text-sm font-medium">{tContent("examples.disabled")}</h3>
                    <ComponentDemo>
                        <Button disabled>{tContent("examples.disabled")}</Button>
                    </ComponentDemo>
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code className="whitespace-pre">{codeDisabled}</code></div>
                </div>
            </div>
          </section>

          <section id="variantes">
            <h2 className="text-xl font-semibold mb-6">{tContent("variants.title")}</h2>
            <div className="space-y-12">
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-6 px-1">
                        {tContent("variants.visualTitle")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {(
                        [
                        { variant: "default",     label: 'default',     desc: tContent("variants.items.default") },
                        { variant: "secondary",   label: 'secondary',   desc: tContent("variants.items.secondary") },
                        { variant: "outline",     label: 'outline',     desc: tContent("variants.items.outline") },
                        { variant: "ghost",       label: 'ghost',       desc: tContent("variants.items.ghost") },
                        { variant: "link",        label: 'link',        desc: tContent("variants.items.link") },
                        { variant: "destructive", label: 'destructive', desc: tContent("variants.items.destructive") },
                        ] as const
                    ).map(({ variant, label, desc }) => (
                        <div key={variant} className="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-all hover:border-primary/30 hover:shadow-sm">
                            <div className="flex-1 flex items-center justify-center p-8 bg-muted/5 min-h-[140px]">
                                <Button variant={variant}>{tContent("title")}</Button>
                            </div>
                            <div className="p-4 border-t border-border/40 bg-muted/10 space-y-1">
                                <p className="text-[11px] uppercase font-mono text-primary font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">
                                    {label}
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-6 px-1">
                        {tContent("variants.sizeTitle")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                        {(
                            [
                                { size: "sm",      label: 'sm',      desc: tContent("variants.sizes.sm"),      use: tContent("variants.sizes.smUse") },
                                { size: "default", label: 'default', desc: tContent("variants.sizes.default"), use: tContent("variants.sizes.defaultUse") },
                                { size: "lg",      label: 'lg',      desc: tContent("variants.sizes.lg"),      use: tContent("variants.sizes.lgUse") },
                                { size: "icon",    label: 'icon',    desc: tContent("variants.sizes.icon"),    use: tContent("variants.sizes.iconUse") },
                            ] as const
                        ).map(({ size, label, desc, use }) => (
                            <div key={size} className="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-all hover:border-primary/30 hover:shadow-sm">
                                <div className="flex-1 flex items-center justify-center p-6 bg-muted/5 min-h-[100px]">
                                    <Button size={size}>
                                        {size === 'icon' ? <Mail className="h-4 w-4" /> : tContent("title")}
                                    </Button>
                                </div>
                                <div className="p-3 border-t border-border/40 bg-muted/10 space-y-1">
                                    <p className="text-[11px] uppercase font-mono text-primary font-bold block">{label}</p>
                                    <p className="text-xs text-muted-foreground">{desc}</p>
                                    <p className="text-xs text-muted-foreground/70 italic">{use}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </section>

          <section id="estados">
            <h2 className="text-xl font-semibold mb-4">{tContent("states.title")}</h2>
            <div className="border rounded-xl overflow-x-auto p-4 shadow-sm">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left bg-muted/50">
                      <th className="p-3 border-r border-border font-medium">{tContent("states.table.state")}</th>
                      <th className="p-3 border-r border-border font-medium">{tContent("states.table.visual")}</th>
                      <th className="p-3 font-medium">{tContent("states.table.trigger")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border hover:bg-muted/5 transition-colors">
                      <td className="p-3 border-r border-border font-medium">Default</td>
                      <td className="p-3 border-r border-border"><Button size="sm">{tContent("demonstration.labels.save")}</Button></td>
                      <td className="p-3 text-muted-foreground">{tContent("states.table.initial")}</td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/5 transition-colors">
                      <td className="p-3 border-r border-border font-medium">Hover</td>
                      <td className="p-3 border-r border-border text-muted-foreground italic">{tContent("states.table.hover")}</td>
                      <td className="p-3 text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent("states.table.hoverTrigger")) }} />
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/5 transition-colors">
                      <td className="p-3 border-r border-border font-medium">Focus</td>
                      <td className="p-3 border-r border-border"><Button size="sm" className="ring-[3px] ring-ring/50 border-ring">{tContent("demonstration.labels.save")}</Button></td>
                      <td className="p-3 text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent("states.table.focusTrigger")) }} />
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/5 transition-colors">
                      <td className="p-3 border-r border-border font-medium">Disabled</td>
                      <td className="p-3 border-r border-border"><Button disabled size="sm">{tContent("demonstration.labels.save")}</Button></td>
                      <td className="p-3 text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent("states.table.disabledTrigger")) }} />
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/5 transition-colors">
                      <td className="p-3 border-r border-border font-medium">Loading</td>
                      <td className="p-3 border-r border-border"><Button disabled size="sm"><Loader2 className="h-4 w-4 animate-spin" />Aguarde…</Button></td>
                      <td className="p-3 text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent("states.table.loadingTrigger")) }} />
                    </tr>
                    <tr className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                      <td className="p-3 border-r border-border font-medium">aria-invalid</td>
                      <td className="p-3 border-r border-border"><Button size="sm" aria-invalid="true">{tContent("demonstration.labels.save")}</Button></td>
                      <td className="p-3 text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent("states.table.invalidTrigger")) }} />
                    </tr>
                  </tbody>
                </table>
            </div>
          </section>

          <section id="propriedades">
            <h2 className="text-xl font-semibold mb-4">{tContent("props.title")}</h2>
            <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-sm mb-3">{tContent("props.interface")}</h3>
                  <div className="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed">
{`interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}`}
                  </div>
                </div>

                <div className="border rounded-xl overflow-x-auto p-4 shadow-sm">
                    <table className="w-full border-collapse text-sm" style={{ margin: 0 }}>
                        <thead className="bg-muted/50 border-b text-left">
                            <tr>
                                <th className="p-3 border-r border-border font-semibold">{tContent("props.table.prop")}</th>
                                <th className="p-3 border-r border-border font-semibold">{tContent("props.table.type")}</th>
                                <th className="p-3 border-r border-border font-semibold">{tContent("props.table.default")}</th>
                                <th className="p-3 border-r border-border font-semibold">{tContent("props.table.required")}</th>
                                <th className="p-3 font-semibold">{tContent("props.table.description")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {([
                                { name: 'variant',   type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"', def: '"default"', req: 'Não', desc: tContent("props.table.variant") },
                                { name: 'size',      type: '"default" | "sm" | "lg" | "icon"',                                       def: '"default"', req: 'Não', desc: tContent("props.table.size") },
                                { name: 'disabled',  type: 'boolean',                                                                 def: 'false',     req: 'Não', desc: tContent("props.table.disabled") },
                                { name: 'asChild',   type: 'boolean',                                                                 def: 'false',     req: 'Não', desc: tContent("props.table.asChild") },
                                { name: 'onClick',   type: '(event: React.MouseEvent) => void',                                      def: '—',         req: 'Não', desc: tContent("props.table.onClick") },
                                { name: 'type',      type: '"button" | "submit" | "reset"',                                          def: '"button"',   req: 'Não', desc: tContent("props.table.type") },
                                { name: 'className', type: 'string',                                                                  def: '—',         req: 'Não', desc: tContent("props.table.className") },
                            ] as const).map(prop => (
                                <tr key={prop.name} className="border-b last:border-0 hover:bg-muted/5">
                                    <td className="p-3 border-r border-border font-mono font-bold text-primary">{prop.name}</td>
                                    <td className="p-3 border-r border-border font-mono text-muted-foreground">{prop.type}</td>
                                    <td className="p-3 border-r border-border font-mono">{prop.def}</td>
                                    <td className="p-3 border-r border-border text-muted-foreground">{prop.req}</td>
                                    <td className="p-3 text-muted-foreground">{prop.desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-3">
                    <h3 className="font-medium text-sm">{tContent("props.extensibilityTitle")}</h3>
                    <div className="space-y-3">
                        {(['classNameNote', 'asChildNote'] as const).map(key => (
                            <p key={key} className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border"
                               dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent(`props.extensibility.${key}`)) }} />
                        ))}
                    </div>
                </div>
            </div>
          </section>

          <section id="tokens">
            <h2 className="text-xl font-semibold mb-4">{tContent("tokens.title")}</h2>
            <div className="space-y-6">
                <div className="border rounded-xl overflow-x-auto p-4 shadow-sm">
                    <table className="w-full border-collapse text-sm" style={{ margin: 0 }}>
                      <thead>
                        <tr className="border-b border-border bg-muted/50 text-left">
                          <th className="p-3 border-r border-border font-medium">{tContent("tokens.table.token")}</th>
                          <th className="p-3 border-r border-border font-medium">{tContent("tokens.table.class")}</th>
                          <th className="p-3 font-medium">{tContent("tokens.table.part")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { token: '--primary',            cls: 'bg-primary',             part: tContent("tokens.table.primary")            },
                          { token: '--primary-foreground', cls: 'text-primary-foreground', part: tContent("tokens.table.primaryForeground")  },
                          { token: '--secondary',          cls: 'bg-secondary',           part: tContent("tokens.table.secondary")           },
                          { token: '--destructive',        cls: 'bg-destructive',         part: tContent("tokens.table.destructive")         },
                          { token: '--border',             cls: 'border-border',          part: tContent("tokens.table.border")             },
                          { token: '--ring',               cls: 'ring-ring',              part: tContent("tokens.table.ring")               },
                          { token: '--radius',             cls: 'rounded-md',             part: tContent("tokens.table.radius")             },
                        ].map(row => (
                          <tr key={row.token} className="border-b last:border-0 hover:bg-muted/5 transition-colors">
                            <td className="p-3 border-r border-border font-mono text-primary font-medium"><code>{row.token}</code></td>
                            <td className="p-3 border-r border-border font-mono text-primary"><code>{row.cls}</code></td>
                            <td className="p-3 text-muted-foreground">{row.part}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
                <div className="space-y-2">
                    <h3 className="font-medium text-sm">{tContent("tokens.customizationTitle")}</h3>
                    <div className="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed">
{`/* Em globals.css ou theme-custom.css */
html.meu-tema {
  --primary: 262 80% 58%; /* Roxo — light mode */
  --primary-foreground: 0 0% 100%;
}
html.meu-tema.dark {
  --primary: 262 60% 75%; /* Roxo — dark mode */
  --primary-foreground: 0 0% 100%;
}`}
                    </div>
                </div>
            </div>
          </section>

          <section id="acessibilidade">
            <h2 className="text-xl font-semibold mb-4">{tContent("accessibility.title")}</h2>
            <div className="border rounded-xl p-6 shadow-sm space-y-6">
                <ul className="space-y-3 text-sm text-muted-foreground list-disc pl-5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent(`accessibility.item${i}`)) }} />
                    ))}
                </ul>
                <div className="space-y-4">
                    <h3 className="font-medium text-sm">{tContent("accessibility.keyboardTitle")}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['tab', 'enter', 'space'].map(key => (
                            <div key={key} className="bg-muted/30 border rounded-xl p-4">
                                <code className="text-[10px] bg-muted px-2 py-0.5 rounded-md uppercase font-bold text-primary border border-border/60 block mb-2">
                                    {key}
                                </code>
                                <p className="text-xs text-muted-foreground leading-relaxed">{tContent(`accessibility.keyboard.${key}`)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </section>

          <section id="relacionados">
            <h2 className="text-xl font-semibold mb-4">{tContent("related.title")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                    { name: 'Toggle',        desc: tContent("related.toggle"),   path: '?path=/docs/ui-toggle--docs' },
                    { name: 'Dropdown Menu', desc: tContent("related.dropdown"), path: '?path=/docs/ui-dropdownmenu--docs' },
                ] as const).map(item => (
                    <div key={item.name} role="link" tabIndex={0}
                         onClick={() => { (window.top ?? window).location.href = item.path; }}
                         onKeyDown={(e) => { if (e.key === 'Enter') (window.top ?? window).location.href = item.path; }}
                         className="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
                        <h4 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                ))}
            </div>
          </section>

          <section id="notas">
            <h2 className="text-xl font-semibold mb-4">{tContent("notes.title")}</h2>
            <div className="space-y-4">
                <div className="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                    <p className="text-sm text-muted-foreground leading-relaxed">{tContent("notes.tip1")}</p>
                </div>
                <div className="p-4 bg-orange-500/5 border-l-4 border-orange-500 rounded-r-lg">
                    <p className="text-sm text-muted-foreground leading-relaxed">{tContent("notes.tip2")}</p>
                </div>
            </div>
          </section>

          <section id="analytics">
            <h2 className="text-xl font-semibold mb-4">{tContent("analytics.title")}</h2>
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{tContent("analytics.description")}</p>
                <div className="border rounded-xl overflow-x-auto p-4 shadow-sm">
                    <table className="w-full border-collapse text-sm" style={{ margin: 0 }}>
                        <thead>
                            <tr className="bg-muted/50 border-b text-left">
                                <th className="p-3 border-r border-border font-semibold">{tContent("analytics.table.event")}</th>
                                <th className="p-3 border-r border-border font-semibold">{tContent("analytics.table.trigger")}</th>
                                <th className="p-3 font-semibold">{tContent("analytics.table.payload")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {([
                                { event: 'pageView',      key: 'pageView' },
                                { event: 'sectionViewed', key: 'sectionViewed' },
                                { event: 'langSwitch',    key: 'langSwitch' },
                                { event: 'click',         key: 'click' },
                            ] as const).map(row => (
                                <tr key={row.key} className="border-b last:border-0 hover:bg-muted/5">
                                    <td className="p-3 border-r border-border font-mono text-primary font-bold">{tContent(`analytics.table.${row.key}`)}</td>
                                    <td className="p-3 border-r border-border">{tContent(`analytics.table.${row.key}Trigger`)}</td>
                                    <td className="p-3 font-mono text-muted-foreground">{tContent(`analytics.table.${row.key}Payload`)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </section>

          <section id="testes">
            <h2 className="text-xl font-semibold mb-6">{tContent("testes.title")}</h2>
            <div className="space-y-8">

              {/* Comportamento Funcional */}
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  {tContent("testes.functional.title")}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">{tContent("testes.functional.description")}</p>
                <div className="border rounded-xl overflow-x-auto p-4 shadow-sm">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-muted/50 border-b text-left">
                      <tr>
                        <th className="p-4 border-r border-border font-semibold">{tNav("common.userAction")}</th>
                        <th className="p-4 border-r border-border font-semibold">{tNav("common.expectedResult")}</th>
                        <th className="p-4 font-semibold w-24">{tNav("common.priority")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([1, 2, 3, 4, 5, 6] as const).map((i) => {
                        const p = tContent(`testes.functional.item${i}.priority`);
                        const isHigh = p === "high";
                        return (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/5">
                            <td className="p-4 border-r border-border font-medium">{tContent(`testes.functional.item${i}.action`)}</td>
                            <td className="p-4 border-r border-border text-muted-foreground">{tContent(`testes.functional.item${i}.result`)}</td>
                            <td className="p-4">
                              <Badge className={isHigh
                                ? "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10 h-5 font-medium text-[11px]"
                                : "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10 h-5 font-medium text-[11px]"
                              }>
                                {isHigh ? tNav("common.high") : tNav("common.medium")}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Acessibilidade Verificável */}
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  {tContent("testes.accessibility.title")}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">{tContent("testes.accessibility.description")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([1, 2, 3, 4, 5, 6] as const).map((i) => (
                    <div key={i} className="flex gap-3 items-start p-4 bg-muted/10 rounded-lg border border-border/40">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] text-primary font-bold italic">axe</span>
                      </div>
                      <span className="text-xs text-muted-foreground leading-relaxed">{tContent(`testes.accessibility.item${i}`)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regressão Visual */}
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  {tContent("testes.visual.title")}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">{tContent("testes.visual.description")}</p>
                <div className="border rounded-xl overflow-x-auto p-4 shadow-sm">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-muted/50 border-b text-left">
                      <tr>
                        <th className="p-4 border-r border-border font-semibold">{tNav("common.storyState")}</th>
                        <th className="p-4 border-r border-border font-semibold text-center w-32">{tNav("common.themeLight")}</th>
                        <th className="p-4 border-r border-border font-semibold text-center w-32">{tNav("common.themeDark")}</th>
                        <th className="p-4 font-semibold w-24">{tNav("common.priority")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([1, 2, 3, 4, 5, 6, 7] as const).map((i) => {
                        const p = tContent(`testes.visual.item${i}.priority`);
                        const isHigh = p === "high";
                        return (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/5">
                            <td className="p-4 border-r border-border font-medium">{tContent(`testes.visual.item${i}.story`)}</td>
                            <td className="p-4 border-r border-border text-center text-emerald-600 font-medium">{tContent("testes.visual.required")}</td>
                            <td className="p-4 border-r border-border text-center text-emerald-600 font-medium">{tContent("testes.visual.required")}</td>
                            <td className="p-4">
                              <Badge className={isHigh
                                ? "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10 h-5 font-medium text-[11px]"
                                : "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10 h-5 font-medium text-[11px]"
                              }>
                                {isHigh ? tNav("common.high") : tNav("common.medium")}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
