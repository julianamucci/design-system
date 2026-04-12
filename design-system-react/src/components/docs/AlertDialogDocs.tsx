import { useEffect, useState } from "react";
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
import { Trash2, AlertTriangle, LogOut, ShieldAlert } from "lucide-react";

// ─── Navegação interna ────────────────────────────────────────────────────────

const navGroups = [
  {
    label: "Visão Geral",
    sections: [
      { id: "demonstracao", label: "Demonstração" },
      { id: "anatomia",     label: "Anatomia"     },
      { id: "quando-usar",  label: "Quando Usar"  },
      { id: "do-dont",      label: "Do & Don't"   },
    ],
  },
  {
    label: "Referência Técnica",
    sections: [
      { id: "importacao",   label: "Importação"   },
      { id: "exemplos",     label: "Exemplos"     },
      { id: "variantes",    label: "Variantes"    },
      { id: "propriedades", label: "Propriedades" },
      { id: "tokens",       label: "Tokens"       },
    ],
  },
  {
    label: "Contexto",
    sections: [
      { id: "acessibilidade", label: "Acessibilidade" },
      { id: "relacionados",   label: "Relacionados"   },
      { id: "notas",          label: "Notas"          },
    ],
  },
  {
    label: "Qualidade",
    sections: [
      { id: "analytics", label: "Analytics" },
      { id: "testes", label: "Testes" },
    ],
  },
] as const;

const allIds = navGroups.flatMap((g) => g.sections.map((s) => s.id));

function useActiveSection(ids: readonly string[]) {
  const [activeId, setActiveId] = useState<string>(ids[0]);

  useEffect(() => {
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach((obs) => obs?.disconnect());
  }, [ids]);

  return activeId;
}

function ComponentDocsSidebar() {
  const activeId = useActiveSection(allIds);

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
            {group.sections.map((section) => (
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

/**
 * Componente de documentação completa para o AlertDialog.
 * Inclui anatomia, padrões de confirmação, acessibilidade e integração.
 * 
 * @summary Página de documentação do AlertDialog.
 */
export function AlertDialogDocs() {
  // ─── SEO & GEO (Guideline 20) ───────────────────────────────────────────
  useEffect(() => {
    const isIframe = window.self !== window.top;
    const targetDoc = isIframe ? window.parent.document : document;
    const targetWin = isIframe ? window.parent : window;

    const oldTitle = targetDoc.title;
    targetDoc.title = "Alert Dialog — Overlay · Design System Personalizado";

    let metaDesc = targetDoc.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = targetDoc.createElement("meta");
      metaDesc.setAttribute("name", "description");
      targetDoc.head.appendChild(metaDesc);
    }
    const oldDesc = metaDesc.getAttribute("content");
    metaDesc.setAttribute("content", "Documentação do AlertDialog: diálogo modal de confirmação para ações destrutivas e irreversíveis. WCAG 2.1 AA, foco preso, Escape para fechar, integração com Radix UI.");

    const metadata = [
      { name: "ai:summary", content: "Documentação do componente AlertDialog do Design System Personalizado, baseado em Radix UI. Cobre anatomia, acessibilidade, padrões de confirmação e integração com ações destrutivas." },
      { name: "ai:entities", content: "AlertDialog, Radix UI, React, TypeScript, WCAG, Dialog, Modal, Overlay, Confirmação, Ação Destrutiva" },
      { name: "ai:intent", content: "informational" },
      { property: "og:title", content: "Alert Dialog — Overlay · Design System Personalizado" },
      { property: "og:description", content: "Documentação do AlertDialog: diálogo modal de confirmação para ações destrutivas e irreversíveis." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: targetWin.location.href },
      { property: "og:site_name", content: "Design System Personalizado" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Alert Dialog — Overlay · Design System Personalizado" },
      { name: "twitter:description", content: "Documentação do AlertDialog: diálogo modal de confirmação para ações destrutivas e irreversíveis." }
    ];

    metadata.forEach(meta => {
      const selector = meta.name ? `meta[name="${meta.name}"]` : `meta[property="${meta.property}"]`;
      let el = targetDoc.querySelector(selector);
      if (!el) {
        el = targetDoc.createElement("meta");
        if (meta.name) el.setAttribute("name", meta.name);
        if (meta.property) el.setAttribute("property", meta.property);
        targetDoc.head.appendChild(el);
      }
      el.setAttribute("content", meta.content as string);
    });

    let canonical = targetDoc.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = targetDoc.createElement("link");
      canonical.setAttribute("rel", "canonical");
      targetDoc.head.appendChild(canonical);
    }
    canonical.setAttribute("href", targetWin.location.href);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "name": "AlertDialog — Documentação do Componente",
      "description": "Documentação completa do componente AlertDialog com anatomia, acessibilidade e padrões de confirmação.",
      "keywords": "alert dialog, modal, radix, react, acessibilidade, confirmação",
      "inLanguage": "pt-BR",
      "isPartOf": { "@type": "TechArticle", "name": "Design System Personalizado" },
      "about": { "@type": "SoftwareSourceCode", "name": "AlertDialog", "programmingLanguage": "TypeScript" }
    };

    const script = targetDoc.createElement("script");
    script.type = "application/ld+json";
    script.id = "json-ld-alert-dialog";
    script.text = JSON.stringify(jsonLd);
    targetDoc.head.appendChild(script);

    const oldLang = targetDoc.documentElement.lang;
    targetDoc.documentElement.lang = "pt-BR";

    return () => {
      targetDoc.title = oldTitle;
      targetDoc.documentElement.lang = oldLang;
      targetDoc.getElementById("json-ld-alert-dialog")?.remove();
      if (metaDesc && oldDesc) metaDesc.setAttribute("content", oldDesc);
      metadata.forEach(meta => {
        const selector = meta.name ? `meta[name="${meta.name}"]` : `meta[property="${meta.property}"]`;
        targetDoc.querySelector(selector)?.remove();
      });
      targetDoc.querySelector('link[rel="canonical"]')?.remove();
    };
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* ── Seção 1 — Header (Hero) ─────────────────────────────────────── */}
      <header className="ds-docs mb-12 border-b pb-8 border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0">
            Overlay
          </Badge>
          <Badge variant="outline" className="text-muted-foreground font-normal px-2 py-0">
            Componente Composto
          </Badge>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Alert Dialog
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
            Diálogo modal de confirmação que interrompe o fluxo do usuário para exigir uma decisão explícita antes de executar ações destrutivas ou irreversíveis.
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

      {/* ── Layout: sidebar + conteúdo ────────────────────────────────────── */}
      <div className="flex gap-16 items-start">
        <ComponentDocsSidebar />
        <div className="ds-docs flex-1 space-y-12">

      {/* ── Seção 2 — Demonstração Padrão ───────────────────────────────── */}
      <section id="demonstracao">
        <h2 className="text-xl font-semibold mb-4">Demonstração Padrão</h2>
        <ComponentDemo>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" />
                Excluir conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá todos os seus dados de nossos servidores.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sim, excluir conta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ComponentDemo>
      </section>

      {/* ── Seção 3 — Anatomia ──────────────────────────────────────────── */}
      <section id="anatomia">
        <h2 className="text-xl font-semibold mb-4">Anatomia</h2>
        <ComponentDemo>
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 bg-muted/50 border-r border-border">Parte</th>
                  <th className="text-left p-3 bg-muted/50 border-r border-border">Componente</th>
                  <th className="text-left p-3 bg-muted/50">Função</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Root",        "AlertDialog",            "Container de estado (aberto/fechado)"],
                  ["Trigger",     "AlertDialogTrigger",     "Abre o diálogo ao ser clicado"],
                  ["Overlay",     "AlertDialogOverlay",     "Fundo escurecido que bloqueia interação"],
                  ["Content",     "AlertDialogContent",     "Painel central com título, descrição e ações"],
                  ["Header",      "AlertDialogHeader",      "Agrupa título e descrição"],
                  ["Title",       "AlertDialogTitle",       "Título anunciado por leitores de tela (aria-labelledby)"],
                  ["Description", "AlertDialogDescription", "Texto explicativo (aria-describedby)"],
                  ["Footer",      "AlertDialogFooter",      "Container de ações (cancel + action)"],
                  ["Cancel",      "AlertDialogCancel",      "Fecha o diálogo sem executar a ação"],
                  ["Action",      "AlertDialogAction",      "Confirma e executa a ação destrutiva"],
                ].map(([part, comp, desc], i) => (
                  <tr key={part} className={`border-b border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                    <td className="p-3 border-r border-border font-medium">{part}</td>
                    <td className="p-3 border-r border-border"><code className="bg-muted px-1 rounded text-xs">{comp}</code></td>
                    <td className="p-3 text-muted-foreground">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 4 — Quando e Como Usar ────────────────────────────────── */}
      <section id="quando-usar">
        <h2 className="text-xl font-semibold mb-4">Quando Usar</h2>
        <ComponentDemo>
          <div className="space-y-8 w-full">

            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 bg-muted/50 border-r border-border">Cenário</th>
                    <th className="text-left p-3 bg-muted/50 border-r border-border">Usar AlertDialog?</th>
                    <th className="text-left p-3 bg-muted/50">Alternativa</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Excluir registro permanentemente",  "✓ Sim", "—",                               true],
                    ["Deslogar o usuário",                "✓ Sim", "—",                               true],
                    ["Cancelar um plano/assinatura",      "✓ Sim", "—",                               true],
                    ["Salvar um formulário",              "✗ Não", "Submissão direta + Toast",        false],
                    ["Exibir informações complementares", "✗ Não", "Dialog (sem bloqueio de Escape)", false],
                    ["Seleção de opções (picker)",        "✗ Não", "Popover ou Select",               false],
                  ].map(([cenario, usar, alt, isYes], i) => (
                    <tr key={i} className={`border-b border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                      <td className="p-3 border-r border-border">{cenario as string}</td>
                      <td className={`p-3 border-r border-border ${isYes ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>{usar as string}</td>
                      <td className="p-3 text-muted-foreground">{alt as string}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm">✍️ UX Writing</h4>
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 bg-muted/50 border-r border-border">Elemento</th>
                      <th className="text-left p-3 bg-muted/50 border-r border-border">Regras de formato</th>
                      <th className="text-left p-3 bg-muted/50 border-r border-border">✅ Correto</th>
                      <th className="text-left p-3 bg-muted/50">❌ Evitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-3 border-r border-border font-medium">Título</td>
                      <td className="p-3 border-r border-border">Pergunta objetiva · descreve a consequência · máx. 5 palavras</td>
                      <td className="p-3 border-r border-border text-green-700 dark:text-green-400">&quot;Excluir projeto?&quot;, &quot;Encerrar sessão?&quot;</td>
                      <td className="p-3 text-red-700 dark:text-red-400">&quot;Confirmar?&quot;, &quot;Tem certeza?&quot;, &quot;Atenção!&quot;</td>
                    </tr>
                    <tr className="border-b border-border bg-muted/20">
                      <td className="p-3 border-r border-border font-medium">Descrição</td>
                      <td className="p-3 border-r border-border">Explica o impacto · 1-2 frases · tom informativo, não alarmista</td>
                      <td className="p-3 border-r border-border text-green-700 dark:text-green-400">&quot;Todos os dados serão removidos permanentemente.&quot;</td>
                      <td className="p-3 text-red-700 dark:text-red-400">&quot;CUIDADO!!! Você VAI perder tudo!&quot;</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 border-r border-border font-medium">Botão Action</td>
                      <td className="p-3 border-r border-border">Repete o verbo do título · confirma a ação específica</td>
                      <td className="p-3 border-r border-border text-green-700 dark:text-green-400">&quot;Sim, excluir&quot;, &quot;Sair&quot;, &quot;Cancelar assinatura&quot;</td>
                      <td className="p-3 text-red-700 dark:text-red-400">&quot;OK&quot;, &quot;Confirmar&quot;, &quot;Sim&quot;</td>
                    </tr>
                    <tr className="border-b border-border bg-muted/20">
                      <td className="p-3 border-r border-border font-medium">Botão Cancel</td>
                      <td className="p-3 border-r border-border">Neutro · seguro · pode usar sinônimos contextuais</td>
                      <td className="p-3 border-r border-border text-green-700 dark:text-green-400">&quot;Cancelar&quot;, &quot;Manter&quot;, &quot;Ficar&quot;</td>
                      <td className="p-3 text-red-700 dark:text-red-400">&quot;Não&quot;, &quot;Fechar&quot;, &quot;Voltar&quot;</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 5 — Do & Don't ─────────────────────────────────────────── */}
      <section id="do-dont">
        <h2 className="text-xl font-semibold mb-4">Do &amp; Don&apos;t</h2>
        <ComponentDemo>
          <div className="space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 text-green-600 font-bold text-sm" aria-hidden="true">✓</span>
                  <span className="text-sm font-medium text-green-600">Faça isso</span>
                </div>
                <div className="border border-green-200 rounded-md p-4 bg-green-50 dark:bg-green-950/20 dark:border-green-900 space-y-2">
                  <p className="text-sm font-medium">Título: &quot;Excluir projeto?&quot;</p>
                  <p className="text-xs text-muted-foreground">Descrição explica a consequência</p>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm">Cancelar</Button>
                    <Button variant="destructive" size="sm">Sim, excluir</Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Título claro, descrição com contexto, ação destrutiva visualmente diferenciada.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 text-red-600 font-bold text-sm" aria-hidden="true">✗</span>
                  <span className="text-sm font-medium text-red-600">Não faça isso</span>
                </div>
                <div className="border border-red-200 rounded-md p-4 bg-red-50 dark:bg-red-950/20 dark:border-red-900 space-y-2">
                  <p className="text-sm font-medium">Título: &quot;Confirmar?&quot;</p>
                  <p className="text-xs text-muted-foreground">Sem descrição</p>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm">Não</Button>
                    <Button size="sm">Sim</Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Título genérico, sem descrição, botões ambíguos sem diferenciação visual.
                </p>
              </div>
            </div>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 6 — Importação ─────────────────────────────────────────── */}
      <section id="importacao">
        <h2 className="text-xl font-semibold mb-4">Importação</h2>
        <ComponentDemo>
          <div className="w-full">
            <pre className="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto border border-border">
              <code>{`import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";`}</code>
            </pre>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 7 — Exemplos de Código ─────────────────────────────────── */}
      <section id="exemplos">
        <h2 className="text-xl font-semibold mb-4">Exemplos de Código</h2>
        <ComponentDemo>
          <div className="space-y-8 w-full">
            <div className="space-y-3">
              <h3 className="font-medium">Confirmação de exclusão</h3>
              <pre className="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto border border-border">
                <code>{`<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Excluir</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta ação não pode ser desfeita.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction>Confirmar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}</code>
              </pre>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium">Modo controlado (async)</h3>
              <pre className="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto border border-border">
                <code>{`const [open, setOpen] = useState(false);
const [loading, setLoading] = useState(false);

async function handleConfirm() {
  setLoading(true);
  await deleteAccount();
  setLoading(false);
  setOpen(false);
}

<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Excluir conta</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta ação é permanente.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={loading}>
        Cancelar
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={handleConfirm}
        disabled={loading}
      >
        {loading ? "Excluindo..." : "Confirmar"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}</code>
              </pre>
            </div>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 8 — Variantes ──────────────────────────────────────────── */}
      <section id="variantes">
        <h2 className="text-xl font-semibold mb-6">Variantes de Uso</h2>
        <div className="ds-docs space-y-10 w-full">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-6 px-1 border-l-2 border-primary/20 pl-3">
              Padrões de Confirmação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {([
                {
                  label: "Exclusão",
                  desc: "Confirma remoção permanente de um recurso.",
                  trigger: <Button variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" />Excluir</Button>,
                  title: "Excluir item?",
                  description: "Esta ação é permanente.",
                  actionLabel: "Sim, excluir",
                  actionClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                },
                {
                  label: "Logout",
                  desc: "Confirma encerramento de sessão ativa.",
                  trigger: <Button variant="ghost" size="sm"><LogOut className="h-3.5 w-3.5" />Sair</Button>,
                  title: "Encerrar sessão?",
                  description: "Você precisará fazer login novamente.",
                  actionLabel: "Sair",
                  actionClass: "",
                },
                {
                  label: "Ação crítica",
                  desc: "Confirma operações de alto impacto no sistema.",
                  trigger: <Button variant="outline" size="sm"><ShieldAlert className="h-3.5 w-3.5" />Resetar</Button>,
                  title: "Resetar configurações?",
                  description: "Todas as configurações voltarão ao padrão.",
                  actionLabel: "Resetar tudo",
                  actionClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                },
              ]).map(({ label, desc, trigger, title, description, actionLabel, actionClass }) => (
                <div key={label} className="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-colors hover:border-border">
                  <div className="flex-1 flex items-center justify-center p-8 bg-muted/5 min-h-[140px]">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{title}</AlertDialogTitle>
                          <AlertDialogDescription>{description}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction className={actionClass}>{actionLabel}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="p-4 border-t border-border/40 bg-muted/10 space-y-1">
                    <p className="text-[11px] font-mono text-primary font-bold tracking-tight px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">{label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Seção 10 — Propriedades ──────────────────────────────────────── */}
      <section id="propriedades">
        <h2 className="text-xl font-semibold mb-4">Propriedades</h2>
        <ComponentDemo>
          <div className="space-y-6 w-full">
            {([
              {
                title: "AlertDialog (Root)",
                props: [
                  ["open",          "boolean",                   "—",     "Controla o estado aberto/fechado (controlado)"],
                  ["defaultOpen",   "boolean",                   "false", "Estado inicial (não-controlado)"],
                  ["onOpenChange",  "(open: boolean) => void",   "—",     "Callback quando o estado muda"],
                ],
              },
              {
                title: "AlertDialogTrigger",
                props: [
                  ["asChild", "boolean", "false", "Usa o filho como elemento de disparo via Radix Slot"],
                ],
              },
              {
                title: "AlertDialogContent",
                props: [
                  ["forceMount",      "boolean",                       "—", "Força a renderização no DOM mesmo fechado"],
                  ["onEscapeKeyDown", "(e: KeyboardEvent) => void",    "—", "Chamado quando Escape é pressionado (não fecha por padrão)"],
                ],
              },
            ]).map(({ title, props }) => (
              <div key={title} className="space-y-3">
                <h3 className="font-medium">{title}</h3>
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 bg-muted/50 border-r border-border">Prop</th>
                        <th className="text-left p-3 bg-muted/50 border-r border-border">Tipo</th>
                        <th className="text-left p-3 bg-muted/50 border-r border-border">Padrão</th>
                        <th className="text-left p-3 bg-muted/50">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {props.map(([prop, type, def, desc], i) => (
                        <tr key={prop} className={`border-b border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                          <td className="p-3 border-r border-border font-medium">{prop}</td>
                          <td className="p-3 border-r border-border"><code className="bg-muted px-1 rounded text-xs">{type}</code></td>
                          <td className="p-3 border-r border-border">{def}</td>
                          <td className="p-3 text-muted-foreground">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 11 — Design Tokens ─────────────────────────────────────── */}
      <section id="tokens">
        <h2 className="text-xl font-semibold mb-4">Design Tokens</h2>
        <ComponentDemo>
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 bg-muted/50 border-r border-border">Token</th>
                  <th className="text-left p-3 bg-muted/50 border-r border-border">Valor</th>
                  <th className="text-left p-3 bg-muted/50">Contexto</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["--background",  "hsl(var(--background))", "Fundo do Content"],
                  ["--border",      "hsl(var(--border))",     "Borda do Content"],
                  ["overlay",       "bg-black/80",            "Fundo escurecido do Overlay"],
                  ["z-index",       "50",                     "Overlay e Content"],
                  ["max-width",     "max-w-lg (32rem)",       "Largura máxima do Content"],
                  ["duration",      "200ms",                  "Animação de abertura/fechamento"],
                ].map(([token, value, ctx], i) => (
                  <tr key={token} className={`border-b border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                    <td className="p-3 border-r border-border font-medium">{token}</td>
                    <td className="p-3 border-r border-border"><code className="bg-muted px-1 rounded text-xs">{value}</code></td>
                    <td className="p-3 text-muted-foreground">{ctx}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 12 — Acessibilidade ────────────────────────────────────── */}
      <section id="acessibilidade">
        <h2 className="text-xl font-semibold mb-4">Acessibilidade</h2>
        <ComponentDemo>
          <div className="space-y-4 w-full">
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Role <code className="bg-muted px-1 rounded text-xs">alertdialog</code> aplicado automaticamente pelo Radix</li>
              <li><code className="bg-muted px-1 rounded text-xs">aria-labelledby</code> conecta ao Title</li>
              <li><code className="bg-muted px-1 rounded text-xs">aria-describedby</code> conecta à Description</li>
              <li>Foco preso (focus trap) dentro do Content enquanto aberto</li>
              <li>Foco inicial move automaticamente para o botão Cancel (ação segura)</li>
              <li>Escape <strong>não</strong> fecha o diálogo — o usuário deve clicar Cancel ou Action</li>
              <li>Ao fechar, o foco retorna ao Trigger automaticamente</li>
              <li>Overlay bloqueia interação com elementos atrás do diálogo</li>
              <li>Atende WCAG 2.1 AA — contraste mínimo 4.5:1 em todos os textos</li>
            </ul>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">Diferença crítica vs Dialog</p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    O <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded text-xs">AlertDialog</code> não fecha com Escape nem ao clicar no overlay — por design. Use <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded text-xs">Dialog</code> quando o fechamento acidental for aceitável.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 13 — Componentes Relacionados ──────────────────────────── */}
      <section id="relacionados">
        <h2 className="text-xl font-semibold mb-4">Componentes Relacionados</h2>
        <ComponentDemo>
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 bg-muted/50 border-r border-border">Componente</th>
                  <th className="text-left p-3 bg-muted/50 border-r border-border">Quando usar no lugar</th>
                  <th className="text-left p-3 bg-muted/50">Diferença principal</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Dialog",              "Formulários, informações, conteúdo interativo",  "Fecha com Escape e clique no overlay"],
                  ["Toast",               "Feedback após uma ação (sucesso/erro)",          "Não-intrusivo, sem bloqueio de fluxo"],
                  ["Popover",             "Informação contextual posicional",               "Não é modal, sem overlay"],
                  ["Button (destructive)", "Trigger da ação destrutiva",                    "Deve sempre abrir um AlertDialog antes de executar"],
                ].map(([comp, when, diff], i) => (
                  <tr key={comp} className={`border-b border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                    <td className="p-3 border-r border-border font-medium">{comp}</td>
                    <td className="p-3 border-r border-border">{when}</td>
                    <td className="p-3 text-muted-foreground">{diff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 14 — Notas e Dicas ─────────────────────────────────────── */}
      <section id="notas">
        <h2 className="text-xl font-semibold mb-4">Notas e Dicas</h2>
        <ComponentDemo>
          <div className="space-y-3 w-full">
            <p className="text-sm text-muted-foreground">
              <strong>Sempre use <code className="bg-muted px-1 rounded text-xs">asChild</code> no Trigger.</strong> Isso evita o botão padrão do Radix e permite usar o Button do Design System com variantes controladas.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Ação destrutiva com estilo destrutivo.</strong> Aplique <code className="bg-muted px-1 rounded text-xs">bg-destructive text-destructive-foreground</code> no AlertDialogAction quando a ação for irreversível.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Título deve descrever a consequência.</strong> &quot;Excluir projeto?&quot; é melhor que &quot;Confirmar?&quot;. O usuário não deve precisar ler a descrição para entender o que está confirmando.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Cancel à esquerda, Action à direita.</strong> O padrão Shadcn/UI usa <code className="bg-muted px-1 rounded text-xs">sm:flex-row sm:justify-end</code> no Footer.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Modo controlado para async.</strong> Use <code className="bg-muted px-1 rounded text-xs">open</code> + <code className="bg-muted px-1 rounded text-xs">onOpenChange</code> quando a ação envolve uma chamada assíncrona, permitindo manter o diálogo aberto durante o loading.
            </p>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 15: Analytics (Guideline 21) ────────────────────── */}
      <section id="analytics">
        <h2 className="text-xl font-semibold mb-6">📊 Analytics</h2>
        <div className="space-y-6">
          <p className="text-muted-foreground">
            O AlertDialog rastreia o ciclo de vida completo da decisão do usuário. 
            Siga a convenção de nomenclatura e estrutura de payload da <strong>Guideline 21</strong>.
          </p>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 bg-muted/50 border-r border-border">Evento</th>
                  <th className="text-left p-3 bg-muted/50 border-r border-border">Gatilho</th>
                  <th className="text-left p-3 bg-muted/50 text-left">Payload Adicional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr>
                  <td className="p-3 font-mono text-primary border-r border-border">dialog_open</td>
                  <td className="p-3 border-r border-border">Quando o modal é exibido</td>
                  <td className="p-3"><code>label</code> (título do dialog)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary border-r border-border">dialog_close</td>
                  <td className="p-3 border-r border-border">Fechado sem confirmar</td>
                  <td className="p-3"><code>label</code>, <code>trigger</code> ("escape" | "backdrop" | "cancel_button")</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary border-r border-border">dialog_confirm</td>
                  <td className="p-3 border-r border-border">Quando a ação principal é disparada</td>
                  <td className="p-3"><code>label</code></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-muted/30 border border-border/50 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exemplo de Implementação</h4>
            <pre className="text-xs font-mono bg-background/50 p-4 rounded border border-border/40 overflow-x-auto leading-relaxed">
{`track("dialog_confirm", {
  component: "dialog",
  variant: "default",
  location: "user_settings",
  label: "Excluir conta"
});`}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Seção 16 — Critérios de Teste ────────────────────────────────── */}
      <section id="testes">
        <h2 className="text-xl font-semibold mb-4">Critérios de Teste</h2>
        <ComponentDemo>
          <div className="space-y-6 w-full">
            <div className="space-y-3">
              <h3 className="font-medium">Comportamento Funcional</h3>
              <p className="text-sm text-muted-foreground">Base para testes Storybook play functions e Vitest.</p>
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 bg-muted/50 border-r border-border">Ação do usuário</th>
                      <th className="text-left p-3 bg-muted/50 border-r border-border">Resultado esperado</th>
                      <th className="text-left p-3 bg-muted/50">Prioridade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Clicar no Trigger",        "Diálogo abre; overlay aparece; foco move para dentro",              "Alta"],
                      ["Clicar em Cancel",         "Diálogo fecha; foco retorna ao Trigger",                            "Alta"],
                      ["Clicar em Action",         "Callback onAction é chamado; diálogo fecha",                        "Alta"],
                      ["Pressionar Escape",        "Diálogo não fecha (diferença vs Dialog)",                           "Alta"],
                      ["Tab com diálogo aberto",   "Foco fica preso entre Cancel e Action (focus trap)",                "Alta"],
                    ].map(([action, result, priority], i) => (
                      <tr key={i} className={`border-b border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                        <td className="p-3 border-r border-border">{action}</td>
                        <td className="p-3 border-r border-border">{result}</td>
                        <td className="p-3">{priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium">Acessibilidade Verificável</h3>
              <p className="text-sm text-muted-foreground">Critérios para ferramentas automatizadas (jest-axe, axe-core).</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Role <code className="bg-muted px-1 rounded text-xs">alertdialog</code> presente no Content quando aberto</li>
                <li><code className="bg-muted px-1 rounded text-xs">aria-labelledby</code> conecta ao Title</li>
                <li><code className="bg-muted px-1 rounded text-xs">aria-describedby</code> conecta à Description</li>
                <li>Focus trap ativo — Tab não sai do diálogo</li>
                <li>Foco retorna ao Trigger ao fechar</li>
              </ul>
            </div>
          </div>
        </ComponentDemo>
      </section>

        </div>
      </div>

    </div>
  );
}
