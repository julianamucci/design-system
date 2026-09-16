import { describe, expect, it } from 'vitest';
import {
  tooltipOpenSource,
  barTooltipShortcutSource,
  tooltipHelpInFormFieldSource,
  tooltipMetricDescriptionSource,
  tooltipWithShortcutSource,
  tooltipWithDelaySource,
  tooltipControlledSource,
  tooltipCollisionSource,
  tooltipCurtoSource,
  tooltipGroupWaitSource,
  tooltipLadosSource,
  tooltipPersistenteSource,
  tooltipSource,
  tooltipTextLongSource,
} from './tooltip.source';

const ALL = [
  tooltipSource,
  tooltipCurtoSource,
  tooltipWithShortcutSource,
  tooltipTextLongSource,
  tooltipOpenSource,
  tooltipWithDelaySource,
  tooltipPersistenteSource,
  tooltipControlledSource,
  barTooltipShortcutSource,
  tooltipLadosSource,
  tooltipCollisionSource,
  tooltipGroupWaitSource,
  tooltipHelpInFormFieldSource,
  tooltipMetricDescriptionSource,
];

describe('tooltipSource', () => {
  it('importa do design system, e o provider entra em toda montagem', () => {
    const saida = tooltipSource();
    expect(saida).toContain('} from "@/components/ui/tooltip";');
    expect(saida).toContain('<TooltipProvider');
  });

  it('nasce fechado, que é o padrão do componente', () => {
    expect(tooltipSource()).toContain('<Tooltip>');
  });

  it('leva o estado inicial ao snippet quando o control o liga', () => {
    expect(tooltipSource(undefined, { args: { defaultOpen: true } })).toContain(
      '<Tooltip defaultOpen>',
    );
  });

  it('omite posição, alinhamento e distância quando são os padrões', () => {
    const saida = tooltipSource(undefined, { args: { side: 'top', align: 'center', sideOffset: 4 } });
    expect(saida).toContain('<TooltipContent>');
    expect(saida).not.toContain('side=');
    expect(saida).not.toContain('align=');
    expect(saida).not.toContain('sideOffset=');
  });

  it('escreve posição, alinhamento e distância quando diferem', () => {
    const saida = tooltipSource(undefined, { args: { side: 'right', align: 'start', sideOffset: 12 } });
    expect(saida).toContain('side="right"');
    expect(saida).toContain('align="start"');
    expect(saida).toContain('sideOffset={12}');
  });

  it('não inventa lado fora da união nem distância que não é número', () => {
    const saida = tooltipSource(undefined, {
      args: { side: 'diagonal' as never, sideOffset: '12' as never },
    });
    expect(saida).not.toContain('diagonal');
    expect(saida).not.toContain('sideOffset');
  });

  it('o espião de onOpenChange nunca vira código no painel', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const saida = tooltipSource(undefined, { args: { onOpenChange: spy } as never });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).not.toContain('onOpenChange');
  });
});

describe('o gatilho é o botão de verdade', () => {
  it('usa render para emprestar as props do gatilho ao elemento existente', () => {
    for (const fn of ALL) {
      expect(fn(), `${fn.name} deve montar o gatilho por render`).toContain('<TooltipTrigger');
      expect(fn()).toContain('render={(props) =>');
    }
  });

  it('o do Playground é outline, a mesma variante que a story renderiza', () => {
    // Nenhum caso deste arquivo olhava a variante do gatilho, e foi essa
    // cegueira que deixou o defeito de pé: as stories foram alinhadas em
    // `outline`, o construtor ficou em `ghost`, e o leitor via um preview
    // contornado ao lado de um snippet fantasma.
    expect(tooltipSource()).toContain(
      '<Button {...props} variant="outline" size="icon" aria-label="Salvar">',
    );
    expect(tooltipSource()).not.toContain('variant="ghost"');
  });

  it('o botão só-ícone carrega o próprio nome — o balão não é o único portador', () => {
    for (const fn of [tooltipSource, tooltipCurtoSource, tooltipOpenSource, tooltipWithDelaySource]) {
      const saida = fn();
      expect(saida).toContain('aria-label="Salvar"');
      expect(saida).toContain('<Save aria-hidden="true" />');
    }
  });
});

describe('variantes', () => {
  it('a de atalho traz o gancho que encurta o respiro do balão', () => {
    for (const saida of [tooltipWithShortcutSource(), barTooltipShortcutSource()]) {
      expect(saida).toContain('<kbd className="nds-kbd" data-slot="kbd">Ctrl</kbd>');
      expect(saida).toContain('<kbd className="nds-kbd" data-slot="kbd">S</kbd>');
    }
  });

  it('as três variantes visuais nascem abertas, porque o balão só existe aberto', () => {
    for (const fn of [tooltipCurtoSource, tooltipWithShortcutSource, tooltipTextLongSource]) {
      expect(fn()).toContain('<Tooltip defaultOpen>');
    }
  });

  // O snippet do texto longo ensinava o botão de salvar com um ícone enquanto a
  // story `LongText` ao lado renderizava o botão de compartilhar — a mesma
  // distância entre painel e preview que já custou a variante do gatilho, e as
  // outras quatro stacks todas do lado da story. Quem lê copia o snippet.
  it('a de texto longo traz o gatilho de texto da story, não o de ícone', () => {
    const saida = tooltipTextLongSource();
    expect(saida).toContain(
      '<TooltipTrigger\n      render={(props) => <Button {...props} variant="outline">Compartilhar</Button>}\n    />',
    );
    expect(saida).toContain(
      'Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo',
    );
    // O ícone sai junto do gatilho: import sobrando é código que não compila
    // na mão de quem copia.
    expect(saida).not.toContain('import { Save } from "lucide-react";');
  });
});

describe('estados', () => {
  it('o atraso mora no provider e o gatilho pode ajustar o seu', () => {
    const saida = tooltipWithDelaySource();
    expect(saida).toContain('<TooltipProvider delay={600}>');
    expect(saida).toContain('delay={600}');
  });

  it('o gatilho persistente tem texto próprio — o balão só acrescenta', () => {
    const saida = tooltipPersistenteSource();
    expect(saida).toContain('Compartilhar');
    expect(saida).toContain('side="bottom"');
    // Sem ícone: aqui quem nomeia é o texto do botão.
    expect(saida).not.toContain('lucide-react');
  });

  it('o controlado ensina o par de estado, e não um invólucro de story', () => {
    const saida = tooltipControlledSource();
    expect(saida).toContain('import { useState } from "react";');
    expect(saida).toContain('const [aberto, setAberto] = useState(false);');
    expect(saida).toContain('<Tooltip open={aberto} onOpenChange={setAberto}>');
    // Dois botões, e não um alternador: o pointerdown do clique fora dispensa o
    // balão antes do click, e o alternador reabriria o que acabou de fechar.
    expect(saida).toContain('setAberto(true)');
    expect(saida).toContain('setAberto(false)');
    expect(saida).not.toContain('ControlledDemo');
  });
});

describe('composições', () => {
  it('a ajuda do campo não rouba o nome de ninguém', () => {
    const saida = tooltipHelpInFormFieldSource();
    // O ícone tem nome PRÓPRIO, e o campo continua rotulado pelo <label>: o
    // balão acrescenta contexto, nunca sustenta o nome acessível.
    expect(saida).toContain('aria-label="Ajuda sobre Token de API"');
    expect(saida).toContain('<label htmlFor="api-token"');
    expect(saida).toContain('<input id="api-token"');
  });

  it('a métrica explica a sigla e não promete lado', () => {
    const saida = tooltipMetricDescriptionSource();
    expect(saida).toContain('aria-label="O que é LCP"');
    expect(saida).toContain('Largest Contentful Paint');
    // `side` fica no padrão: escrever o lado prometeria o que a borda desmente.
    expect(saida).not.toContain('side=');
  });

  it('os quatro lados aparecem juntos, porque side é preferência e não garantia', () => {
    const saida = tooltipLadosSource();
    expect(saida).toContain('const lados = ["top", "right", "bottom", "left"] as const;');
    expect(saida).toContain('<TooltipContent side={lado}>');
  });

  it('a colisão ensina o lado PEDIDO, porque o final é a lib que decide', () => {
    const saida = tooltipCollisionSource();
    expect(saida).toContain('side="top"');
    // O andaime que encosta o gatilho na borda é da story, não do componente:
    // quem copia escolhe onde o gatilho vive.
    expect(saida).not.toContain('position');
  });

  it('a espera do grupo publica as DUAS medidas do provedor', () => {
    const saida = tooltipGroupWaitSource();
    // `delay` é quanto o primeiro espera; `timeout` é a janela em que o
    // vizinho abre na hora. Ensinar só a primeira esconde metade do provedor.
    expect(saida).toContain('<TooltipProvider delay={800} timeout={5000}>');
    expect(saida).toContain('Copiar');
    expect(saida).toContain('Colar');
  });
});

describe('nenhum snippet ensina o andaime da story', () => {
  it('não há fixture, invólucro nem estilo de captura', () => {
    for (const fn of ALL) {
      const saida = fn();
      expect(saida, `${fn.name}`).not.toContain('fixtures');
      expect(saida).not.toContain('balaoDe');
      // `contain: layout` / `minHeight` existem só para o balão portalizado ter
      // contra o que se posicionar dentro do quadro do Storybook.
      expect(saida).not.toContain('contain:');
      expect(saida).not.toContain('minHeight');
      expect(saida).not.toContain('wrapperStyle');
    }
  });
});
