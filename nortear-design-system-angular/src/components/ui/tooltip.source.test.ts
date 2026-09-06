import { describe, expect, it } from 'vitest';
import * as tooltipSource from './tooltip.source';
import {
  tooltipClosedSource,
  tooltipDefaultSource,
  tooltipDelaySource,
  tooltipFormFieldHelpSource,
  tooltipIconButtonShortcutSource,
  tooltipLongTextSource,
  tooltipMetricDescriptionSource,
  tooltipOpenSource,
  tooltipPersistenceSource,
  tooltipPlacementSidesSource,
  tooltipPlaygroundSource,
  tooltipWithShortcutSource,
} from './tooltip.source';

/**
 * O painel Code imprime o `template` da story literalmente, com os bindings
 * ligados aos args — quem lê copiaria código que só compila dentro da story. O
 * `transform` devolve o uso real, e é isto que estes casos guardam.
 *
 * As outras quatro stacks já tinham este teste. A ausência dele aqui custou
 * caro: quando as stories foram alinhadas e os construtores não, o gatilho do
 * Playground passou a renderizar `outline` enquanto o snippet ao lado ensinava
 * `ghost`, e nenhum portão viu. Vue e Svelte, que já tinham o teste, não
 * divergiram.
 */
describe('tooltipPlaygroundSource', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const code = tooltipPlaygroundSource();
    expect(code).toContain("import { NDS_TOOLTIP } from '@/components/ui/tooltip';");
    expect(code).toContain("import { NdsButton } from '@/components/ui/button';");
    expect(code).toContain('<span ndsTooltip>');
    expect(code).toContain('<ng-template ndsTooltipContent>');
    // O que só existe dentro da story: binding para os args do Storybook,
    // espião de output e os atributos que a diretiva escreve em runtime.
    expect(code).not.toContain('args.');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('[attr.');
    expect(code).not.toContain('openChange');
    expect(code).not.toContain('[open]');
  });

  it('omite lado, alinhamento e distância quando são os padrões', () => {
    const code = tooltipPlaygroundSource('', {
      args: { side: 'top', align: 'center', sideOffset: 4 },
    });
    // Repetir valor padrão no snippet ensina ruído: quem copia passa a declarar
    // o que já vem de graça, e some a informação de que existe um padrão.
    //
    // A asserção olha a TAG inteira, e não a substring `align=`: um
    // `not.toContain('align=')` casaria num `data-align="start"` legítimo em
    // qualquer cluster do snippet, reprovando por defeito da asserção.
    expect(code).toContain('<ng-template ndsTooltipContent>');
  });

  it('imprime lado, alinhamento e distância quando diferem, com o valor do control', () => {
    const code = tooltipPlaygroundSource('', {
      args: { side: 'right', align: 'start', sideOffset: 12 },
    });
    expect(code).toContain(
      '<ng-template ndsTooltipContent side="right" align="start" [sideOffset]="12">',
    );
  });

  it('o texto do balão vem dos controls', () => {
    const code = tooltipPlaygroundSource('', { args: { label: 'Duplicar' } });
    expect(code).toContain('>Duplicar</ng-template>');
    expect(code).not.toContain('Salvar (Ctrl+S)');
  });

  it('o gatilho é outline, a mesma variante que a story do Playground renderiza', () => {
    // Este é o caso que faltava. O commit que alinhou as stories não tocou nos
    // construtores, e o snippet seguiu ensinando `ghost` ao lado de um preview
    // `outline` — divergência que só um caso sobre a variante alcança.
    const code = tooltipPlaygroundSource();
    expect(code).toContain(
      '<button ndsTooltipTrigger ndsButton variant="outline" size="icon" aria-label="Salvar">',
    );
    expect(code).not.toContain('variant="ghost"');
  });

  it('o provider entra uma vez só, no root, e é ele que carrega a espera', () => {
    // A espera é comum a todos os balões da aplicação: declará-la no balão
    // ensinaria a duplicá-la em cada gatilho.
    const code = tooltipPlaygroundSource('', { args: { delay: 600 } });
    expect(code.match(/ndsTooltipProvider/g)).toHaveLength(1);
    expect(code).toContain('<div ndsTooltipProvider [delay]="600">');
    expect(code).not.toContain('[delay]="0"');
  });

  it('o botão só-ícone carrega o próprio nome — o balão não é o único portador', () => {
    // Quem chega pelo toque nunca vê o balão: sem o `aria-label` no botão, o
    // gatilho fica anônimo para quem não usa mouse.
    const code = tooltipPlaygroundSource();
    expect(code).toContain('aria-label="Salvar"');
    // E o ícone sai da árvore de acessibilidade, para não competir com o rótulo.
    expect(code).toContain('aria-hidden="true"');
  });
});

/**
 * Os onze construtores das outras três stories, e a story que cada um serve.
 *
 * A lista existe para ser COBRADA: o caso logo abaixo compara com o que o
 * módulo exporta, e um construtor novo que não entre aqui reprova em vez de
 * sair calado da varredura. É a lição do `source-snippets.test.ts` do Vue, onde
 * 28 exports saíram do alcance e a suíte seguiu verde medindo menos.
 */
const CONSTRUCTORS: Array<{
  name: string;
  story: string;
  build: () => string;
  /**
   * Construtor que IMPRIME o valor de um control, e por isso não responde pela
   * regra da espera lá embaixo.
   *
   * Exceção única e declarada: chamado sem args, o Playground cai no padrão do
   * próprio control (`delay: 0`) e publica `[delay]="0"` — ali o zero não é
   * andaime, é o que a pessoa acabou de escolher na barra. Nos outros onze
   * snippets o valor é FIXO no construtor, e um zero só poderia ter vindo da
   * story.
   */
  argsDriven?: true;
}> = [
  {
    name: 'tooltipPlaygroundSource',
    story: 'Playground',
    build: tooltipPlaygroundSource,
    argsDriven: true,
  },
  { name: 'tooltipDefaultSource', story: 'Variants/Default', build: tooltipDefaultSource },
  {
    name: 'tooltipWithShortcutSource',
    story: 'Variants/WithShortcut',
    build: tooltipWithShortcutSource,
  },
  { name: 'tooltipLongTextSource', story: 'Variants/LongText', build: tooltipLongTextSource },
  { name: 'tooltipClosedSource', story: 'States/Closed', build: tooltipClosedSource },
  { name: 'tooltipOpenSource', story: 'States/Open', build: tooltipOpenSource },
  // Serve DUAS stories: Hover e Focus renderizam este mesmo markup, e a
  // diferença entre elas é de interação, não de código. Um segundo construtor
  // idêntico seria a cópia que envelhece sozinha.
  { name: 'tooltipDelaySource', story: 'States/Hover + States/Focus', build: tooltipDelaySource },
  {
    name: 'tooltipPersistenceSource',
    story: 'States/PersistenceInBubble',
    build: tooltipPersistenceSource,
  },
  {
    name: 'tooltipIconButtonShortcutSource',
    story: 'Compositions/IconButtonWithShortcut',
    build: tooltipIconButtonShortcutSource,
  },
  {
    name: 'tooltipFormFieldHelpSource',
    story: 'Compositions/HelpInFormField',
    build: tooltipFormFieldHelpSource,
  },
  {
    name: 'tooltipMetricDescriptionSource',
    story: 'Compositions/MetricDescription',
    build: tooltipMetricDescriptionSource,
  },
  {
    name: 'tooltipPlacementSidesSource',
    story: 'Compositions/PlacementSides',
    build: tooltipPlacementSidesSource,
  },
];

describe('cobertura das quatro stories', () => {
  it('todo construtor exportado pelo módulo entra na varredura', () => {
    const exportados = Object.entries(tooltipSource)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exportados).toEqual(CONSTRUCTORS.map((c) => c.name).sort());
  });

  for (const { name, story, build, argsDriven } of CONSTRUCTORS) {
    it(`${name} (${story}) publica o componente, não o andaime da story`, () => {
      const code = build();
      // `nds-p-8` dá ao balão portalizado contra o que se posicionar dentro do
      // quadro do Storybook, e `[delay]="0"` faz o hover abrir na hora para a
      // `play`. Nenhum dos dois é do componente — o único snippet de valor fixo
      // que fala de espera é o da própria story de espera, e ele diz 600.
      expect(code).not.toContain('nds-p-8');
      if (!argsDriven) expect(code).not.toContain('[delay]="0"');
      expect(code).not.toContain('args.');
      // A diretiva escreve os `data-slot` do tooltip em runtime; o único que se
      // ESCREVE é o da tecla, que é gancho da folha compartilhada.
      expect(code).not.toContain('data-slot="tooltip');
      // O provider é um só, no root — um por balão é o erro que o comentário
      // dentro do snippet existe para evitar.
      expect(code.match(/ndsTooltipProvider/g)).toHaveLength(1);
    });
  }
});

describe('variantes', () => {
  it('tooltipDefaultSource nasce aberto, com o gatilho ghost que a story renderiza', () => {
    // O balão só existe no DOM enquanto aberto: sem `defaultOpen` o snippet
    // ensinaria uma tela diferente da que está ao lado dele.
    const code = tooltipDefaultSource();
    expect(code).toContain('<span ndsTooltip [defaultOpen]="true">');
    expect(code).toContain(
      '<button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">',
    );
    expect(code).not.toContain('variant="outline"');
    expect(code).toContain('<ng-template ndsTooltipContent>Salvar</ng-template>');
  });

  it('tooltipWithShortcutSource escreve o data-slot da tecla, que é o gancho da folha', () => {
    // `.nds-tooltip-content:has([data-slot="kbd"])` encurta o respiro à direita.
    // Sem o atributo a regra existe e não pinta nada, e quem copia recebe um
    // balão com folga a mais de um lado só.
    const code = tooltipWithShortcutSource();
    expect(code).toContain('<kbd class="nds-kbd" data-slot="kbd">Ctrl</kbd>');
    expect(code).toContain('<kbd class="nds-kbd" data-slot="kbd">S</kbd>');
    expect(code.match(/data-slot="kbd"/g)).toHaveLength(2);
  });

  it('tooltipLongTextSource tem gatilho de TEXTO, e o texto do balão numa linha só', () => {
    // A story renderiza um botão escrito, não um de ícone — e o balão é
    // `inline-flex`: recuo em volta do texto viraria espaço visível dentro dele.
    const code = tooltipLongTextSource();
    expect(code).toContain(
      '<button ndsTooltipTrigger ndsButton variant="outline">Compartilhar</button>',
    );
    expect(code).not.toContain('aria-label="Salvar"');
    expect(code).not.toContain('<svg');
    expect(code).toContain(
      '<ng-template ndsTooltipContent side="bottom">Cria um link público de leitura — qualquer pessoa com o link vê o conteúdo</ng-template>',
    );
  });
});

describe('estados', () => {
  it('tooltipClosedSource não pede abertura nenhuma — fechado é o que o componente faz sozinho', () => {
    const code = tooltipClosedSource();
    expect(code).toContain('<span ndsTooltip>');
    expect(code).not.toContain('[defaultOpen]');
    expect(code).not.toContain('[open]');
    expect(code).not.toContain('(openChange)');
  });

  it('tooltipOpenSource liga as DUAS pontas do estado, e guarda o estado num sinal', () => {
    // Ligar só `open` é o defeito clássico: o balão fecha sozinho no Escape e
    // no blur, e o estado de fora continua dizendo que está aberto.
    const code = tooltipOpenSource();
    expect(code).toContain('<span ndsTooltip [open]="isOpen()" (openChange)="isOpen.set($event)">');
    expect(code).toContain('readonly isOpen = signal(true);');
  });

  it('tooltipDelaySource põe a espera no provider, uma vez, e não no gatilho', () => {
    // A espera é comum a todos os balões da aplicação; declará-la no gatilho
    // ensinaria a repeti-la em cada um.
    const code = tooltipDelaySource();
    expect(code).toContain('<div ndsTooltipProvider [delay]="600">');
    expect(code.match(/\[delay\]/g)).toHaveLength(1);
  });

  it('tooltipPersistenceSource não inventa prop para o que é do componente', () => {
    // Persistência é requisito da WCAG 1.4.13 e não tem chave para ligar: o
    // snippet mostra o gatilho que já se explica sozinho, e nada além.
    const code = tooltipPersistenceSource();
    expect(code).toContain(
      '<button ndsTooltipTrigger ndsButton variant="outline">Compartilhar</button>',
    );
    expect(code).toContain(
      '<ng-template ndsTooltipContent side="bottom">Cria um link público de leitura</ng-template>',
    );
    expect(code).not.toContain('disableHoverablePopup');
  });
});

describe('composições', () => {
  it('tooltipIconButtonShortcutSource deixa a AÇÃO no rótulo e a tecla no balão', () => {
    // Invertido — rótulo genérico e a ação só no balão — quem usa toque fica
    // sem a informação, porque em toque não há hover.
    const code = tooltipIconButtonShortcutSource();
    expect(code).toContain(
      '<button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">',
    );
    expect(code.match(/data-slot="kbd"/g)).toHaveLength(2);
    expect(code).toContain('<div ndsTooltipProvider class="nds-cluster" data-spacing="sm">');
  });

  it('tooltipFormFieldHelpSource nomeia o campo pelo rótulo, e o gatilho por si', () => {
    // O `for`/`id` é o que nomeia o campo; o balão diz ONDE achar o valor, e
    // pode faltar sem quebrar o formulário. O ícone de ajuda é um botão
    // focável, com nome próprio — num `<span>` ficaria fora do teclado.
    const code = tooltipFormFieldHelpSource();
    expect(code).toContain('<label ndsLabel for="token-api">Token da API</label>');
    expect(code).toContain('<input ndsInput id="token-api" placeholder="ndsk_..." />');
    expect(code).toContain('aria-label="Onde encontrar o token da API"');
    expect(code).toContain("import { NdsInput } from '@/components/ui/input';");
    expect(code).toContain("import { NdsLabel } from '@/components/ui/label';");
  });

  it('tooltipMetricDescriptionSource mantém a sigla VISÍVEL, e só a expande no balão', () => {
    const code = tooltipMetricDescriptionSource();
    expect(code).toContain('<span ndsCardTitle>LCP</span>');
    expect(code).toContain(
      '<ng-template ndsTooltipContent>LCP — Largest Contentful Paint</ng-template>',
    );
    expect(code).toContain("import { NDS_CARD } from '@/components/ui/card';");
  });

  it('tooltipPlacementSidesSource tipa a lista de lados, senão o binding não compila', () => {
    // Um `string[]` não passa no `[side]`, e o erro sairia no `ngc` de quem
    // copiou — longe daqui, e sem explicação. Expressão de template também só
    // enxerga MEMBRO de classe: a lista tem de ser campo, não constante solta.
    const code = tooltipPlacementSidesSource();
    expect(code).toContain(
      "import { NDS_TOOLTIP, type TooltipSide } from '@/components/ui/tooltip';",
    );
    expect(code).toContain("readonly sides: TooltipSide[] = ['top', 'right', 'bottom', 'left'];");
    expect(code).toContain('@for (side of sides; track side) {');
    expect(code).toContain(
      '<ng-template ndsTooltipContent [side]="side">Tooltip {{ side }}</ng-template>',
    );
  });
});
