/**
 * Portão do `page_view`: uma página vista, um evento.
 *
 * Nenhuma suíte olhava para a CONTAGEM de eventos, e por isso este defeito
 * viveu invisível: as docs pages disparavam um `page_view` por seção rolada —
 * colado em cada `docs_section_viewed`, com a mesma `page_location` — porque
 * `breadcrumb` chega às docs pages como array LITERAL, a identidade muda a cada
 * render, e o efeito de SEO re-rodava sempre. Quatro renders, quatro eventos.
 *
 * A story reproduz a condição exata: `breadcrumb` inline e re-renders, que é o
 * que o realce de seção ativa provoca ao rolar a página.
 *
 * A contagem é feita no `gtag` do topo, e não no console: é o destino real do
 * `track()`, e não depende do modo de depuração estar ligado.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { useEffect, useState } from "react";
import { useSeoEffect } from "@/lib/use-seo";
import { esquecerUltimoPageView } from "@shared/primitives/page-view-guard";

type JanelaComGtag = Window & { gtag?: (...args: unknown[]) => void };

const chamadas: unknown[][] = [];
const topo = (window.top ?? window) as JanelaComGtag;
const gtagOriginal = topo.gtag;

// Instalado no MÓDULO, antes de qualquer render: o `page_view` sai na montagem,
// e um espião ligado dentro da `play` chegaria tarde.
esquecerUltimoPageView();
topo.gtag = (...args: unknown[]) => { chamadas.push(args); };

const meta = {
  title: "QA/SEO page_view",
  parameters: { layout: "padded", controls: { disable: true }, actions: { disable: true } },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const RENDERS = 4;

function PaginaQueReRenderiza() {
  const [n, setN] = useState(0);
  useSeoEffect({
    title: "QA page_view",
    description: "portão de contagem de page_view",
    locale: "pt-BR",
    componentSlug: "qa-page-view",
    // Literal inline, como nas docs pages reais. É a condição do defeito.
    breadcrumb: [
      { name: "Components", item: "/components" },
      { name: "QA", item: "/components/qa" },
      { name: "page_view" },
    ],
  });
  useEffect(() => { if (n < RENDERS - 1) setN((v) => v + 1); }, [n]);
  return <p data-renders={n}>renders: {n + 1}</p>;
}

export const UmEventoPorPagina: Story = {
  render: () => <PaginaQueReRenderiza />,
  play: async ({ canvasElement }) => {
    // Espera de RELÓGIO: os re-renders são encadeados por efeito, e a contagem
    // precisa acontecer depois do último. Leitura pura, fora de `waitFor`.
    for (let i = 0; i < 20; i++) {
      if (canvasElement.querySelector(`[data-renders="${RENDERS - 1}"]`)) break;
      await new Promise((r) => setTimeout(r, 25));
    }

    const pageViews = chamadas.filter((c) => c[0] === "event" && c[1] === "page_view");
    topo.gtag = gtagOriginal;

    await expect(canvasElement.querySelector(`[data-renders="${RENDERS - 1}"]`)).not.toBeNull();
    // O número que importa: renderizou quatro vezes, contou UMA página vista.
    await expect(pageViews).toHaveLength(1);
  },
};
