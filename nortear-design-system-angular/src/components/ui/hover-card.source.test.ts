import { describe, expect, it } from 'vitest';
import * as hoverCardSource from './hover-card.source';
import {
  hoverCardClassNameExtraSource,
  hoverCardControlledSource,
  hoverCardDefinicaoSource,
  hoverCardLadosSource,
  hoverCardMetricaSource,
  hoverCardPerfilSource,
  hoverCardPlaygroundSource,
  hoverCardPreviaDeLinkSource,
  hoverCardWaitCurtaSource,
  hoverCardWaitDefaultSource,
} from './hover-card.source';

/**
 * O painel Code imprime o `template` da story literalmente, com os bindings
 * ligados aos args — quem lê copiaria código que só compila dentro da story. O
 * `transform` devolve o uso real, e é isto que estes casos guardam.
 *
 * As outras quatro stacks já tinham este teste; o angular era a única sem, e é
 * ele que impede a story e o snippet de divergirem em silêncio. Nesta campanha
 * a divergência apareceu duas vezes em outros componentes: o preview mudou, o
 * snippet ao lado continuou ensinando a forma antiga, e nenhum portão viu.
 *
 * Até 2026-09-09 o arquivo guardava UM construtor, o do Playground, e as outras
 * onze stories publicavam o template cru. É a mesma proporção medida em
 * tooltip, sheet, dropdown-menu, context-menu e drawer — 1 para 13, 1 para 12,
 * 1 para 13, 1 para 11 —, e não é descuido pontual: é como componente nasce
 * nesta stack.
 */

// ─── O TEXTO das stories ─────────────────────────────────────────────────────
//
// Lido, e não importado: importar um arquivo de story fora do compilador
// Angular quebra, e a pergunta aqui não precisa de execução — é sobre o que o
// arquivo ESCREVE. É a mesma leitura por `?raw` que o `source-snippets.test.ts`
// já faz nos módulos de componente.

const storySources = import.meta.glob<string>('./hover-card*.stories.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const STORY_START = /^export const (\w+): Story = \{/gm;

/** O bloco de texto de uma story, do `export const` até o próximo. */
function storyBlock(source: string, name: string): string {
  const marks = [...source.matchAll(STORY_START)];
  const i = marks.findIndex((m) => m[1] === name);
  if (i === -1) return '';
  const end = i + 1 < marks.length ? marks[i + 1]!.index! : source.length;
  return source.slice(marks[i]!.index!, end);
}

/** O `template` que a story renderiza, como ela o escreve. */
function storyTemplate(file: string, name: string): string {
  const block = storyBlock(storySources[file] ?? '', name);
  return /template:\s*`([\s\S]*?)`/.exec(block)?.[1] ?? '';
}

/**
 * A transform que cada story publica no painel — a dela, ou a que o `meta`
 * declarou para o arquivo inteiro.
 */
function transformsByStory(source: string): Map<string, string> {
  const marks = [...source.matchAll(STORY_START)];
  const header = marks.length ? source.slice(0, marks[0]!.index) : source;
  const fromMeta = /transform:\s*(\w+)/.exec(header)?.[1] ?? '(nenhum)';

  const out = new Map<string, string>();
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1]!.index! : source.length;
    const block = source.slice(m.index!, end);
    out.set(m[1]!, /transform:\s*(\w+)/.exec(block)?.[1] ?? fromMeta);
  });
  return out;
}

// ─── Os dez construtores, e a story que cada um serve ────────────────────────
//
// A tabela existe para ser COBRADA. Dois casos a comparam com a realidade: um
// com o que o módulo exporta, outro com o que os quatro arquivos de story
// publicam. Construtor novo que não entre aqui reprova, e story nova sem
// transform também — em vez de saírem calados da varredura. É a lição do
// `source-snippets.test.ts` do Vue, onde 28 exports saíram do alcance e a suíte
// seguiu verde medindo menos.

const CONSTRUCTORS: Array<{
  name: string;
  stories: Array<{ file: string; story: string }>;
  build: () => string;
  /**
   * Construtor que IMPRIME o valor de um control, e por isso não responde pela
   * regra da espera lá embaixo.
   *
   * Exceção única e declarada: chamado sem args, o Playground cai no padrão do
   * próprio control e omite os dois atrasos; chamado COM args, publica o que a
   * pessoa acabou de escolher na barra — inclusive um valor curto. Nos outros
   * nove snippets o valor é FIXO no construtor.
   */
  argsDriven?: true;
  /** Construtor cujo ASSUNTO é a espera curta, e que por isso a escreve. */
  shortDelayIsTheSubject?: true;
  /** Construtor que legitimamente carrega o respiro em volta do gatilho. */
  sideBreathingRoom?: true;
}> = [
  {
    name: 'hoverCardPlaygroundSource',
    stories: [{ file: './hover-card.stories.ts', story: 'Playground' }],
    build: hoverCardPlaygroundSource,
    argsDriven: true,
  },
  {
    // A EXCEÇÃO DECLARADA deste componente, e a mesma que as outras quatro
    // stacks fazem: três stories compartilham um construtor.
    //
    // States/Closed, States/Open e Compositions/UserProfile renderizam o MESMO
    // markup — a menção no meio de um comentário revelando o perfil. O que as
    // separa é interação (nada aberto, aberto por ponteiro, aberto para a
    // foto), e interação não aparece em snippet. Três construtores idênticos
    // seriam duas cópias esperando para envelhecer sozinhas.
    //
    // A premissa é verificada logo abaixo, em "premissa da exceção": um caso
    // compara os três templates entre si e reprova nomeando o que divergiu.
    name: 'hoverCardPerfilSource',
    stories: [
      { file: './hover-card-states.stories.ts', story: 'Closed' },
      { file: './hover-card-states.stories.ts', story: 'Open' },
      { file: './hover-card-compositions.stories.ts', story: 'UserProfile' },
    ],
    build: hoverCardPerfilSource,
  },
  {
    name: 'hoverCardWaitDefaultSource',
    stories: [{ file: './hover-card-variants.stories.ts', story: 'Default' }],
    build: hoverCardWaitDefaultSource,
  },
  {
    name: 'hoverCardWaitCurtaSource',
    stories: [{ file: './hover-card-variants.stories.ts', story: 'WithShortDelay' }],
    build: hoverCardWaitCurtaSource,
    shortDelayIsTheSubject: true,
  },
  {
    name: 'hoverCardControlledSource',
    stories: [{ file: './hover-card-states.stories.ts', story: 'Controlled' }],
    build: hoverCardControlledSource,
  },
  {
    name: 'hoverCardPreviaDeLinkSource',
    stories: [{ file: './hover-card-compositions.stories.ts', story: 'LinkPreview' }],
    build: hoverCardPreviaDeLinkSource,
  },
  {
    name: 'hoverCardDefinicaoSource',
    stories: [{ file: './hover-card-compositions.stories.ts', story: 'TermDefinition' }],
    build: hoverCardDefinicaoSource,
  },
  {
    name: 'hoverCardMetricaSource',
    stories: [{ file: './hover-card-compositions.stories.ts', story: 'ExplainedMetric' }],
    build: hoverCardMetricaSource,
  },
  {
    name: 'hoverCardLadosSource',
    stories: [{ file: './hover-card-compositions.stories.ts', story: 'Sides' }],
    build: hoverCardLadosSource,
    sideBreathingRoom: true,
  },
  {
    name: 'hoverCardClassNameExtraSource',
    stories: [{ file: './hover-card-compositions.stories.ts', story: 'ExtraPanelClass' }],
    build: hoverCardClassNameExtraSource,
  },
];

describe('cobertura das quatro stories', () => {
  it('todo construtor exportado pelo módulo entra na varredura', () => {
    const exported = Object.entries(hoverCardSource)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exported).toEqual(CONSTRUCTORS.map((c) => c.name).sort());
  });

  it('os quatro arquivos de story chegaram à varredura', () => {
    // Sem esta linha, um glob que deixasse de casar apagaria os dois casos
    // abaixo em silêncio — e uma suíte verde medindo zero é pior que vermelha.
    expect(Object.keys(storySources).sort()).toEqual([
      './hover-card-compositions.stories.ts',
      './hover-card-states.stories.ts',
      './hover-card-variants.stories.ts',
      './hover-card.stories.ts',
    ]);
  });

  it('toda story publica o construtor que esta tabela declara', () => {
    // Cobre os dois sentidos: story sem transform (que publicaria o template
    // cru, que é a regra `story_file_sem_transform` do audit) e story nova que
    // herdou o transform do `meta` sem ninguém decidir isso.
    const declared = new Map<string, string>();
    for (const { name, stories } of CONSTRUCTORS) {
      for (const { file, story } of stories) declared.set(`${file}#${story}`, name);
    }

    const actual = new Map<string, string>();
    for (const [file, source] of Object.entries(storySources)) {
      for (const [story, transform] of transformsByStory(source)) {
        actual.set(`${file}#${story}`, transform);
      }
    }

    expect(Object.fromEntries([...actual].sort())).toEqual(
      Object.fromEntries([...declared].sort()),
    );
  });
});

// ─── Premissa da exceção ─────────────────────────────────────────────────────
//
// Exceção que não se verifica apodrece. Estes casos são o que impede a exceção
// acima de virar um comentário que já não descreve nada.

/**
 * O andaime que separa os três templates — e SÓ ele.
 *
 * Cada entrada é uma decisão declarada: por que aquele pedaço não entra no
 * snippet. Se uma delas deixar de aparecer nas stories, o terceiro caso desta
 * seção reprova — a lista não pode virar um conjunto de expressões mortas.
 */
const SCAFFOLD_OF_THE_THREE = [
  {
    name: '[defaultOpen]="true"',
    pattern: /\s*\[defaultOpen\]="true"/g,
    why:
      'Compositions/UserProfile abre o cartão para a captura visual. Um cartão de ' +
      'hover que já nasce aberto é o oposto do que o componente promete.',
  },
  {
    name: '[openDelay]="100"',
    pattern: /\s*\[openDelay\]="100"/g,
    why:
      'States/Open encurta a espera para a play não aguardar 600ms. A diretriz de ' +
      'uso desta página desaconselha espera abaixo de ~300ms.',
  },
  {
    name: '[closeDelay]="80"',
    pattern: /\s*\[closeDelay\]="80"/g,
    why: 'A outra metade da pressa da play em States/Open.',
  },
];

/** O template sem o andaime declarado, e sem a diferença que é só de formatação. */
function withoutScaffold(template: string): string {
  let text = template;
  for (const { pattern } of SCAFFOLD_OF_THE_THREE) text = text.replace(pattern, '');
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+>/g, '>')
    .trim();
}

describe('premissa da exceção: um construtor para três stories', () => {
  const THE_THREE = [
    { file: './hover-card-states.stories.ts', story: 'Closed' },
    { file: './hover-card-states.stories.ts', story: 'Open' },
    { file: './hover-card-compositions.stories.ts', story: 'UserProfile' },
  ];

  it('os três templates existem e não voltaram vazios da leitura', () => {
    for (const { file, story } of THE_THREE) {
      expect(storyTemplate(file, story), `${file}#${story}`).toContain('ndsHoverCard');
    }
  });

  it('e renderizam o MESMO markup, tirado o andaime declarado', () => {
    // Este é o caso que dá dentes à exceção. No dia em que qualquer uma das
    // três ganhar um elemento, trocar o gatilho ou mudar o cartão, elas param
    // de poder compartilhar um construtor — e é aqui que isso aparece, em vez
    // de num snippet que passou a ensinar a story errada.
    const [first, ...rest] = THE_THREE;
    const reference = withoutScaffold(storyTemplate(first!.file, first!.story));
    for (const { file, story } of rest) {
      expect(
        withoutScaffold(storyTemplate(file, story)),
        `${file}#${story} divergiu de ${first!.file}#${first!.story}: as três ` +
          'stories deixaram de renderizar o mesmo markup, então hoverCardPerfilSource não ' +
          'pode mais servir às três — dê a esta um construtor próprio',
      ).toBe(reference);
    }
  });

  it('cada pedaço declarado como andaime ainda EXISTE nas três stories', () => {
    // A outra metade da verificação. Uma exceção cuja premissa sumiu é uma
    // exceção que ninguém releu: se a story deixou de abrir por `defaultOpen`,
    // ou se a espera de conveniência mudou de valor, a decisão precisa ser
    // tomada de novo — e não continuar valendo por inércia.
    const all = THE_THREE.map(({ file, story }) => storyTemplate(file, story)).join('\n');
    for (const { name, pattern, why } of SCAFFOLD_OF_THE_THREE) {
      expect(
        new RegExp(pattern.source).test(all),
        `${name} não aparece mais nas três stories — a exceção declarada ("${why}") ` +
          'perdeu a premissa e precisa ser reexaminada',
      ).toBe(true);
    }
  });

  it('e o construtor publica o markup que as três renderizam', () => {
    const code = hoverCardPerfilSource();
    expect(code).toContain(
      '<a ndsHoverCardTrigger href="/users/joana" class="nds-text-primary nds-font-medium">@joana</a>',
    );
    expect(code).toContain('<span ndsHoverCard>');
    expect(code).toContain('<ng-template ndsHoverCardContent>');
    // O cartão de perfil vem da MESMA fixture que as stories interpolam.
    expect(code).toContain('<span ndsAvatarFallback aria-hidden="true">JS</span>');
    expect(code).toContain('Designer · 142 seguidores');
    // E nada do andaime das três.
    expect(code).not.toContain('[defaultOpen]');
    expect(code).not.toContain('[openDelay]');
    expect(code).not.toContain('[closeDelay]');
  });
});

describe('nenhum snippet publica o andaime da story', () => {
  for (const {
    name,
    build,
    argsDriven,
    shortDelayIsTheSubject,
    sideBreathingRoom,
  } of CONSTRUCTORS) {
    it(`${name} publica o componente, e não o template da story`, () => {
      const code = build();

      // O que só existe dentro da story: binding para os args do Storybook,
      // espião de output e os atributos que a diretiva escreve em runtime.
      expect(code).not.toContain('args.');
      expect(code).not.toContain('data-slot=');
      expect(code).not.toContain('[attr.');
      expect(code).not.toContain('data-testid=');

      // O andaime de captura: altura mínima e contenção que dão ao painel
      // portalizado contra o que se posicionar dentro do quadro do Storybook.
      expect(code).not.toContain('nds-min-h-50');
      expect(code).not.toContain('contain: layout');
      expect(code).not.toContain('style=');

      // O cartão que nasce aberto para a foto.
      expect(code).not.toContain('[defaultOpen]');

      // A espera de conveniência. `nds-p-8` é o respiro de Compositions/Sides,
      // e é o único que NÃO é andaime: sem ele os quatro cartões colidem e a
      // story deixa de mostrar o que promete.
      if (!argsDriven && !shortDelayIsTheSubject) {
        expect(code).not.toContain('[openDelay]');
        expect(code).not.toContain('[closeDelay]');
      }
      if (!sideBreathingRoom) expect(code).not.toContain('nds-p-8');

      // O gatilho vive dentro de uma frase, e é isso que dispensa o alvo em
      // linha do mínimo de 24px da WCAG 2.5.8.
      expect(code).toContain('<p class="nds-text-body');
    });
  }
});

describe('hoverCardPlaygroundSource', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const code = hoverCardPlaygroundSource();
    expect(code).toContain("import { NDS_HOVER_CARD } from '@/components/ui/hover-card';");
    expect(code).toContain('<span ndsHoverCard>');
    expect(code).toContain('ndsHoverCardTrigger');
    expect(code).toContain('<ng-template ndsHoverCardContent');
    // O que o renderer imprimiria sozinho: binding para args e o espião de
    // output ligado ao `(openChange)` da story.
    expect(code).not.toContain('args.');
    expect(code).not.toContain('(openChange)');
  });

  it('omite atraso e posição quando são o padrão', () => {
    const code = hoverCardPlaygroundSource('', {
      args: { openDelay: 600, closeDelay: 300, side: 'bottom', align: 'center' },
    });
    // Repetir valor padrão no snippet ensina ruído: quem copia passa a declarar
    // o que já vem de graça, e some a informação de que existe um padrão.
    expect(code).not.toContain('[openDelay]');
    expect(code).not.toContain('[closeDelay]');
    // A asserção olha a TAG, não a substring: o cartão de perfil traz
    // `data-align="start"` no cluster, e um `not.toContain('align=')` casaria
    // ali dentro. Foi o que esta primeira versão fez, e o caso reprovou por
    // defeito da asserção, não do construtor.
    expect(code).toContain('<ng-template ndsHoverCardContent>');
  });

  it('imprime atraso e posição quando diferem do padrão', () => {
    const code = hoverCardPlaygroundSource('', {
      args: { openDelay: 500, closeDelay: 200, side: 'right', align: 'start' },
    });
    expect(code).toContain('[openDelay]="500"');
    expect(code).toContain('[closeDelay]="200"');
    expect(code).toContain('side="right"');
    expect(code).toContain('align="start"');
  });

  it('leva o rótulo do gatilho que veio dos controls', () => {
    const code = hoverCardPlaygroundSource('', { args: { triggerLabel: '@maria' } });
    expect(code).toContain('>@maria</a>');
  });

  it('o gatilho continua um link navegável', () => {
    // É a lição do par 1 do Do & Don't desta página: o cartão complementa o
    // link, não o substitui. Um snippet que ensinasse `<span>` no gatilho
    // ensinaria a versão que quebra para quem usa toque.
    const code = hoverCardPlaygroundSource();
    expect(code).toContain('href="/users/joana"');
    expect(code).toMatch(/<a\s+[^>]*ndsHoverCardTrigger/s);
  });

  it('e é o único gatilho com sublinhado no hover — as outras stories não o têm', () => {
    // Divergência do tipo que derrubou o tooltip nesta campanha: o Playground
    // renderiza `nds-hover-underline`, as outras onze stories não. Um construtor
    // compartilhado teria apagado a diferença nos dois sentidos.
    expect(hoverCardPlaygroundSource()).toContain(
      'class="nds-text-primary nds-font-medium nds-hover-underline"',
    );
    for (const { name, build } of CONSTRUCTORS.filter(
      (c) => c.name !== 'hoverCardPlaygroundSource',
    )) {
      expect(build(), name).not.toContain('nds-hover-underline');
    }
  });
});

describe('variantes', () => {
  it('a espera padrão não escreve atraso nenhum — a ausência é o assunto', () => {
    const code = hoverCardWaitDefaultSource();
    expect(code).toContain('<span ndsHoverCard>');
    expect(code).not.toContain('openDelay');
    expect(code).not.toContain('closeDelay');
    // E o texto do cartão é o da story, que EXPLICA o padrão em vez de o
    // declarar no markup.
    expect(code).toContain('Espera padrão: 600ms para abrir e 300ms para fechar.');
  });

  it('a espera curta declara os dois valores no GATILHO, que é onde eles moram', () => {
    // Na raiz o binding não resolve: o primitivo lê `openDelay`/`closeDelay` do
    // gatilho no `pointerenter`/`focus`, e é o que permite dois gatilhos com
    // tempos diferentes compartilhando um cartão.
    const code = hoverCardWaitCurtaSource();
    // Os dois bindings estão DENTRO do gatilho, e não na raiz: a asserção
    // recorta o `<a>` em vez de procurar a substring no arquivo inteiro, que
    // passaria com eles escritos em qualquer lugar.
    const trigger = code.slice(code.indexOf('<a\n'), code.indexOf('</a>'));
    expect(trigger).toContain('[openDelay]="150"');
    expect(trigger).toContain('[closeDelay]="100"');
    expect(code).not.toMatch(/<span ndsHoverCard \[/);
    expect(code).toContain('href="https://design-system.dev"');
  });
});

describe('estados', () => {
  it('o modo controlado liga as DUAS pontas, e guarda o estado num sinal', () => {
    // Ligar só `open` é o defeito clássico: o cartão fecha sozinho no Escape e
    // no ponteiro que sai, e o estado de fora continua dizendo que está aberto.
    const code = hoverCardControlledSource();
    expect(code).toContain(
      '<span ndsHoverCard [open]="isOpen()" (openChange)="isOpen.set($event)">',
    );
    // Expressão de template só enxerga MEMBRO de classe — constante solta no
    // topo do arquivo é invisível ali, e o binding não resolveria.
    expect(code).toContain('readonly isOpen = signal(false);');
    expect(code).toContain("import { signal } from '@angular/core';");
    expect(code).toContain("import { NdsButton } from '@/components/ui/button';");
  });

  it('e os dois comandos têm nomes próprios, não os do gatilho', () => {
    // Dois controles com o mesmo nome acessível são ambíguos em leitor de tela.
    const code = hoverCardControlledSource();
    expect(code).toContain('(click)="isOpen.set(true)"');
    expect(code).toContain('(click)="isOpen.set(false)"');
    expect(code).toContain('Abrir pelo estado externo');
    expect(code).toContain('Fechar pelo estado externo');
  });
});

describe('composições', () => {
  it('a prévia de link tira a inicial decorativa da árvore de acessibilidade', () => {
    const code = hoverCardPreviaDeLinkSource();
    expect(code).toContain(
      '<span class="nds-rounded-sm nds-bg-muted nds-px-1" aria-hidden="true">D</span>',
    );
    expect(code).toContain('design-system.dev/overlays');
  });

  it('a definição usa botão, e NÃO escreve o type que a diretiva já põe', () => {
    const code = hoverCardDefinicaoSource();
    expect(code).toMatch(/<button\n\s+ndsHoverCardTrigger/);
    // `NdsHoverCardTrigger` põe `type="button"` na construção quando o host é
    // `<button>` — a story não o escreve, e o snippet também não. Escrevê-lo
    // ensinaria a duplicar o que o componente já garante.
    expect(code).not.toContain('type="button"');
    // O painel não tem papel, e nome próprio em elemento sem papel é
    // `aria-prohibited-attr` no axe. Quem descreve é o gatilho, por
    // `aria-describedby` — escrito pela diretiva, não pelo snippet.
    expect(code).not.toContain('aria-label');
    expect(code).toContain('WCAG 2.2 nível AA');
  });

  it('na métrica a cor semântica fica no número, e o texto corrido não a recebe', () => {
    const code = hoverCardMetricaSource();
    expect(code).toContain(
      '<span class="nds-text-caption nds-font-medium nds-text-success">1.8s</span>',
    );
    const description = code.slice(code.indexOf('Tempo até o maior elemento'));
    expect(description).not.toContain('nds-text-success');
  });

  it('os quatro lados aparecem juntos, porque a fuga de colisão é o assunto', () => {
    const code = hoverCardLadosSource();
    for (const side of ['top', 'bottom', 'left', 'right']) {
      expect(code).toContain(`<ng-template ndsHoverCardContent side="${side}">`);
    }
    // O respiro que dá ao cartão para onde virar: sem ele os quatro colidem.
    expect(code.match(/nds-p-8/g)).toHaveLength(4);
    expect(code).toContain('<div class="nds-grid nds-max-w-lg" data-cols="2" data-spacing="lg">');
  });

  it('a classe extra vai pelo input do conteúdo, e não substitui a do componente', () => {
    // O painel nasce dentro do portal: não existe elemento em que quem compõe
    // pudesse escrever `class`, e por isso o caminho é `contentClass`.
    const code = hoverCardClassNameExtraSource();
    expect(code).toContain(
      '<ng-template ndsHoverCardContent contentClass="nds-w-md nds-text-center">',
    );
    expect(code).not.toContain('class="nds-w-md');
  });
});
