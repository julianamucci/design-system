import { describe, expect, it } from 'vitest';
import {
  hoverCardClassNameExtraSource,
  hoverCardControlledSource,
  hoverCardDefinicaoSource,
  hoverCardWaitCurtaSource,
  hoverCardWaitDefaultSource,
  hoverCardClosedSource,
  hoverCardLadosSource,
  hoverCardMetricaSource,
  hoverCardPreviaDeLinkSource,
  hoverCardSource,
} from './hover-card.source';

const ALL = [
  hoverCardSource,
  hoverCardWaitDefaultSource,
  hoverCardWaitCurtaSource,
  hoverCardClosedSource,
  hoverCardControlledSource,
  hoverCardPreviaDeLinkSource,
  hoverCardDefinicaoSource,
  hoverCardMetricaSource,
  hoverCardLadosSource,
  hoverCardClassNameExtraSource,
];

describe('hoverCardSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const output = hoverCardSource();
    expect(output).toContain('} from "@/components/ui/hover-card";');
    expect(output).toContain('HoverCardTrigger');
    expect(output).toContain('HoverCardContent');
  });

  it('o gatilho é o elemento de quem consome, entregue por asChild', () => {
    const output = hoverCardSource();
    expect(output).toContain('<HoverCardTrigger asChild>');
    // O cartão é enriquecimento: no toque não há hover, e o clique no link
    // precisa continuar levando ao perfil.
    expect(output).toContain('<a href="/users/joana"');
  });

  it('omite side e align quando são o padrão do componente', () => {
    const output = hoverCardSource(undefined, { args: { side: 'bottom', align: 'center' } });
    // A checagem é na TAG do painel: `data-align` do cluster interno é outra
    // coisa, e um `not.toContain("align=")` solto reprovaria por causa dele.
    expect(output).toContain('<HoverCardContent>');
    expect(output).not.toContain('<HoverCardContent ');
  });

  it('escreve side e align quando diferem do padrão', () => {
    const output = hoverCardSource(undefined, { args: { side: 'top', align: 'end' } });
    expect(output).toContain('<HoverCardContent side="top" align="end">');
  });

  it('não inventa lado fora da união', () => {
    const output = hoverCardSource(undefined, { args: { side: 'diagonal' as never } });
    expect(output).toContain('<HoverCardContent>');
  });

  it('omite as esperas quando são as do próprio componente', () => {
    const output = hoverCardSource(undefined, { args: { openDelay: 600, closeDelay: 300 } });
    expect(output).toContain('<HoverCard>');
    expect(output).not.toContain('openDelay');
    expect(output).not.toContain('closeDelay');
  });

  it('escreve as esperas na RAIZ quando diferem — é onde a API do sistema as põe', () => {
    const output = hoverCardSource(undefined, { args: { openDelay: 150, closeDelay: 100 } });
    expect(output).toContain('<HoverCard openDelay={150} closeDelay={100}>');
  });

  it('o rótulo do control vira o texto do gatilho', () => {
    const output = hoverCardSource(undefined, { args: { triggerLabel: '@marcos' } });
    expect(output).toContain('@marcos');
  });

  it('cai no rótulo padrão quando o control entrega um espião no lugar da string', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const output = hoverCardSource(undefined, {
      args: { triggerLabel: spy as never, onOpenChange: spy as never } as never,
    });
    expect(output).toContain('@joana');
    expect(output).not.toContain('CORPO_DO_MOCK');
  });
});

describe('tempo', () => {
  it('a espera padrão não escreve atraso nenhum — a ausência é o assunto', () => {
    const output = hoverCardWaitDefaultSource();
    expect(output).toContain('<HoverCard>');
    expect(output).not.toContain('openDelay');
    expect(output).not.toContain('closeDelay');
    // E nem o `defaultOpen`, que ali serve só à captura visual da story.
    expect(output).not.toContain('defaultOpen');
  });

  it('a espera curta declara os dois valores na raiz', () => {
    expect(hoverCardWaitCurtaSource()).toContain(
      '<HoverCard openDelay={150} closeDelay={100}>',
    );
  });
});

describe('estados', () => {
  it('fechado não anuncia expansão: o cartão não é um menu', () => {
    const output = hoverCardClosedSource();
    expect(output).not.toContain('aria-expanded');
    expect(output).not.toContain('aria-haspopup');
    expect(output).not.toContain('defaultOpen');
  });

  it('o modo controlado ensina o par open + onOpenChange com estado de verdade', () => {
    const output = hoverCardControlledSource();
    expect(output).toContain('import { useState } from "react";');
    expect(output).toContain('const [aberto, setAberto] = useState(false);');
    expect(output).toContain('<HoverCard open={aberto} onOpenChange={setAberto}>');
  });
});

describe('composições', () => {
  it('a prévia de link tira a inicial decorativa da árvore de acessibilidade', () => {
    const output = hoverCardPreviaDeLinkSource();
    expect(output).toContain('aria-hidden="true"');
    expect(output).toContain('design-system.dev/overlays');
  });

  it('a definição leva ao glossário, e o painel não carrega nome próprio', () => {
    const output = hoverCardDefinicaoSource();
    // D15: o gatilho LEVA ao verbete. O C8 exige que o cartão não seja o único
    // caminho para a informação, e num snippet que alguém copia o destino é a
    // parte que não pode faltar — sem ele, publica-se a composição sem escolher
    // para onde ela leva.
    expect(output).toContain('<a href="/glossario/wcag-2-2-aa"');
    expect(output).not.toContain('<button');
    // O painel não tem papel desde 2026-09-02, e nome próprio em elemento sem
    // papel é `aria-prohibited-attr` no axe. Quem descreve é o gatilho, por
    // `aria-describedby` — escrito pelo componente, não pelo snippet.
    expect(output).not.toContain('aria-label');
  });

  it('na métrica a cor semântica fica no número, e o texto corrido não a recebe', () => {
    const output = hoverCardMetricaSource();
    expect(output).toContain('<span className="nds-text-caption nds-font-medium nds-text-success">');
    // D15, o par do destino do glossário: o gatilho leva à página da métrica.
    expect(output).toContain('<a href="/metricas/conversao"');
    // O índice é afirmado antes do corte: `indexOf` devolve -1 para texto que
    // saiu do snippet, e `slice(-1)` é um caractere que nunca contém a classe —
    // a asserção seguinte passaria justamente quando o exemplo mudasse.
    const descriptionStart = output.indexOf('Cliques no CTA');
    expect(descriptionStart).toBeGreaterThan(-1);
    const description = output.slice(descriptionStart);
    expect(description).not.toContain('nds-text-success');
  });

  it('os quatro lados aparecem juntos, porque a fuga de colisão é o assunto', () => {
    const output = hoverCardLadosSource();
    for (const side of ['"top"', '"bottom"', '"left"', '"right"']) {
      expect(output).toContain(side);
    }
    expect(output).toContain('side={lado}');
  });

  it('a classe extra vai no painel, e não substitui a do componente', () => {
    expect(hoverCardClassNameExtraSource()).toContain(
      '<HoverCardContent className="nds-w-md nds-text-center">',
    );
  });
});

describe('guardas do painel', () => {
  it('nenhum snippet ensina o andaime do arquivo de story', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).not.toContain('HoverCardForArgs');
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('{...args}');
      // Estilo inline de layout do canvas: `contain`, `minHeight`, `position`.
      expect(output).not.toContain('minHeight');
    }
  });

  it('o gatilho vive dentro de uma frase — é o que dispensa o alvo de 24px', () => {
    for (const fn of [
      hoverCardSource,
      hoverCardWaitDefaultSource,
      hoverCardWaitCurtaSource,
      hoverCardClosedSource,
      hoverCardPreviaDeLinkSource,
      hoverCardDefinicaoSource,
      hoverCardMetricaSource,
      hoverCardClassNameExtraSource,
    ]) {
      expect(fn()).toContain('<p className="nds-text-body">');
    }
  });
});
