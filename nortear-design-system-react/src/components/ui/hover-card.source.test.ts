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
    const saida = hoverCardSource();
    expect(saida).toContain('} from "@/components/ui/hover-card";');
    expect(saida).toContain('HoverCardTrigger');
    expect(saida).toContain('HoverCardContent');
  });

  it('o gatilho é o elemento de quem consome, entregue por asChild', () => {
    const saida = hoverCardSource();
    expect(saida).toContain('<HoverCardTrigger asChild>');
    // O cartão é enriquecimento: no toque não há hover, e o clique no link
    // precisa continuar levando ao perfil.
    expect(saida).toContain('<a href="/users/joana"');
  });

  it('omite side e align quando são o padrão do componente', () => {
    const saida = hoverCardSource(undefined, { args: { side: 'bottom', align: 'center' } });
    // A checagem é na TAG do painel: `data-align` do cluster interno é outra
    // coisa, e um `not.toContain("align=")` solto reprovaria por causa dele.
    expect(saida).toContain('<HoverCardContent>');
    expect(saida).not.toContain('<HoverCardContent ');
  });

  it('escreve side e align quando diferem do padrão', () => {
    const saida = hoverCardSource(undefined, { args: { side: 'top', align: 'end' } });
    expect(saida).toContain('<HoverCardContent side="top" align="end">');
  });

  it('não inventa lado fora da união', () => {
    const saida = hoverCardSource(undefined, { args: { side: 'diagonal' as never } });
    expect(saida).toContain('<HoverCardContent>');
  });

  it('omite as esperas quando são as do próprio componente', () => {
    const saida = hoverCardSource(undefined, { args: { openDelay: 600, closeDelay: 300 } });
    expect(saida).toContain('<HoverCard>');
    expect(saida).not.toContain('openDelay');
    expect(saida).not.toContain('closeDelay');
  });

  it('escreve as esperas na RAIZ quando diferem — é onde a API do sistema as põe', () => {
    const saida = hoverCardSource(undefined, { args: { openDelay: 150, closeDelay: 100 } });
    expect(saida).toContain('<HoverCard openDelay={150} closeDelay={100}>');
  });

  it('o rótulo do control vira o texto do gatilho', () => {
    const saida = hoverCardSource(undefined, { args: { triggerLabel: '@marcos' } });
    expect(saida).toContain('@marcos');
  });

  it('cai no rótulo padrão quando o control entrega um espião no lugar da string', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const saida = hoverCardSource(undefined, {
      args: { triggerLabel: spy as never, onOpenChange: spy as never } as never,
    });
    expect(saida).toContain('@joana');
    expect(saida).not.toContain('CORPO_DO_MOCK');
  });
});

describe('tempo', () => {
  it('a espera padrão não escreve atraso nenhum — a ausência é o assunto', () => {
    const saida = hoverCardWaitDefaultSource();
    expect(saida).toContain('<HoverCard>');
    expect(saida).not.toContain('openDelay');
    expect(saida).not.toContain('closeDelay');
    // E nem o `defaultOpen`, que ali serve só à captura visual da story.
    expect(saida).not.toContain('defaultOpen');
  });

  it('a espera curta declara os dois valores na raiz', () => {
    expect(hoverCardWaitCurtaSource()).toContain(
      '<HoverCard openDelay={150} closeDelay={100}>',
    );
  });
});

describe('estados', () => {
  it('fechado não anuncia expansão: o cartão não é um menu', () => {
    const saida = hoverCardClosedSource();
    expect(saida).not.toContain('aria-expanded');
    expect(saida).not.toContain('aria-haspopup');
    expect(saida).not.toContain('defaultOpen');
  });

  it('o modo controlado ensina o par open + onOpenChange com estado de verdade', () => {
    const saida = hoverCardControlledSource();
    expect(saida).toContain('import { useState } from "react";');
    expect(saida).toContain('const [aberto, setAberto] = useState(false);');
    expect(saida).toContain('<HoverCard open={aberto} onOpenChange={setAberto}>');
  });
});

describe('composições', () => {
  it('a prévia de link tira a inicial decorativa da árvore de acessibilidade', () => {
    const saida = hoverCardPreviaDeLinkSource();
    expect(saida).toContain('aria-hidden="true"');
    expect(saida).toContain('design-system.dev/overlays');
  });

  it('a definição usa botão com type e rótulo próprio no painel', () => {
    const saida = hoverCardDefinicaoSource();
    // Sem `type="button"` o mesmo gatilho dentro de um <form> enviaria o form.
    expect(saida).toContain('<button type="button"');
    // Sem `aria-label` o nome cairia no texto do gatilho e repetiria a sigla.
    expect(saida).toContain('aria-label="Definição de WCAG 2.2 AA"');
  });

  it('na métrica a cor semântica fica no número, e o texto corrido não a recebe', () => {
    const saida = hoverCardMetricaSource();
    expect(saida).toContain('<span className="nds-text-caption nds-font-medium nds-text-success">');
    const descricao = saida.slice(saida.indexOf('Tempo até o maior elemento'));
    expect(descricao).not.toContain('nds-text-success');
  });

  it('os quatro lados aparecem juntos, porque a fuga de colisão é o assunto', () => {
    const saida = hoverCardLadosSource();
    for (const lado of ['"top"', '"bottom"', '"left"', '"right"']) {
      expect(saida).toContain(lado);
    }
    expect(saida).toContain('side={lado}');
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
      const saida = fn();
      expect(saida).not.toContain('HoverCardForArgs');
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('{...args}');
      // Estilo inline de layout do canvas: `contain`, `minHeight`, `position`.
      expect(saida).not.toContain('minHeight');
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
