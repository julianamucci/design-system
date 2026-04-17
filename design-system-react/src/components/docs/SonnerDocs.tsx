import { useCallback, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { ComponentDemo } from "@/components/ComponentDemo";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/product/LanguageSwitcher";
import { useSeoEffect } from "@/lib/use-seo";
import { track } from "@/lib/analytics";
import { sanitizeHtml } from "@/lib/sanitize-html";
import uiTranslations from "@/i18n/ui.json";
import sonnerTranslations from "@shared/content/sonner/translations.json";
import { toast } from "sonner";

// ─── Navegação interna ────────────────────────────────────────────────────────

const getNavGroups = (t: any) => [
  {
    label: t("nav.overview"),
    sections: [
      { id: "demonstracao", label: t("nav.demonstration") },
      { id: "anatomia",     label: t("nav.anatomy")       },
      { id: "quando-usar",  label: t("nav.usage")         },
      { id: "do-dont",      label: t("nav.doDont")        },
    ],
  },
  {
    label: t("nav.techRef"),
    sections: [
      { id: "importacao",   label: t("nav.import")        },
      { id: "exemplos",     label: t("nav.examples")      },
      { id: "variantes",    label: t("nav.variants")      },
      { id: "estados",      label: t("nav.states")        },
      { id: "propriedades", label: t("nav.props")         },
      { id: "tokens",       label: t("nav.tokens")        },
    ],
  },
  {
    label: t("nav.context"),
    sections: [
      { id: "acessibilidade", label: t("nav.accessibility") },
      { id: "relacionados",   label: t("nav.related")       },
      { id: "notas",          label: t("nav.notes")         },
    ],
  },
  {
    label: t("nav.quality"),
    sections: [
      { id: "analytics", label: t("nav.analytics") },
      { id: "testes",    label: t("nav.testes")    },
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

export function SonnerDocs() {
  const { t: tNav } = useTranslation(uiTranslations);
  const { t: tContent, locale } = useTranslation(sonnerTranslations);

  const navGroups = useMemo(() => getNavGroups(tNav), [tNav]);
  const allIds = useMemo(() => navGroups.flatMap((g) => g.sections.map((s) => s.id)), [navGroups]);

  useSeoEffect({
    title: `${tContent("title")} — ${tContent("category")}`,
    description: tContent("seo.description"),
    locale,
    componentSlug: "sonner",
  });

  useEffect(() => {
    track("docs_page_view", {
      component_name: "sonner",
      locale,
      page_title: `${tContent("title")} · Design System`,
    });
  }, [locale, tContent]);

  const handleSectionChange = useCallback(
    (id: string) => {
      track("docs_section_viewed", {
        section_id: id,
        component_name: "sonner",
        locale,
      });
    },
    [locale],
  );

  const handleDemoClick = useCallback(
    (toastType: string) => {
      track("toast_demo_triggered", {
        toast_type: toastType,
        component_name: "sonner",
      });
    },
    [],
  );

  const codeProvider = `import { Toaster } from "@/components/ui/sonner"`;
  const codeToast = `import { toast } from "sonner"`;
  const codeBasic = `toast("Item salvo com sucesso")`;
  const codeTypes = `toast.success("Salvo com sucesso")
toast.error("Falha ao salvar")
toast.warning("Conexão instável")
toast.info("Nova versão disponível")
toast.loading("Processando...")`;
  const codeAction = `toast("Item excluído", {
  action: {
    label: "Desfazer",
    onClick: () => handleUndo(),
  },
})`;
  const codeDescription = `toast("Relatório gerado", {
  description: "O arquivo estará disponível em instantes.",
})`;
  const codePromise = `toast.promise(saveData(), {
  loading: "Salvando...",
  success: "Dados salvos!",
  error: "Erro ao salvar",
})`;
  const codeCustom = `<Toaster position="bottom-center" richColors />`;

  return (
    <div className="ds-docs p-8 max-w-5xl mx-auto">
      <Toaster position="top-right" richColors closeButton />

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
              npx shadcn@latest add sonner
            </code>
          </span>
        </div>
      </header>

      <div className="flex gap-16 items-start">
        <ComponentDocsSidebar navGroups={navGroups} allIds={allIds} onSectionChange={handleSectionChange} />
        <div className="ds-docs flex-1 space-y-12">

          {/* ── Demonstração ─────────────────────────────────────────── */}
          <section id="demonstracao">
            <h2 className="text-xl font-semibold mb-4">{tContent("demonstration.title")}</h2>
            <ComponentDemo>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => { handleDemoClick("default"); toast(tContent("demonstration.labels.default")); }}>
                  {tContent("demonstration.labels.default")}
                </Button>
                <Button variant="outline" onClick={() => { handleDemoClick("success"); toast.success(tContent("demonstration.labels.success")); }}>
                  {tContent("demonstration.labels.success")}
                </Button>
                <Button variant="outline" onClick={() => { handleDemoClick("error"); toast.error(tContent("demonstration.labels.error")); }}>
                  {tContent("demonstration.labels.error")}
                </Button>
                <Button variant="outline" onClick={() => { handleDemoClick("warning"); toast.warning(tContent("demonstration.labels.warning")); }}>
                  {tContent("demonstration.labels.warning")}
                </Button>
                <Button variant="outline" onClick={() => { handleDemoClick("info"); toast.info(tContent("demonstration.labels.info")); }}>
                  {tContent("demonstration.labels.info")}
                </Button>
                <Button variant="outline" onClick={() => { handleDemoClick("loading"); toast.loading(tContent("demonstration.labels.loading")); }}>
                  {tContent("demonstration.labels.loading")}
                </Button>
                <Button variant="secondary" onClick={() => { handleDemoClick("dismiss"); toast.dismiss(); }}>
                  {tContent("demonstration.labels.dismiss")}
                </Button>
              </div>
            </ComponentDemo>
          </section>

          {/* ── Anatomia ─────────────────────────────────────────────── */}
          <section id="anatomia">
            <h2 className="text-xl font-semibold mb-4">{tContent("anatomy.title")}</h2>
            <ComponentDemo>
              <div className="space-y-4 w-full">
                <ol className="space-y-3 text-sm list-none p-0 m-0">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
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

          {/* ── Quando Usar ──────────────────────────────────────────── */}
          <section id="quando-usar">
            <h2 className="text-xl font-semibold mb-4">{tContent("usage.title")}</h2>
            <div className="border rounded-xl p-6 shadow-sm space-y-6">
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-sm">{tContent("usage.guidelines.title")}</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  {[1, 2, 3, 4, 5].map(i => <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent(`usage.guidelines.item${i}`)) }} />)}
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
                    {[1, 2, 3, 4, 5].map(i => (
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
                      {(['title', 'description', 'action', 'error'] as const).map(key => (
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

          {/* ── Do & Don't ───────────────────────────────────────────── */}
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
                    <div className="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
                      <div className="bg-background border rounded-lg p-3 shadow-sm flex items-start gap-3 max-w-xs">
                        <span className="text-green-500 text-lg mt-0.5">✓</span>
                        <div>
                          <p className="text-sm font-medium">Item salvo</p>
                          <p className="text-xs text-muted-foreground">As alterações foram aplicadas.</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic px-1">{tContent("doDont.pair1.do")}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                      <span className="text-sm font-semibold uppercase tracking-wider">{tNav("common.dont")}</span>
                    </div>
                    <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
                      <div className="bg-background border rounded-lg p-3 shadow-sm max-w-xs">
                        <p className="text-sm font-medium">Sucesso!</p>
                      </div>
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
                      <div className="bg-background border border-red-200 dark:border-red-800 rounded-lg p-3 shadow-sm max-w-xs">
                        <p className="text-sm font-medium text-red-600">Falha ao salvar</p>
                        <p className="text-xs text-muted-foreground">Verifique sua conexão e tente novamente.</p>
                        <button className="mt-2 text-xs font-medium text-primary hover:underline">Tentar novamente</button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic px-1">{tContent("doDont.pair2.do")}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                      <span className="text-sm font-semibold uppercase tracking-wider">{tNav("common.dont")}</span>
                    </div>
                    <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
                      <div className="bg-background border rounded-lg p-3 shadow-sm max-w-xs">
                        <p className="text-sm font-medium">Erro 500</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic px-1">{tContent("doDont.pair2.dont")}</p>
                  </div>
                </div>
              </div>
            </ComponentDemo>
          </section>

          {/* ── Importação ───────────────────────────────────────────── */}
          <section id="importacao">
            <h2 className="text-xl font-semibold mb-4">{tContent("import.title")}</h2>
            <ComponentDemo>
              <div className="space-y-4 w-full">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">{tContent("import.basic")}</p>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm border">
                    {codeProvider}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-3">{tContent("import.usage")}</p>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm border">
                    {codeToast}
                  </div>
                </div>
              </div>
            </ComponentDemo>
          </section>

          {/* ── Exemplos de Código ────────────────────────────────────── */}
          <section id="exemplos">
            <h2 className="text-xl font-semibold mb-4">{tContent("examples.title")}</h2>
            <div className="space-y-8">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{tContent("examples.basic")}</h3>
                <ComponentDemo>
                  <Button onClick={() => toast("Item salvo com sucesso")}>
                    {tContent("demonstration.labels.default")}
                  </Button>
                </ComponentDemo>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code className="whitespace-pre">{codeBasic}</code></div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{tContent("examples.types")}</h3>
                <ComponentDemo>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => toast.success("Salvo com sucesso")}>{tContent("demonstration.labels.success")}</Button>
                    <Button variant="outline" onClick={() => toast.error("Falha ao salvar")}>{tContent("demonstration.labels.error")}</Button>
                    <Button variant="outline" onClick={() => toast.warning("Conexão instável")}>{tContent("demonstration.labels.warning")}</Button>
                    <Button variant="outline" onClick={() => toast.info("Nova versão disponível")}>{tContent("demonstration.labels.info")}</Button>
                  </div>
                </ComponentDemo>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code className="whitespace-pre">{codeTypes}</code></div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{tContent("examples.withAction")}</h3>
                <ComponentDemo>
                  <Button variant="outline" onClick={() => toast("Item excluído", { action: { label: "Desfazer", onClick: () => toast.success("Desfeito!") } })}>
                    {tContent("demonstration.labels.action")}
                  </Button>
                </ComponentDemo>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code className="whitespace-pre">{codeAction}</code></div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{tContent("examples.withDescription")}</h3>
                <ComponentDemo>
                  <Button variant="outline" onClick={() => toast("Relatório gerado", { description: "O arquivo estará disponível em instantes." })}>
                    {tContent("demonstration.labels.description")}
                  </Button>
                </ComponentDemo>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code className="whitespace-pre">{codeDescription}</code></div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{tContent("examples.promise")}</h3>
                <ComponentDemo>
                  <Button variant="outline" onClick={() => toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), { loading: "Salvando...", success: "Dados salvos!", error: "Erro ao salvar" })}>
                    {tContent("demonstration.labels.promise")}
                  </Button>
                </ComponentDemo>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code className="whitespace-pre">{codePromise}</code></div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{tContent("examples.custom")}</h3>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code className="whitespace-pre">{codeCustom}</code></div>
              </div>
            </div>
          </section>

          {/* ── Tipos de Toast ────────────────────────────────────────── */}
          <section id="variantes">
            <h2 className="text-xl font-semibold mb-6">{tContent("variants.title")}</h2>
            <div className="space-y-12">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-6 px-1">
                  {tContent("variants.typesTitle")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  {([
                    { type: "default", color: "bg-background border" },
                    { type: "success", color: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
                    { type: "error",   color: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
                    { type: "warning", color: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800" },
                    { type: "info",    color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
                    { type: "loading", color: "bg-background border" },
                  ] as const).map(({ type, color }) => (
                    <div key={type} className="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-all hover:border-primary/30 hover:shadow-sm">
                      <div className="flex-1 flex items-center justify-center p-8 bg-muted/5 min-h-[140px]">
                        <div className={`rounded-lg p-3 shadow-sm border max-w-[200px] w-full ${color}`}>
                          <p className="text-sm font-medium">{type === "default" ? "Notificação" : type === "loading" ? "Processando..." : type}</p>
                        </div>
                      </div>
                      <div className="p-4 border-t border-border/40 bg-muted/10 space-y-1">
                        <p className="text-[11px] uppercase font-mono text-primary font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">
                          {type}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tContent(`variants.items.${type}`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-6 px-1">
                  {tContent("variants.positionTitle")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  {([
                    "top-right", "top-center", "top-left",
                    "bottom-right", "bottom-center", "bottom-left",
                  ] as const).map((pos) => (
                    <div key={pos} className="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-all hover:border-primary/30 hover:shadow-sm">
                      <div className="flex-1 flex items-center justify-center p-6 bg-muted/5 min-h-[100px]">
                        <div className="w-24 h-16 border border-border/60 rounded-md relative bg-muted/20">
                          <div className={[
                            "absolute w-8 h-2 bg-primary/60 rounded-sm",
                            pos === "top-right" ? "top-1 right-1" :
                            pos === "top-center" ? "top-1 left-1/2 -translate-x-1/2" :
                            pos === "top-left" ? "top-1 left-1" :
                            pos === "bottom-right" ? "bottom-1 right-1" :
                            pos === "bottom-center" ? "bottom-1 left-1/2 -translate-x-1/2" :
                            "bottom-1 left-1",
                          ].join(" ")} />
                        </div>
                      </div>
                      <div className="p-3 border-t border-border/40 bg-muted/10 space-y-1">
                        <p className="text-[11px] uppercase font-mono text-primary font-bold block">{tContent(`variants.positions.${pos}`)}</p>
                        <p className="text-xs text-muted-foreground/70 italic">{tContent(`variants.positions.${pos}Use`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Estados ───────────────────────────────────────────────── */}
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
                  {([
                    { state: "Visible",     visual: tContent("states.table.visible"),    trigger: tContent("states.table.visibleTrigger") },
                    { state: "Expanded",    visual: tContent("states.table.expanded"),   trigger: tContent("states.table.expandedTrigger") },
                    { state: "Dismissing",  visual: tContent("states.table.dismissing"), trigger: tContent("states.table.dismissingTrigger") },
                    { state: "Action",      visual: tContent("states.table.action"),     trigger: tContent("states.table.actionTrigger") },
                    { state: "Rich Colors", visual: tContent("states.table.richColors"), trigger: tContent("states.table.richColorsTrigger") },
                  ] as const).map((row) => (
                    <tr key={row.state} className="border-b border-border hover:bg-muted/5 transition-colors">
                      <td className="p-3 border-r border-border font-medium">{row.state}</td>
                      <td className="p-3 border-r border-border text-muted-foreground">{row.visual}</td>
                      <td className="p-3 text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeHtml(row.trigger) }} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Propriedades ──────────────────────────────────────────── */}
          <section id="propriedades">
            <h2 className="text-xl font-semibold mb-4">{tContent("props.title")}</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-sm mb-3">{tContent("props.interface")}</h3>
                <div className="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed">
{`type ToasterProps = React.ComponentProps<typeof Sonner>

// Opções por toast
toast("Título", {
  description?: string
  action?: { label: string; onClick: () => void }
  cancel?: { label: string; onClick: () => void }
  duration?: number
  id?: string | number
  onDismiss?: (toast: ExternalToast) => void
  onAutoClose?: (toast: ExternalToast) => void
  important?: boolean
})`}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 px-1">
                  {tContent("props.toasterTitle")}
                </h3>
                <div className="border rounded-xl overflow-x-auto p-4 shadow-sm">
                  <table className="w-full border-collapse text-sm" style={{ margin: 0 }}>
                    <thead className="bg-muted/50 border-b text-left">
                      <tr>
                        <th className="p-3 border-r border-border font-semibold">{tContent("props.table.prop")}</th>
                        <th className="p-3 border-r border-border font-semibold">{tContent("props.table.type")}</th>
                        <th className="p-3 border-r border-border font-semibold">{tContent("props.table.default")}</th>
                        <th className="p-3 font-semibold">{tContent("props.table.description")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([
                        { name: "position",               type: "Position",              def: '"bottom-right"', desc: tContent("props.table.position") },
                        { name: "theme",                  type: '"light" | "dark" | "system"', def: '"system"', desc: tContent("props.table.theme") },
                        { name: "richColors",             type: "boolean",               def: "false",          desc: tContent("props.table.richColors") },
                        { name: "expand",                 type: "boolean",               def: "false",          desc: tContent("props.table.expand") },
                        { name: "duration",               type: "number",                def: "4000",           desc: tContent("props.table.duration") },
                        { name: "closeButton",            type: "boolean",               def: "false",          desc: tContent("props.table.closeButton") },
                        { name: "offset",                 type: "string | number",       def: '"32px"',         desc: tContent("props.table.offset") },
                        { name: "visibleToasts",          type: "number",                def: "3",              desc: tContent("props.table.visibleToasts") },
                        { name: "toastOptions",           type: "ToastOptions",          def: "{}",             desc: tContent("props.table.toastOptions") },
                        { name: "dir",                    type: '"ltr" | "rtl"',         def: '"ltr"',          desc: tContent("props.table.dir") },
                        { name: "gap",                    type: "number",                def: "14",             desc: tContent("props.table.gap") },
                        { name: "pauseWhenPageIsHidden",  type: "boolean",               def: "false",          desc: tContent("props.table.pauseWhenPageIsHidden") },
                        { name: "className",              type: "string",                def: "—",              desc: tContent("props.table.className") },
                      ] as const).map(prop => (
                        <tr key={prop.name} className="border-b last:border-0 hover:bg-muted/5">
                          <td className="p-3 border-r border-border font-mono font-bold text-primary">{prop.name}</td>
                          <td className="p-3 border-r border-border font-mono text-muted-foreground">{prop.type}</td>
                          <td className="p-3 border-r border-border font-mono">{prop.def}</td>
                          <td className="p-3 text-muted-foreground">{prop.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 px-1">
                  {tContent("props.toastTitle")}
                </h3>
                <div className="border rounded-xl overflow-x-auto p-4 shadow-sm">
                  <table className="w-full border-collapse text-sm" style={{ margin: 0 }}>
                    <thead className="bg-muted/50 border-b text-left">
                      <tr>
                        <th className="p-3 border-r border-border font-semibold">{tContent("props.table.prop")}</th>
                        <th className="p-3 border-r border-border font-semibold">{tContent("props.table.type")}</th>
                        <th className="p-3 font-semibold">{tContent("props.table.description")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([
                        { name: "description", type: "string",                                 desc: tContent("props.toastTable.description") },
                        { name: "action",      type: "{ label: string; onClick: () => void }", desc: tContent("props.toastTable.action") },
                        { name: "cancel",      type: "{ label: string; onClick: () => void }", desc: tContent("props.toastTable.cancel") },
                        { name: "duration",    type: "number",                                 desc: tContent("props.toastTable.duration") },
                        { name: "id",          type: "string | number",                        desc: tContent("props.toastTable.id") },
                        { name: "onDismiss",   type: "(toast: ExternalToast) => void",         desc: tContent("props.toastTable.onDismiss") },
                        { name: "onAutoClose", type: "(toast: ExternalToast) => void",         desc: tContent("props.toastTable.onAutoClose") },
                        { name: "important",   type: "boolean",                                desc: tContent("props.toastTable.important") },
                      ] as const).map(prop => (
                        <tr key={prop.name} className="border-b last:border-0 hover:bg-muted/5">
                          <td className="p-3 border-r border-border font-mono font-bold text-primary">{prop.name}</td>
                          <td className="p-3 border-r border-border font-mono text-muted-foreground">{prop.type}</td>
                          <td className="p-3 text-muted-foreground">{prop.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-sm">{tContent("props.extensibilityTitle")}</h3>
                <div className="space-y-3">
                  {(['classNameNote', 'themeNote'] as const).map(key => (
                    <p key={key} className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border"
                       dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent(`props.extensibility.${key}`)) }} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Tokens ───────────────────────────────────────────────── */}
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
                      { token: "--background",         cls: "bg-background",          part: tContent("tokens.table.background") },
                      { token: "--foreground",         cls: "text-foreground",         part: tContent("tokens.table.foreground") },
                      { token: "--border",             cls: "border-border",           part: tContent("tokens.table.border") },
                      { token: "--primary",            cls: "bg-primary",              part: tContent("tokens.table.primary") },
                      { token: "--primary-foreground", cls: "text-primary-foreground", part: tContent("tokens.table.primaryForeground") },
                      { token: "--muted",              cls: "bg-muted",                part: tContent("tokens.table.muted") },
                      { token: "--muted-foreground",   cls: "text-muted-foreground",   part: tContent("tokens.table.mutedForeground") },
                      { token: "--destructive",        cls: "bg-destructive",          part: tContent("tokens.table.destructive") },
                      { token: "--radius",             cls: "rounded-lg",              part: tContent("tokens.table.radius") },
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
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --border: 214 32% 91%;
}
html.meu-tema.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --border: 217 33% 18%;
}`}
                </div>
              </div>
            </div>
          </section>

          {/* ── Acessibilidade ────────────────────────────────────────── */}
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
                  {['escape', 'tab', 'enter'].map(key => (
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

          {/* ── Relacionados ──────────────────────────────────────────── */}
          <section id="relacionados">
            <h2 className="text-xl font-semibold mb-4">{tContent("related.title")}</h2>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">{tContent("related.alternatives")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { name: "AlertDialog", desc: tContent("related.alertDialog"), path: "?path=/docs/ui-alertdialog--docs" },
                  { name: "Alert",       desc: tContent("related.alert"),       path: "?path=/docs/ui-alert--docs" },
                ] as const).map(item => (
                  <div key={item.name} role="link" tabIndex={0}
                       onClick={() => { (window.top ?? window).location.href = item.path; }}
                       onKeyDown={(e) => { if (e.key === "Enter") (window.top ?? window).location.href = item.path; }}
                       className="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
                    <h4 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground mt-6">{tContent("related.usedWith")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { name: "Form",   desc: tContent("related.form"),   path: "?path=/docs/ui-form--docs" },
                  { name: "Button", desc: tContent("related.button"), path: "?path=/docs/ui-button--docs" },
                ] as const).map(item => (
                  <div key={item.name} role="link" tabIndex={0}
                       onClick={() => { (window.top ?? window).location.href = item.path; }}
                       onKeyDown={(e) => { if (e.key === "Enter") (window.top ?? window).location.href = item.path; }}
                       className="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
                    <h4 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Notas ────────────────────────────────────────────────── */}
          <section id="notas">
            <h2 className="text-xl font-semibold mb-4">{tContent("notes.title")}</h2>
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                <p className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent("notes.tip1")) }} />
              </div>
              <div className="p-4 bg-orange-500/5 border-l-4 border-orange-500 rounded-r-lg">
                <p className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent("notes.tip2")) }} />
              </div>
              <div className="p-4 bg-red-500/5 border-l-4 border-red-500 rounded-r-lg">
                <p className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tContent("notes.tip3")) }} />
              </div>
            </div>
          </section>

          {/* ── Analytics ────────────────────────────────────────────── */}
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
                      { key: "pageView" },
                      { key: "sectionViewed" },
                      { key: "langSwitch" },
                      { key: "toastTriggered" },
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

          {/* ── Testes ───────────────────────────────────────────────── */}
          <section id="testes">
            <h2 className="text-xl font-semibold mb-6">{tContent("testes.title")}</h2>
            <div className="space-y-8">

              <div>
                <h3 className="font-semibold text-sm mb-1">{tContent("testes.functional.title")}</h3>
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
                      {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((i) => {
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

              <div>
                <h3 className="font-semibold text-sm mb-1">{tContent("testes.accessibility.title")}</h3>
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

              <div>
                <h3 className="font-semibold text-sm mb-1">{tContent("testes.visual.title")}</h3>
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
