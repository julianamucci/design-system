import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ComponentDemo } from "@/components/ComponentDemo";
import { CheckCircle2, XCircle, Mail, ArrowRight } from "lucide-react";

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
      { id: "estados",      label: "Estados"      },
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
 * Componente de documentação completa para o Button.
 * Inclui anatomia, estados, variantes, acessibilidade e critérios de teste.
 * 
 * @summary Página de documentação do Button.
 */
export function ButtonDocs() {
  // ─── SEO & GEO (Guideline 20) ───────────────────────────────────────────
  useEffect(() => {
    // No Storybook Docs, o componente roda dentro de um iframe.
    // Precisamos atualizar o document da janela PAI (manager) para o Lighthouse ler.
    const isIframe = window.self !== window.top;
    const targetDoc = isIframe ? window.parent.document : document;
    const targetWin = isIframe ? window.parent : window;

    // 1. Title e Description
    const oldTitle = targetDoc.title;
    targetDoc.title = "Button — Formulários · Design System Personalizado";
    
    let metaDesc = targetDoc.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = targetDoc.createElement("meta");
      metaDesc.setAttribute("name", "description");
      targetDoc.head.appendChild(metaDesc);
    }
    const oldDesc = metaDesc.getAttribute("content");
    metaDesc.setAttribute("content", "Documentação do Button: 6 variantes, 4 tamanhos, estados disabled e loading, acessibilidade com focus-visible e integração com React Hook Form.");

    // 2. Metatags GEO e Sociais (Open Graph / Twitter)
    const metadata = [
      { name: "ai:summary", content: "Documentação do componente Button do Design System Personalizado, baseado em Shadcn/UI. Cobre variantes, estados, propriedades TypeScript e integração com formulários React." },
      { name: "ai:entities", content: "Button, Shadcn/UI, Tailwind CSS, React, TypeScript, Radix UI, WCAG, React Hook Form, Lucide React, variantes de botão" },
      { name: "ai:intent", content: "informational" },
      { property: "og:title", content: "Button — Formulários · Design System Personalizado" },
      { property: "og:description", content: "Documentação do Button: 6 variantes, 4 tamanhos, estados disabled e loading, acessibilidade com focus-visible e integração com React Hook Form." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: targetWin.location.href },
      { property: "og:site_name", content: "Design System Personalizado" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Button — Formulários · Design System Personalizado" },
      { name: "twitter:description", content: "Documentação do Button: 6 variantes, 4 tamanhos, estados disabled e loading, acessibilidade com focus-visible e integração com React Hook Form." }
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

    // 3. Canonical URL
    let canonical = targetDoc.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = targetDoc.createElement("link");
      canonical.setAttribute("rel", "canonical");
      targetDoc.head.appendChild(canonical);
    }
    canonical.setAttribute("href", targetWin.location.href);

    // 4. Structured Data (JSON-LD)
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "name": "Button — Documentação do Componente",
      "description": "Documentação completa do componente Button com variantes, estados, propriedades e exemplos de código.",
      "keywords": "button, shadcn, tailwind, react, acessibilidade",
      "inLanguage": "pt-BR",
      "isPartOf": {
        "@type": "TechArticle",
        "name": "Design System Personalizado"
      },
      "about": {
        "@type": "SoftwareSourceCode",
        "name": "Button",
        "programmingLanguage": "TypeScript"
      }
    };

    const script = targetDoc.createElement("script");
    script.type = "application/ld+json";
    script.id = "json-ld-button";
    script.text = JSON.stringify(jsonLd);
    targetDoc.head.appendChild(script);

    // 5. Idioma (Lighthouse)
    const oldLang = targetDoc.documentElement.lang;
    targetDoc.documentElement.lang = "pt-BR";

    return () => {
      targetDoc.title = oldTitle;
      targetDoc.documentElement.lang = oldLang;
      targetDoc.getElementById("json-ld-button")?.remove();
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
            Form
          </Badge>
          <Badge variant="outline" className="text-muted-foreground font-normal px-2 py-0">
            Componente
          </Badge>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Button
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
            Elemento interativo fundamental para disparar ações do usuário. Suporta múltiplas variantes, estados de carregamento e integração nativa com o ecossistema Shadcn/UI.
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

      {/* ── Layout: sidebar + conteúdo ────────────────────────────────────── */}
      <div className="flex gap-16 items-start">

        {/* ── Sidebar de navegação ──────────────────────────────────────── */}
        <ComponentDocsSidebar />

        {/* ── Conteúdo das seções ──────────────────────────────────────── */}
        <div className="ds-docs flex-1 space-y-12">

      {/* ── Seção 2 — Demonstração Padrão ───────────────────────────────── */}
      <section id="demonstracao">
        <h2 className="text-xl font-semibold mb-4">Demonstração Padrão</h2>
        <ComponentDemo>
          <div className="flex flex-wrap gap-3">
            <Button>Salvar</Button>
            <Button variant="outline">Cancelar</Button>
            <Button variant="destructive">Excluir conta</Button>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 3 — Anatomia ───────────────────────────────────────────── */}
      <section id="anatomia">
        <h2 className="text-xl font-semibold mb-4">Anatomia</h2>
        <ComponentDemo>
          <div className="space-y-6 w-full">
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                <span>
                  <strong>Container</strong> — elemento <code className="bg-muted px-1 rounded text-xs">&lt;button&gt;</code> nativo,
                  ou <code className="bg-muted px-1 rounded text-xs">Slot</code> do Radix quando <code className="bg-muted px-1 rounded text-xs">asChild</code> é verdadeiro.
                  Recebe todos os atributos HTML do botão.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                <span>
                  <strong>Label</strong> — conteúdo filho (<code className="bg-muted px-1 rounded text-xs">children</code>).
                  Pode ser texto, ícone ou a combinação de ambos.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                <span>
                  <strong>Ícone (opcional)</strong> — renderizado automaticamente via{" "}
                  <code className="bg-muted px-1 rounded text-xs">[&_svg]:size-4</code>.
                  Gap entre ícone e texto gerenciado por <code className="bg-muted px-1 rounded text-xs">gap-2</code>.
                </span>
              </li>
            </ol>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-xs text-muted-foreground mb-2">Estrutura:</p>
              <code className="text-sm block whitespace-pre">{`<Button variant="default" size="default">
  <IconeOpcional />   {/* parte 3 — opcional */}
  Label               {/* parte 2 */}
</Button>             {/* parte 1 — container */}`}</code>
            </div>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 4 — Quando e Como Usar ────────────────────────────────── */}
      <section id="quando-usar">
        <h2 className="text-xl font-semibold mb-4">Quando e Como Usar</h2>
        <ComponentDemo>
          <div className="space-y-6 w-full">

            <div className="bg-muted p-4 rounded-md space-y-2">
              <h4 className="font-medium text-sm">📋 Guidelines Obrigatórias</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Use no máximo <strong>um botão primário</strong> (variant default) por área de ação.</li>
                <li>Botões destrutivos (variant destructive) exigem confirmação — envolva-os em um <code className="bg-background px-1 rounded text-xs">AlertDialog</code>.</li>
                <li>Ordene os botões: primário à direita, secundário à esquerda (padrão ocidental).</li>
                <li>Para botões em linha de texto, prefira <code className="bg-background px-1 rounded text-xs">variant="link"</code>.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border rounded-md p-4">
                <h4 className="mb-2 text-sm font-medium">✅ Use quando</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>A ação principal da página precisa de destaque</li>
                  <li>O usuário precisa submeter um formulário</li>
                  <li>Uma ação imediata será executada ao clique</li>
                  <li>A navegação exige estado ou parâmetros (ex: abrir modal)</li>
                </ul>
              </div>
              <div className="bg-card border rounded-md p-4">
                <h4 className="mb-2 text-sm font-medium">❌ Não use quando</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>A ação é navegação simples — use <code className="bg-muted px-1 rounded text-xs">&lt;a&gt;</code> com <code className="bg-muted px-1 rounded text-xs">asChild</code></li>
                  <li>O estado precisa ser alternado — use <code className="bg-muted px-1 rounded text-xs">Toggle</code></li>
                  <li>Há mais de 3 ações agrupadas — use <code className="bg-muted px-1 rounded text-xs">DropdownMenu</code></li>
                </ul>
              </div>
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
                      <td className="p-3 border-r border-border font-medium">Label</td>
                      <td className="p-3 border-r border-border">Verbo no infinitivo · máx. 3 palavras · sem pontuação final</td>
                      <td className="p-3 border-r border-border text-green-700 dark:text-green-400">"Salvar", "Enviar pedido"</td>
                      <td className="p-3 text-red-700 dark:text-red-400">"Clique aqui", "OK", "Salvar!"</td>
                    </tr>
                    <tr className="border-b border-border bg-muted/20">
                      <td className="p-3 border-r border-border font-medium">Botão destrutivo</td>
                      <td className="p-3 border-r border-border">Nomeia a ação · deixa claro o que será destruído</td>
                      <td className="p-3 border-r border-border text-green-700 dark:text-green-400">"Excluir conta", "Remover item"</td>
                      <td className="p-3 text-red-700 dark:text-red-400">"Sim", "Confirmar", "Deletar"</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 border-r border-border font-medium">Botão cancelar</td>
                      <td className="p-3 border-r border-border">Neutro · sem drama · sem "não"</td>
                      <td className="p-3 border-r border-border text-green-700 dark:text-green-400">"Cancelar", "Voltar"</td>
                      <td className="p-3 text-red-700 dark:text-red-400">"Não", "Fechar", "Desistir"</td>
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

            {/* Par 1 — Labels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 text-green-600 font-bold text-sm" aria-hidden="true">✓</span>
                  <span className="text-sm font-medium text-green-600">Faça isso</span>
                </div>
                <div className="border border-green-200 rounded-md p-4 bg-green-50 dark:bg-green-950/20 dark:border-green-900 flex gap-2 flex-wrap">
                  <Button>Salvar alterações</Button>
                  <Button variant="outline">Cancelar</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Verbo no infinitivo, ação clara. Primário à direita, secundário à esquerda.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 text-red-600 font-bold text-sm" aria-hidden="true">✗</span>
                  <span className="text-sm font-medium text-red-600">Não faça isso</span>
                </div>
                <div className="border border-red-200 rounded-md p-4 bg-red-50 dark:bg-red-950/20 dark:border-red-900 flex gap-2 flex-wrap">
                  <Button>OK</Button>
                  <Button>Clique aqui</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Labels vagos não comunicam a ação. O usuário não sabe o que vai acontecer.
                </p>
              </div>
            </div>

            {/* Par 2 — Icon-only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 text-green-600 font-bold text-sm" aria-hidden="true">✓</span>
                  <span className="text-sm font-medium text-green-600">Faça isso</span>
                </div>
                <div className="border border-green-200 rounded-md p-4 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
                  <Button size="icon" aria-label="Fechar diálogo">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Botão icon-only com <code className="bg-muted px-1 rounded text-xs">aria-label</code> descritivo.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-4 h-4 text-red-600 font-bold text-sm" aria-hidden="true">✗</span>
                  <span className="text-sm font-medium text-red-600">Não faça isso</span>
                </div>
                <div className="border border-red-200 rounded-md p-4 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
                  <Button size="icon">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ícone sem <code className="bg-muted px-1 rounded text-xs">aria-label</code> é invisível para leitores de tela.
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
          <div className="space-y-4 w-full">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Import básico:</p>
              <div className="bg-muted p-4 rounded-md">
                <code className="text-sm">{`import { Button } from "@/components/ui/button"`}</code>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Com variantes (para compor classes fora do componente):</p>
              <div className="bg-muted p-4 rounded-md">
                <code className="text-sm">{`import { Button, buttonVariants } from "@/components/ui/button"`}</code>
              </div>
            </div>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 7 — Exemplos de Código ─────────────────────────────────── */}
      <section id="exemplos">
        <h2 className="text-xl font-semibold mb-4">Exemplos de Código</h2>
        <ComponentDemo>
          <div className="space-y-8 w-full">

            <div className="space-y-3">
              <h3 className="font-medium">Uso Básico</h3>
              <div className="border border-border rounded-md p-4 flex gap-2 flex-wrap">
                <Button>Salvar</Button>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <code className="text-sm block whitespace-pre">{`<Button>Salvar</Button>`}</code>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Com Ícone</h3>
              <div className="border border-border rounded-md p-4 flex gap-2 flex-wrap">
                <Button>
                  <Mail className="h-4 w-4" />
                  Enviar email
                </Button>
                <Button variant="outline">
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <code className="text-sm block whitespace-pre">{`<Button>
  <Mail className="h-4 w-4" />
  Enviar email
</Button>

<Button variant="outline">
  Próximo
  <ArrowRight className="h-4 w-4" />
</Button>`}</code>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">AsChild — como link de navegação</h3>
              <div className="border border-border rounded-md p-4">
                <Button asChild variant="outline">
                  <a href="#exemplos">Ver exemplos</a>
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <code className="text-sm block whitespace-pre">{`// Com <a> nativo
<Button asChild variant="outline">
  <a href="/destino">Ver exemplos</a>
</Button>

// Com Link do React Router / Next.js
<Button asChild>
  <Link to="/perfil">Ver perfil</Link>
</Button>`}</code>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Desabilitado</h3>
              <div className="border border-border rounded-md p-4 flex gap-2 flex-wrap">
                <Button disabled>Salvar</Button>
                <Button variant="outline" disabled>Cancelar</Button>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <code className="text-sm block whitespace-pre">{`<Button disabled>Salvar</Button>`}</code>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">buttonVariants — para elementos não-button</h3>
              <div className="border border-border rounded-md p-4">
                <a href="#exemplos" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                  Link estilizado como botão
                </a>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <code className="text-sm block whitespace-pre">{`import { buttonVariants } from "@/components/ui/button"

<a href="/" className={buttonVariants({ variant: "outline" })}>
  Voltar
</a>`}</code>
              </div>
            </div>

          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 8 — Variantes ──────────────────────────────────────────── */}
      <section id="variantes">
        <h2 className="text-xl font-semibold mb-6">Variantes e Tamanhos</h2>
        
        <div className="ds-docs space-y-10 w-full">
          {/* Subseção: Variantes Visuais */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-6 px-1 border-l-2 border-primary/20 pl-3">
              Variantes Disponíveis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {(
                [
                  { variant: "default",     label: 'variant="default"',     desc: "Ação primária de destaque na interface." },
                  { variant: "secondary",   label: 'variant="secondary"',   desc: "Ações de suporte ou caminhos alternativos." },
                  { variant: "outline",     label: 'variant="outline"',     desc: "Botão secundário com borda, menos ênfase." },
                  { variant: "ghost",       label: 'variant="ghost"',       desc: "Ações sutis, ideal para toolbars e menus." },
                  { variant: "link",        label: 'variant="link"',        desc: "Navegação em linha como se fosse um link." },
                  { variant: "destructive", label: 'variant="destructive"', desc: "Ações críticas que não podem ser desfeitas." },
                ] as const
              ).map(({ variant, label, desc }) => (
                <div key={variant} className="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-colors hover:border-border">
                  <div className="flex-1 flex items-center justify-center p-8 bg-muted/5 min-h-[140px]">
                    <Button variant={variant}>Botão</Button>
                  </div>
                  <div className="p-4 border-t border-border/40 bg-muted/10 space-y-1">
                    <p className="text-[11px] font-mono text-primary font-bold tracking-tight px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subseção: Tamanhos */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-6 px-1 border-l-2 border-primary/20 pl-3">
              Escala de Tamanhos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {(
                [
                  { size: "sm",      label: 'size="sm"',      desc: "32px · Compacto" },
                  { size: "default", label: 'size="default"', desc: "36px · Padrão" },
                  { size: "lg",      label: 'size="lg"',      desc: "40px · Destaque" },
                  { size: "icon",    label: 'size="icon"',    desc: "Ajuste quadrado" },
                ] as const
              ).map(({ size, label, desc }) => (
                <div key={size} className="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-colors hover:border-border">
                  <div className="flex-1 flex items-center justify-center p-8 bg-muted/5 min-h-[140px]">
                    <Button size={size}>
                      {size === "icon" ? <Mail className="h-4 w-4" /> : "Botão"}
                    </Button>
                  </div>
                  <div className="p-4 border-t border-border/40 bg-muted/10 space-y-1">
                    <p className="text-[11px] font-mono text-primary font-bold tracking-tight px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Seção 9 — Estados ────────────────────────────────────────────── */}
      <section id="estados">
        <h2 className="text-xl font-semibold mb-4">Estados</h2>
        <ComponentDemo>
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 bg-muted/50 border-r border-border">Estado</th>
                  <th className="text-left p-3 bg-muted/50 border-r border-border">Visual</th>
                  <th className="text-left p-3 bg-muted/50">Como ativar</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-3 border-r border-border font-medium">Default</td>
                  <td className="p-3 border-r border-border"><Button size="sm">Salvar</Button></td>
                  <td className="p-3 text-muted-foreground">Estado inicial sem props adicionais</td>
                </tr>
                <tr className="border-b border-border bg-muted/20">
                  <td className="p-3 border-r border-border font-medium">Hover</td>
                  <td className="p-3 border-r border-border text-muted-foreground text-xs">Passar o cursor sobre o botão</td>
                  <td className="p-3 text-muted-foreground">
                    CSS automático: <code className="bg-muted px-1 rounded text-xs">hover:bg-primary/90</code>
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3 border-r border-border font-medium">Focus</td>
                  <td className="p-3 border-r border-border">
                    <Button size="sm" className="ring-1 ring-ring ring-offset-2">Salvar</Button>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    Tab — <code className="bg-muted px-1 rounded text-xs">focus-visible:ring-1 focus-visible:ring-ring</code>
                  </td>
                </tr>
                <tr className="border-b border-border bg-muted/20">
                  <td className="p-3 border-r border-border font-medium">Disabled</td>
                  <td className="p-3 border-r border-border"><Button size="sm" disabled>Salvar</Button></td>
                  <td className="p-3 text-muted-foreground">
                    Prop: <code className="bg-muted px-1 rounded text-xs">disabled</code> — opacidade 50%, sem pointer-events
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 10 — Propriedades ──────────────────────────────────────── */}
      <section id="propriedades">
        <h2 className="text-xl font-semibold mb-4">Propriedades</h2>
        <ComponentDemo>
          <div className="space-y-6 w-full">

            <div>
              <h3 className="font-medium mb-3">Interface TypeScript</h3>
              <div className="bg-muted p-4 rounded-md overflow-x-auto">
                <code className="text-sm block whitespace-pre">{`interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// Props herdadas de ButtonHTMLAttributes:
// onClick, type, form, name, disabled, aria-*, ...`}</code>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Button</h3>
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 bg-muted/50 border-r border-border">Propriedade</th>
                      <th className="text-left p-3 bg-muted/50 border-r border-border">Tipo</th>
                      <th className="text-left p-3 bg-muted/50 border-r border-border">Padrão</th>
                      <th className="text-left p-3 bg-muted/50 border-r border-border">Obrigatório</th>
                      <th className="text-left p-3 bg-muted/50">Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-3 border-r border-border"><code>variant</code></td>
                      <td className="p-3 border-r border-border text-xs"><code>"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"</code></td>
                      <td className="p-3 border-r border-border"><code>"default"</code></td>
                      <td className="p-3 border-r border-border">Não</td>
                      <td className="p-3">Estilo visual do botão</td>
                    </tr>
                    <tr className="border-b border-border bg-muted/20">
                      <td className="p-3 border-r border-border"><code>size</code></td>
                      <td className="p-3 border-r border-border text-xs"><code>"default" | "sm" | "lg" | "icon"</code></td>
                      <td className="p-3 border-r border-border"><code>"default"</code></td>
                      <td className="p-3 border-r border-border">Não</td>
                      <td className="p-3">Tamanho e padding interno</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 border-r border-border"><code>asChild</code></td>
                      <td className="p-3 border-r border-border"><code>boolean</code></td>
                      <td className="p-3 border-r border-border"><code>false</code></td>
                      <td className="p-3 border-r border-border">Não</td>
                      <td className="p-3">Substitui o elemento raiz pelo filho via Radix Slot</td>
                    </tr>
                    <tr className="border-b border-border bg-muted/20">
                      <td className="p-3 border-r border-border"><code>disabled</code></td>
                      <td className="p-3 border-r border-border"><code>boolean</code></td>
                      <td className="p-3 border-r border-border"><code>false</code></td>
                      <td className="p-3 border-r border-border">Não</td>
                      <td className="p-3">Desabilita interação e aplica opacidade 50%</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 border-r border-border"><code>className</code></td>
                      <td className="p-3 border-r border-border"><code>string</code></td>
                      <td className="p-3 border-r border-border">—</td>
                      <td className="p-3 border-r border-border">Não</td>
                      <td className="p-3">Classes Tailwind adicionais para ajustes pontuais</td>
                    </tr>
                    <tr className="border-b border-border bg-muted/20">
                      <td className="p-3 border-r border-border"><code>children</code></td>
                      <td className="p-3 border-r border-border"><code>React.ReactNode</code></td>
                      <td className="p-3 border-r border-border">—</td>
                      <td className="p-3 border-r border-border">Não</td>
                      <td className="p-3">Conteúdo do botão (texto, ícone ou combinação)</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 border-r border-border"><code>onClick</code></td>
                      <td className="p-3 border-r border-border text-xs"><code>(e: React.MouseEvent) =&gt; void</code></td>
                      <td className="p-3 border-r border-border">—</td>
                      <td className="p-3 border-r border-border">Não</td>
                      <td className="p-3">Callback ao clicar (herdado de ButtonHTMLAttributes)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-md space-y-3 text-sm">
              <h4 className="font-medium">Extensibilidade</h4>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <code>className</code> — aceita classes Tailwind para ajustes pontuais. Prefira tokens CSS para mudanças de tema global.
                </p>
                <p>
                  <code>asChild</code> — substitui o elemento raiz pelo filho via Radix Slot. Use para renderizar o botão como{" "}
                  <code>&lt;a&gt;</code>, <code>Link</code> do router, ou qualquer outro elemento sem perder estilo e comportamento.
                </p>
              </div>
            </div>

          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 11 — Design Tokens ─────────────────────────────────────── */}
      <section id="tokens">
        <h2 className="text-xl font-semibold mb-4">Design Tokens</h2>
        <ComponentDemo>
          <div className="space-y-4 w-full">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 bg-muted/50 border-r border-border">Token CSS</th>
                    <th className="text-left p-3 bg-muted/50 border-r border-border">Classe Tailwind</th>
                    <th className="text-left p-3 bg-muted/50 border-r border-border">Parte do componente</th>
                    <th className="text-left p-3 bg-muted/50 border-r border-border">Light (HSL)</th>
                    <th className="text-left p-3 bg-muted/50">Dark (HSL)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-3 border-r border-border"><code>--primary</code></td>
                    <td className="p-3 border-r border-border"><code>bg-primary</code></td>
                    <td className="p-3 border-r border-border">Fundo — variant default</td>
                    <td className="p-3 border-r border-border text-xs">220 44% 57%</td>
                    <td className="p-3 text-xs">238 50% 87%</td>
                  </tr>
                  <tr className="border-b border-border bg-muted/20">
                    <td className="p-3 border-r border-border"><code>--primary-foreground</code></td>
                    <td className="p-3 border-r border-border"><code>text-primary-foreground</code></td>
                    <td className="p-3 border-r border-border">Texto — variant default</td>
                    <td className="p-3 border-r border-border text-xs">0 0% 100%</td>
                    <td className="p-3 text-xs">0 0% 100%</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3 border-r border-border"><code>--destructive</code></td>
                    <td className="p-3 border-r border-border"><code>bg-destructive</code></td>
                    <td className="p-3 border-r border-border">Fundo — variant destructive</td>
                    <td className="p-3 border-r border-border text-xs">0 84% 60%</td>
                    <td className="p-3 text-xs">0 72% 51%</td>
                  </tr>
                  <tr className="border-b border-border bg-muted/20">
                    <td className="p-3 border-r border-border"><code>--secondary</code></td>
                    <td className="p-3 border-r border-border"><code>bg-secondary</code></td>
                    <td className="p-3 border-r border-border">Fundo — variant secondary</td>
                    <td className="p-3 border-r border-border text-xs">210 40% 96%</td>
                    <td className="p-3 text-xs">217 33% 17%</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3 border-r border-border"><code>--ring</code></td>
                    <td className="p-3 border-r border-border"><code>ring-ring</code></td>
                    <td className="p-3 border-r border-border">Anel de foco (focus-visible)</td>
                    <td className="p-3 border-r border-border text-xs">220 44% 57%</td>
                    <td className="p-3 text-xs">238 50% 87%</td>
                  </tr>
                  <tr className="border-b border-border bg-muted/20">
                    <td className="p-3 border-r border-border"><code>--radius</code></td>
                    <td className="p-3 border-r border-border"><code>rounded-md</code></td>
                    <td className="p-3 border-r border-border">Border radius</td>
                    <td className="p-3 border-r border-border text-xs">0.375rem</td>
                    <td className="p-3 text-xs">0.375rem</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm font-medium mb-2">Como personalizar via tema:</p>
              <code className="text-sm block whitespace-pre">{`/* Em globals.css */
html.meu-tema {
  --primary: 262 80% 58%; /* Roxo — light mode */
}
html.meu-tema.dark {
  --primary: 262 60% 75%; /* Roxo — dark mode */
}`}</code>
            </div>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 12 — Acessibilidade ────────────────────────────────────── */}
      <section id="acessibilidade">
        <h2 className="text-xl font-semibold mb-4">Acessibilidade</h2>
        <ComponentDemo>
          <div className="space-y-4 w-full">
            <div className="bg-muted p-4 rounded-md space-y-2">
              <h4 className="font-medium text-sm">♿ Recursos de Acessibilidade</h4>
              <ul className="list-none space-y-1.5 text-sm">
                <li>✓ Elemento <code className="bg-background px-1 rounded text-xs">&lt;button&gt;</code> nativo — semântica e teclado embutidos pelo browser</li>
                <li>✓ <code className="bg-background px-1 rounded text-xs">focus-visible:ring-1 focus-visible:ring-ring</code> — anel de foco visível na navegação por Tab</li>
                <li>✓ <code className="bg-background px-1 rounded text-xs">disabled:pointer-events-none disabled:opacity-50</code> — estado desabilitado visual e funcionalmente</li>
                <li>✓ Suporte a <code className="bg-background px-1 rounded text-xs">aria-label</code> para botões icon-only (via ButtonHTMLAttributes)</li>
                <li>✓ Contraste mínimo de 4.5:1 nos tokens padrão (WCAG 2.1 AA)</li>
                <li>✓ Touch target de 36px (size default: h-9) — adicione padding extra para mobile se necessário</li>
              </ul>
            </div>
            <div className="bg-muted p-4 rounded-md space-y-2">
              <h4 className="font-medium text-sm">⌨️ Navegação por Teclado</h4>
              <ul className="list-none space-y-1.5 text-sm">
                <li>
                  <kbd className="bg-background border border-border rounded px-1.5 py-0.5 text-xs font-mono">Tab</kbd>{" "}
                  — move o foco para o botão
                </li>
                <li>
                  <kbd className="bg-background border border-border rounded px-1.5 py-0.5 text-xs font-mono">Enter</kbd>{" "}
                  /{" "}
                  <kbd className="bg-background border border-border rounded px-1.5 py-0.5 text-xs font-mono">Space</kbd>{" "}
                  — dispara o <code className="bg-muted px-1 rounded text-xs">onClick</code>
                </li>
              </ul>
            </div>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 13 — Componentes Relacionados ─────────────────────────── */}
      <section id="relacionados">
        <h2 className="text-xl font-semibold mb-4">Componentes Relacionados</h2>
        <ComponentDemo>
          <div className="space-y-6 w-full">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Alternativas</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 border border-border rounded-md">
                  <div>
                    <p className="text-sm font-medium">Toggle</p>
                    <p className="text-sm text-muted-foreground">
                      Use em vez deste quando a ação alterna entre dois estados (ligado/desligado). Button não mantém estado <code className="bg-muted px-1 rounded text-xs">pressed</code> — Toggle foi projetado para isso.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border border-border rounded-md">
                  <div>
                    <p className="text-sm font-medium">DropdownMenu</p>
                    <p className="text-sm text-muted-foreground">
                      Use em vez de múltiplos botões quando há mais de 3 ações equivalentes agrupadas. Botões separados criam poluição visual e dificultam a hierarquia.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border border-border rounded-md">
                  <div>
                    <p className="text-sm font-medium">&lt;a&gt; nativo via asChild</p>
                    <p className="text-sm text-muted-foreground">
                      Use <code className="bg-muted px-1 rounded text-xs">Button asChild</code> quando a ação é navegação pura. Coloque <code className="bg-muted px-1 rounded text-xs">&lt;a href="..."&gt;</code> como filho para semântica correta — evita <code className="bg-muted px-1 rounded text-xs">&lt;button&gt;</code> aninhado em <code className="bg-muted px-1 rounded text-xs">&lt;a&gt;</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Costuma ser usado com</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Dialog</Badge>
                <Badge variant="outline">AlertDialog</Badge>
                <Badge variant="outline">Form</Badge>
                <Badge variant="outline">Sheet</Badge>
                <Badge variant="outline">Popover</Badge>
              </div>
            </div>
          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 14 — Notas e Dicas ─────────────────────────────────────── */}
      <section id="notas">
        <h2 className="text-xl font-semibold mb-4">Notas e Dicas</h2>
        <ComponentDemo>
          <div className="text-sm text-muted-foreground space-y-4 w-full">

            <div className="flex gap-3 items-start">
              <span className="inline-flex shrink-0 items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5" aria-hidden="true">
                ✓
              </span>
              <div className="space-y-1">
                <p className="text-foreground font-medium">Use asChild para links de router</p>
                <p>
                  Ao usar o Button com Link do React Router ou Next.js, passe <code className="bg-muted px-1 rounded text-xs">asChild</code> e coloque o Link como filho.
                  Evita nesting de <code className="bg-muted px-1 rounded text-xs">&lt;a&gt;</code> dentro de <code className="bg-muted px-1 rounded text-xs">&lt;button&gt;</code>, que é HTML inválido.
                </p>
                <div className="bg-muted p-3 rounded mt-2">
                  <code className="text-xs block whitespace-pre">{`<Button asChild>
  <Link to="/perfil">Ver perfil</Link>
</Button>`}</code>
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="inline-flex shrink-0 items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5" aria-hidden="true">
                ✓
              </span>
              <div className="space-y-1">
                <p className="text-foreground font-medium">buttonVariants para Server Components (Next.js App Router)</p>
                <p>
                  Em Server Components não é possível usar o componente <code className="bg-muted px-1 rounded text-xs">Button</code> com <code className="bg-muted px-1 rounded text-xs">onClick</code>.
                  Nesses casos, use o export <code className="bg-muted px-1 rounded text-xs">buttonVariants</code> diretamente no elemento HTML:
                </p>
                <div className="bg-muted p-3 rounded mt-2">
                  <code className="text-xs block whitespace-pre">{`import { buttonVariants } from "@/components/ui/button"

// Server Component — sem 'use client'
<a href="/dashboard" className={buttonVariants({ variant: "outline" })}>
  Painel
</a>`}</code>
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="inline-flex shrink-0 items-center justify-center w-5 h-5 rounded-full bg-destructive/10 text-destructive text-xs font-bold mt-0.5" aria-hidden="true">
                ✗
              </span>
              <div className="space-y-1">
                <p className="text-foreground font-medium">Não execute ações destrutivas direto no onClick</p>
                <p>
                  Botões com <code className="bg-muted px-1 rounded text-xs">variant="destructive"</code> devem abrir um <code className="bg-muted px-1 rounded text-xs">AlertDialog</code> de confirmação antes de executar. Nunca dispare delete/reset diretamente no clique.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="inline-flex shrink-0 items-center justify-center w-5 h-5 rounded-full bg-destructive/10 text-destructive text-xs font-bold mt-0.5" aria-hidden="true">
                ✗
              </span>
              <div className="space-y-1">
                <p className="text-foreground font-medium">Não use disabled como único feedback de validação</p>
                <p>
                  Um botão desabilitado sem contexto deixa o usuário sem saber o motivo. Se o botão está bloqueado por validação de formulário, combine-o com <code className="bg-muted px-1 rounded text-xs">FormMessage</code> para explicar o que está faltando.
                </p>
              </div>
            </div>

          </div>
        </ComponentDemo>
      </section>

      {/* ── Seção 15: Analytics (Guideline 21) ────────────────────── */}
      <section id="analytics">
        <h2 className="text-xl font-semibold mb-6">📊 Analytics</h2>
        <div className="space-y-6">
          <p className="text-muted-foreground">
            O componente Button deve ser instrumentado para rastrear a intenção do usuário. 
            Siga a convenção de nomenclatura e estrutura de payload da <strong>Guideline 21</strong>.
          </p>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 bg-muted/50 border-r border-border">Evento</th>
                  <th className="text-left p-3 bg-muted/50 border-r border-border">Gatilho</th>
                  <th className="text-left p-3 bg-muted/50">Payload Adicional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr>
                  <td className="p-3 font-mono text-primary border-r border-border">button_click</td>
                  <td className="p-3 border-r border-border">Ao clicar no botão habilitado</td>
                  <td className="p-3"><code>label</code> (texto do botão)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-muted/30 border border-border/50 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exemplo de Implementação</h4>
            <pre className="text-xs font-mono bg-background/50 p-4 rounded border border-border/40 overflow-x-auto leading-relaxed">
{`track("button_click", {
  component: "button",
  variant: "default",
  location: "checkout_form",
  label: "Finalizar compra"
});`}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Seção 16 — Critérios de Teste ───────────────────────────────── */}
      <section id="testes">
        <h2 className="text-xl font-semibold mb-4">Critérios de Teste</h2>
        <ComponentDemo>
          <div className="space-y-6 w-full">

            <div className="space-y-3">
              <h3 className="font-medium">Comportamento Funcional</h3>
              <p className="text-sm text-muted-foreground">
                Base para testes Jest/RTL e Storybook play functions.
              </p>
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
                    <tr className="border-b border-border">
                      <td className="p-3 border-r border-border">Clicar no botão habilitado</td>
                      <td className="p-3 border-r border-border"><code>onClick</code> disparado exatamente uma vez</td>
                      <td className="p-3">Alta</td>
                    </tr>
                    <tr className="border-b border-border bg-muted/20">
                      <td className="p-3 border-r border-border">Clicar no botão disabled</td>
                      <td className="p-3 border-r border-border">Nenhum evento disparado; opacidade 50%; cursor padrão</td>
                      <td className="p-3">Alta</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 border-r border-border">Pressionar Tab</td>
                      <td className="p-3 border-r border-border">Foco move para o botão; anel focus-visible aparece</td>
                      <td className="p-3">Alta</td>
                    </tr>
                    <tr className="border-b border-border bg-muted/20">
                      <td className="p-3 border-r border-border">Pressionar Enter / Space com foco no botão</td>
                      <td className="p-3 border-r border-border"><code>onClick</code> disparado</td>
                      <td className="p-3">Alta</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 border-r border-border">Renderizar com asChild + elemento filho</td>
                      <td className="p-3 border-r border-border">Filho renderiza com classes do botão; sem <code>&lt;button&gt;</code> no DOM</td>
                      <td className="p-3">Média</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Acessibilidade Verificável</h3>
              <p className="text-sm text-muted-foreground">
                Critérios para ferramentas automatizadas (jest-axe, axe-core).
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Sem violações reportadas pelo axe-core no estado padrão</li>
                <li>Contraste mínimo de 4.5:1 em todos os estados e variantes (WCAG 2.1 AA)</li>
                <li>Anel focus-visible visível (<code className="bg-muted px-1 rounded text-xs">focus-visible:ring-1</code>) ao navegar por teclado</li>
                <li>Botão icon-only com <code className="bg-muted px-1 rounded text-xs">aria-label</code> — anunciado corretamente por leitores de tela</li>
                <li>Botão disabled com atributo <code className="bg-muted px-1 rounded text-xs">disabled</code> no DOM — leitores de tela anunciam "indisponível"</li>
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
