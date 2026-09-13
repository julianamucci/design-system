import { describe, expect, it } from 'vitest';
import * as popoverSource from './popover.source';
import {
  popoverBasicSource,
  popoverControlledSource,
  popoverFormSource,
  popoverModalSource,
  popoverOpenSource,
  popoverPlaygroundSource,
} from './popover.source';

/**
 * O painel Code imprime o `template` da story literalmente, com os bindings
 * ligados aos args e o `(openChange)` do espião — quem lê copiaria código que só
 * compila dentro da story. O `transform` devolve o uso real, e é isto que estes
 * casos guardam.
 *
 * A varredura genérica do `source-snippets.test.ts` já prova coerência de
 * import; o que ela NÃO alcança é se o snippet ensina o certo. Nesta campanha a
 * distância apareceu aqui mesmo: o snippet do angular prometia `Limpar` /
 * `Aplicar` no rodapé enquanto o preview ao lado mostrava `Cancelar` / `Salvar`.
 * Nenhum portão viu, e quem lê copia o snippet, não o preview.
 */

// ─── O TEXTO das stories ─────────────────────────────────────────────────────
//
// Lido, e não importado: importar um arquivo de story fora do compilador Angular
// quebra, e a pergunta aqui não precisa de execução — é sobre o que o arquivo
// ESCREVE. É a mesma leitura por `?raw` que o `source-snippets.test.ts` já faz
// nos módulos de componente, e a mesma que o `hover-card.source.test.ts` fez
// quando fechou esta forma em 2026-09-09.

const storySources = import.meta.glob<string>('./popover*.stories.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const STORY_START = /^export const (\w+): Story = \{/gm;

/** Story que ainda publica o template cru — dívida declarada, não silêncio. */
const SEM_TRANSFORM = '(nenhum)';

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

/** As `props` com que a story rende o template — onde mora o estado inicial. */
function storyProps(file: string, name: string): string {
  const block = storyBlock(storySources[file] ?? '', name);
  return /props:\s*\{([^}]*)\}/.exec(block)?.[1]?.trim() ?? '';
}

/**
 * A transform que cada story publica no painel — a dela, ou a que o `meta`
 * declarou para o arquivo inteiro.
 */
function transformsByStory(source: string): Map<string, string> {
  const marks = [...source.matchAll(STORY_START)];
  const header = marks.length ? source.slice(0, marks[0]!.index) : source;
  const fromMeta = /transform:\s*(\w+)/.exec(header)?.[1] ?? SEM_TRANSFORM;

  const out = new Map<string, string>();
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1]!.index! : source.length;
    const block = source.slice(m.index!, end);
    out.set(m[1]!, /transform:\s*(\w+)/.exec(block)?.[1] ?? fromMeta);
  });
  return out;
}

// ─── Os seis construtores, e a story que cada um serve ───────────────────────
//
// A tabela existe para ser COBRADA: um caso a compara com o que o módulo
// exporta e outro com o que os quatro arquivos de story publicam. Construtor
// novo que não entre aqui reprova, e story nova sem transform também — em vez
// de saírem calados da varredura, que é como o `source-snippets.test.ts` do Vue
// perdeu 28 exports e seguiu verde medindo menos.

const CONSTRUCTORS: Array<{
  name: string;
  stories: Array<{ file: string; story: string }>;
  build: () => string;
  /** Construtor cujo ASSUNTO é o par por extenso, e que por isso o escreve. */
  openChangeIsTheSubject?: true;
}> = [
  {
    name: 'popoverPlaygroundSource',
    stories: [{ file: './popover.stories.ts', story: 'Playground' }],
    build: popoverPlaygroundSource,
  },
  {
    // Reaproveitamento herdado da rodada que fechou os outros dois arquivos: as
    // duas stories renderizam o mesmo painel com formulário, e o que as separa
    // é o PREFIXO dos ids, que existe para dois exemplos não colidirem no mesmo
    // documento. A premissa é cobrada lá embaixo.
    name: 'popoverFormSource',
    stories: [
      { file: './popover-variants.stories.ts', story: 'Form' },
      { file: './popover-compositions.stories.ts', story: 'EditProfile' },
    ],
    build: popoverFormSource,
  },
  {
    // A EXCEÇÃO DECLARADA desta rodada: duas stories, um construtor.
    //
    // States/Closed e States/Focus renderizam o MESMO template e semeiam o
    // MESMO estado inicial. O que as separa é interação — uma nem abre o
    // painel, a outra abre e caminha com Tab entre os controles —, e interação
    // não aparece em snippet. Dois construtores idênticos seriam uma cópia
    // esperando para envelhecer sozinha.
    //
    // A premissa é verificada logo abaixo, em "premissa das exceções": um caso
    // compara os dois templates e outro compara as duas `props`.
    name: 'popoverBasicSource',
    stories: [
      { file: './popover-states.stories.ts', story: 'Closed' },
      { file: './popover-states.stories.ts', story: 'Focus' },
    ],
    build: popoverBasicSource,
  },
  {
    name: 'popoverOpenSource',
    stories: [{ file: './popover-states.stories.ts', story: 'Open' }],
    build: popoverOpenSource,
  },
  {
    name: 'popoverControlledSource',
    stories: [{ file: './popover-states.stories.ts', story: 'Controlled' }],
    build: popoverControlledSource,
    openChangeIsTheSubject: true,
  },
  {
    name: 'popoverModalSource',
    stories: [{ file: './popover-states.stories.ts', story: 'Modal' }],
    build: popoverModalSource,
  },
];

/**
 * As stories que AINDA publicam o template cru.
 *
 * Dívida medida, e não exclusão em silêncio: enquanto elas estiverem aqui o
 * caso de cobertura passa, e no dia em que uma ganhar `transform` ele reprova
 * pedindo que ela saia desta lista e entre na tabela acima. Foi assim que a
 * lista de exclusão do `source-snippets.test.ts` apodreceu sem ninguém ver.
 */
const SEM_CONSTRUTOR = [
  { file: './popover-variants.stories.ts', story: 'Default' },
  { file: './popover-variants.stories.ts', story: 'WithTitle' },
  { file: './popover-compositions.stories.ts', story: 'TableFilter' },
  { file: './popover-compositions.stories.ts', story: 'ColorPicker' },
  { file: './popover-compositions.stories.ts', story: 'QuickSettings' },
  { file: './popover-compositions.stories.ts', story: 'SideTop' },
];

describe('cobertura das quatro stories', () => {
  it('todo construtor exportado pelo módulo entra na varredura', () => {
    const exported = Object.entries(popoverSource)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exported).toEqual(CONSTRUCTORS.map((c) => c.name).sort());
  });

  it('os quatro arquivos de story chegaram à varredura', () => {
    // Sem esta linha, um glob que deixasse de casar apagaria o caso abaixo em
    // silêncio — e uma suíte verde medindo zero é pior que vermelha.
    expect(Object.keys(storySources).sort()).toEqual([
      './popover-compositions.stories.ts',
      './popover-states.stories.ts',
      './popover-variants.stories.ts',
      './popover.stories.ts',
    ]);
  });

  it('toda story publica o construtor que esta tabela declara', () => {
    // Cobre os dois sentidos: story sem transform (que publicaria o template
    // cru, que é a regra `story_file_sem_transform` do audit) e story que
    // herdou o transform do `meta` sem ninguém decidir isso.
    const declared = new Map<string, string>();
    for (const { name, stories } of CONSTRUCTORS) {
      for (const { file, story } of stories) declared.set(`${file}#${story}`, name);
    }
    for (const { file, story } of SEM_CONSTRUTOR) {
      declared.set(`${file}#${story}`, SEM_TRANSFORM);
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

// ─── Premissa das exceções ───────────────────────────────────────────────────
//
// Exceção que não se verifica apodrece. Estes casos são o que impede as duas
// declarações acima de virarem comentários que já não descrevem nada.

/** O andaime de play das stories de estado — e SÓ ele. */
const SCAFFOLD_OF_THE_STATES = [
  {
    name: 'data-testid="area-externa"',
    pattern: /data-testid="area-externa"/g,
    why:
      'States/Controlled precisa de um alvo inerte fora do gatilho e fora do ' +
      'painel para provar que clicar fora fecha. Não faz parte do que o modo ' +
      'controlado ensina.',
  },
  {
    name: '[defaultOpen]="true"',
    pattern: /\[defaultOpen\]="true"/g,
    why:
      'States/Modal abre o painel para o axe varrer e o Chromatic fotografar. ' +
      'Um popover modal que nasce aberto prende o foco de quem acabou de chegar.',
  },
];

describe('premissa das exceções', () => {
  const CLOSED = { file: './popover-states.stories.ts', story: 'Closed' };
  const FOCUS = { file: './popover-states.stories.ts', story: 'Focus' };
  const OPEN = { file: './popover-states.stories.ts', story: 'Open' };

  it('os templates de estado existem e não voltaram vazios da leitura', () => {
    for (const { file, story } of [CLOSED, FOCUS, OPEN]) {
      expect(storyTemplate(file, story), `${file}#${story}`).toContain('ndsPopover');
    }
  });

  it('Closed e Focus renderizam o MESMO markup e semeiam o MESMO estado', () => {
    // Este é o caso que dá dentes à exceção. No dia em que uma das duas ganhar
    // um elemento, trocar o gatilho ou nascer aberta, elas param de poder
    // compartilhar um construtor — e é aqui que isso aparece, em vez de num
    // snippet que passou a ensinar a outra story.
    expect(
      storyTemplate(FOCUS.file, FOCUS.story),
      'States/Focus divergiu de States/Closed: as duas deixaram de renderizar o ' +
        'mesmo markup, então popoverBasicSource não pode mais servir às duas — dê a ' +
        'esta um construtor próprio',
    ).toBe(storyTemplate(CLOSED.file, CLOSED.story));
    expect(storyProps(FOCUS.file, FOCUS.story)).toBe(storyProps(CLOSED.file, CLOSED.story));
    expect(storyProps(CLOSED.file, CLOSED.story)).toBe('aberto: false');
  });

  it('e Open só se separa das duas pelo ESTADO INICIAL, que é a razão de ter construtor próprio', () => {
    // A outra metade: se `Open` deixasse de nascer aberta, `popoverOpenSource`
    // perderia a premissa e viraria uma cópia de `popoverBasicSource`.
    expect(storyTemplate(OPEN.file, OPEN.story)).toBe(storyTemplate(CLOSED.file, CLOSED.story));
    expect(
      storyProps(OPEN.file, OPEN.story),
      'States/Open deixou de nascer aberta — popoverOpenSource perdeu o que o ' +
        'separava de popoverBasicSource',
    ).toBe('aberto: true');
  });

  it('Form e EditProfile renderizam o mesmo painel, tirados os prefixos de id', () => {
    // A premissa do reaproveitamento herdado. Os ids diferem de propósito —
    // dois exemplos do mesmo formulário na mesma docs page colidiriam.
    const normalize = (t: string) =>
      t
        .replace(/(pv-form|pc-perfil)-/g, 'ID-')
        // Comentário de template explica a story, não o markup que ela renderiza.
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    expect(
      normalize(storyTemplate('./popover-compositions.stories.ts', 'EditProfile')),
      'Compositions/EditProfile divergiu de Variants/Form: as duas não podem mais ' +
        'compartilhar popoverFormSource',
    ).toBe(normalize(storyTemplate('./popover-variants.stories.ts', 'Form')));
  });

  it('cada pedaço declarado como andaime ainda EXISTE nas stories de estado', () => {
    // Uma exceção cuja premissa sumiu é uma exceção que ninguém releu: se a
    // story deixou de abrir por `defaultOpen`, ou se o alvo externo mudou de
    // gancho, a decisão precisa ser tomada de novo — e não continuar valendo
    // por inércia.
    const source = storySources['./popover-states.stories.ts'] ?? '';
    for (const { name, pattern, why } of SCAFFOLD_OF_THE_STATES) {
      expect(
        new RegExp(pattern.source).test(source),
        `${name} não aparece mais em popover-states.stories.ts — a exceção declarada ` +
          `("${why}") perdeu a premissa e precisa ser reexaminada`,
      ).toBe(true);
    }
  });
});

describe('nenhum snippet publica o andaime da story', () => {
  for (const { name, build, openChangeIsTheSubject } of CONSTRUCTORS) {
    it(`${name} publica o componente, e não o template da story`, () => {
      const code = build();

      // O que só existe dentro da story: interpolação de args, binding para os
      // controls e o espião de output.
      expect(code).not.toContain('args.');
      expect(code).not.toContain('{{');
      expect(code).not.toContain('[side]');
      expect(code).not.toContain('[align]');
      if (!openChangeIsTheSubject) expect(code).not.toContain('(openChange)');

      // Atributos que as diretivas escrevem em runtime — e que no Angular são
      // disputados pelo host binding, então o snippet não pode ensiná-los.
      expect(code).not.toContain('data-slot=');
      expect(code).not.toContain('[attr.');

      // Os ganchos da play e a abertura de conveniência da captura.
      expect(code).not.toContain('data-testid=');
      expect(code).not.toContain('[defaultOpen]');

      // Valor de design em style inline não entra em snippet: inline vence a
      // folha, e a declaração deixa o tema e a densidade para trás.
      expect(code).not.toContain('style=');

      // E o exemplo é um componente que compila na mão de quem copia.
      expect(code).toContain("import { NDS_POPOVER } from '@/components/ui/popover';");
      expect(code).toContain('export class Exemplo');
    });
  }
});

/** A abertura da tag do painel — do `<ng-template` até o `>` que a fecha. */
function panelTag(output: string): string {
  const start = output.indexOf('<ng-template ndsPopoverContent');
  expect(start).toBeGreaterThan(-1);
  return output.slice(start, output.indexOf('>', start) + 1);
}

/** O bloco de ações do rodapé, do cluster encostado à direita até fechá-lo. */
function footer(output: string): string {
  const start = output.indexOf('data-justify="end"');
  expect(start).toBeGreaterThan(-1);
  return output.slice(start, output.indexOf('</div>', start));
}

describe('popoverPlaygroundSource', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const code = popoverPlaygroundSource();
    expect(code).toContain("import { NDS_POPOVER } from '@/components/ui/popover';");
    expect(code).toContain("import { NdsButton } from '@/components/ui/button';");
    expect(code).toContain('imports: [...NDS_POPOVER, NdsButton]');
    expect(code).toContain('<div ndsPopover');
    expect(code).toContain('<button ndsPopoverTrigger ndsButton variant="outline">');
    expect(code).toContain('<ng-template ndsPopoverContent');

    // O que o renderer imprimiria sozinho: interpolação de args, os bindings
    // que a story usa para ligar os controls e o espião de action.
    expect(code).not.toContain('args.');
    expect(code).not.toContain('{{');
    expect(code).not.toContain('(openChange)');
    expect(code).not.toContain('[side]');
    expect(code).not.toContain('[align]');
    // Atributos que as diretivas escrevem em runtime — e que no Angular são
    // disputados pelo host binding, então o snippet não pode ensiná-los.
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('[attr.');
  });

  it('omite side, align e sideOffset quando são o padrão do componente', () => {
    const code = popoverPlaygroundSource('', {
      args: { side: 'bottom', align: 'center', sideOffset: 4 },
    });
    // Repetir valor padrão ensina ruído: quem copia passa a declarar o que já
    // vem de graça, e some a informação de que existe um padrão.
    //
    // A asserção é sobre a TAG inteira, não sobre a substring: `data-justify`,
    // `data-spacing` e o `variant` dos botões vivem no mesmo texto, e um
    // `not.toContain('align=')` solto casaria fora do painel — foi assim que a
    // primeira versão do teste do hover-card reprovou por defeito da asserção.
    expect(panelTag(code)).toBe('<ng-template ndsPopoverContent>');
  });

  it('imprime side, align e sideOffset quando diferem do padrão', () => {
    const code = popoverPlaygroundSource('', {
      args: { side: 'right', align: 'start', sideOffset: 12 },
    });
    expect(panelTag(code)).toBe(
      '<ng-template ndsPopoverContent side="right" align="start" [sideOffset]="12">',
    );
  });

  it('a distância é binding e a posição é atributo — cada uma na sua forma', () => {
    // `sideOffset` é número: escrito como `sideOffset="12"` chegaria à diretiva
    // como a STRING "12". A posição é união de strings e não precisa de colchete.
    const code = popoverPlaygroundSource('', { args: { sideOffset: 16, side: 'top' } });
    expect(code).toContain('[sideOffset]="16"');
    expect(code).toContain('side="top"');
    expect(code).not.toContain('sideOffset="16"');
  });

  it('a raiz é controlada, e o control semeia o sinal', () => {
    // O painel do snippet é controlado por `[(open)]` — é o que dá ao "Salvar"
    // como fechar por código. Num painel controlado o estado inicial mora no
    // SINAL, não em `defaultOpen`: os dois juntos seriam duas fontes para a
    // mesma pergunta, e o control do Playground responde por uma só.
    const closed = popoverPlaygroundSource('', { args: { defaultOpen: false } });
    expect(closed).toContain('<div ndsPopover [(open)]="aberto">');
    expect(closed).toContain('readonly aberto = signal(false);');

    const opened = popoverPlaygroundSource('', { args: { defaultOpen: true } });
    expect(opened).toContain('<div ndsPopover [(open)]="aberto">');
    expect(opened).toContain('readonly aberto = signal(true);');
    expect(opened).not.toContain('[defaultOpen]');
  });

  it('leva o rótulo do gatilho que veio dos controls', () => {
    const code = popoverPlaygroundSource('', { args: { triggerLabel: 'Preferências' } });
    expect(code).toContain('>Preferências</button>');
    expect(code).not.toContain('>Abrir popover</button>');
  });
});

describe('as lições do componente', () => {
  it('o painel COM título se nomeia pelo título, e não carrega aria-label junto', () => {
    // O nome acessível sai do `ndsPopoverTitle`, que a diretiva liga por
    // `aria-labelledby`. Com título não existe `aria-label`: seriam dois
    // contratos de nome no mesmo painel, e a story ao lado reprova nisso.
    //
    // A contrapartida é o painel SEM título visível, que aí sim se nomeia por
    // `aria-label` — é o motivo de a variante `default` existir, para o conteúdo
    // livre. Este construtor é o do Playground, e o Playground tem cabeçalho.
    const code = popoverPlaygroundSource();
    expect(code).toContain('<h2 ndsPopoverTitle>Configurações de exibição</h2>');
    expect(code).toContain('<p ndsPopoverDescription>');
    expect(code).not.toContain('aria-label');
  });

  it('o rodapé é Cancelar ghost + ação primária, nessa ordem', () => {
    // Esta é a asserção que a campanha pagou: o snippet prometia `Limpar` /
    // `Aplicar` enquanto o preview mostrava `Salvar`.
    //
    // A ação de descarte é a discreta e vem primeiro; a que confirma é a única
    // com peso visual, e o peso vem da AUSÊNCIA de `variant` — a primária é o
    // padrão do NdsButton. Escrever `variant="default"` ali ensinaria ruído.
    const actions = footer(popoverPlaygroundSource());
    expect(actions).toContain('ndsButton variant="ghost" size="sm">Cancelar<');
    expect(actions).toContain('ndsButton size="sm" (click)="salvar()">Salvar<');
    expect(actions.match(/variant=/g)).toHaveLength(1);
    expect(actions).not.toContain('Limpar');
    expect(actions).not.toContain('Aplicar');
  });

  it('as duas ações fecham, mas por caminhos DIFERENTES', () => {
    // A diferença é a que o relatório precisa: a peça de fechar publica
    // `close-press`, que o design system lê como `close-button` — o motivo de
    // quem DESISTIU —, e o fechamento por código cai em `api`, que é onde mora
    // "salvou e fechou". Com `ndsPopoverClose` nos dois, "concluiu" chegaria ao
    // GA4 como "apertou o botão de fechar", e quem copia o snippet levaria essa
    // forma para o produto dele.
    const code = popoverPlaygroundSource();
    const actions = footer(code);

    // Só o Cancelar é a peça de fechar.
    expect(actions.match(/ndsPopoverClose/g)).toHaveLength(1);
    expect(actions).toContain('<button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar<');
    expect(actions).not.toMatch(/ndsPopoverClose[^>]*>\s*Salvar/);

    // E o Salvar fecha por código — o método existe na classe do exemplo, senão
    // o binding não resolveria na mão de quem copia.
    expect(actions).toContain('(click)="salvar()"');
    expect(code).toContain('salvar(): void {');
    expect(code).toContain('this.aberto.set(false);');
  });
});

describe('popoverFormSource', () => {
  it('devolve o componente do painel com formulário, e não o template da story', () => {
    const code = popoverFormSource();
    expect(code).toContain("import { NDS_POPOVER } from '@/components/ui/popover';");
    expect(code).toContain("import { NdsInput } from '@/components/ui/input';");
    expect(code).toContain("import { NdsLabel } from '@/components/ui/label';");
    expect(code).toContain('imports: [...NDS_POPOVER, NdsButton, NdsInput, NdsLabel]');
    expect(code).toContain('<form class="nds-stack" data-spacing="md"');
    // Rótulo e campo amarrados: campo sem `for`/`id` chega ao leitor de tela
    // sem nome nenhum, e o painel com formulário é onde isso mais custa.
    expect(code).toContain('<label ndsLabel for="perfil-nome">Nome</label>');
    expect(code).toContain('<input ndsInput id="perfil-nome"');

    // O que o renderer imprimiria sozinho, e o que as diretivas escrevem em
    // runtime — a mesma régua do construtor do Playground, sem afrouxar.
    expect(code).not.toContain('args.');
    expect(code).not.toContain('{{');
    expect(code).not.toContain('(openChange)');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('[attr.');
  });

  it('leva o rótulo do gatilho que veio dos controls', () => {
    const code = popoverFormSource('', { args: { triggerLabel: 'Editar conta' } });
    expect(code).toContain('>Editar conta</button>');
    expect(code).not.toContain('>Editar perfil</button>');
  });

  it('a raiz é controlada — é o que dá ao submit como fechar por código', () => {
    const code = popoverFormSource();
    expect(code).toContain('<div ndsPopover [(open)]="aberto">');
    expect(code).toContain('readonly aberto = signal(false);');
    expect(code).not.toContain('[defaultOpen]');
  });

  it('as duas ações fecham, mas por caminhos DIFERENTES — e aqui um deles é o submit', () => {
    // Mesma diferença do rodapé sem formulário (`close-button` × `api`), com
    // uma mudança de LUGAR que é o que este caso guarda: quando a ação que
    // conclui é `type="submit"`, o fechamento por código não pode morar no
    // clique dela. Fechar no clique desmontaria o formulário antes do envio, e
    // deixaria de fora o Enter num campo — que é como metade das pessoas envia
    // formulário, e nunca passa pelo clique.
    const code = popoverFormSource();
    const actions = footer(code);

    // Só o Cancelar é a peça de fechar.
    expect(actions.match(/ndsPopoverClose/g)).toHaveLength(1);
    expect(actions).toContain(
      '<button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar<',
    );
    expect(actions).not.toMatch(/ndsPopoverClose[^>]*>\s*Atualizar/);

    // E o Atualizar conclui pelo formulário: `type="submit"`, sem `(click)`
    // nenhum no rodapé.
    expect(actions).toContain('<button ndsButton type="submit" size="sm">Atualizar<');
    expect(actions).not.toContain('(click)=');

    // O fechamento mora no `(submit)` do form, e o handler existe na classe do
    // exemplo — senão o binding não resolveria na mão de quem copia.
    expect(code).toMatch(/<form[^>]*\(submit\)="atualizar\(\$event\)"/);
    expect(code).toContain('atualizar(evento: Event): void {');
    expect(code).toContain('evento.preventDefault();');
    expect(code).toContain('this.aberto.set(false);');

    // E nessa ORDEM: fechar antes do `preventDefault()` deixaria o navegador
    // navegar a página no envio.
    expect(code.indexOf('evento.preventDefault();')).toBeLessThan(
      code.indexOf('this.aberto.set(false);'),
    );
  });
});

describe('os estados', () => {
  it('o popover padrão nasce FECHADO, e o sinal é onde o estado mora', () => {
    const code = popoverBasicSource();
    expect(code).toContain('<div ndsPopover [(open)]="aberto">');
    expect(code).toContain('readonly aberto = signal(false);');
    // Expressão de template só enxerga MEMBRO de classe — e o `[(open)]` da
    // story aponta para uma propriedade solta de `props`, que não existe fora
    // do renderer do Storybook.
    expect(code).toContain("import { signal } from '@angular/core';");
  });

  it('e não declara modal — a ausência é o que separa Focus de Modal', () => {
    // O foco ENTRA no painel ao abrir (é o que separa o popover do tooltip) e
    // NÃO fica preso. Quem quiser a prisão escreve `[modal]="true"`, e aí é a
    // outra story. Um snippet com `[modal]` aqui ensinaria o oposto.
    const code = popoverBasicSource();
    expect(code).not.toContain('modal');
    expect(code).not.toContain('aria-modal');
  });

  it('a story que nasce ABERTA semeia o sinal com true, e só isso a distingue', () => {
    const bornOpen = popoverOpenSource();
    expect(bornOpen).toContain('readonly aberto = signal(true);');
    // Num painel controlado o `defaultOpen` ao lado do `[(open)]` seriam duas
    // fontes para a mesma pergunta.
    expect(bornOpen).not.toContain('[defaultOpen]');
    // E a diferença para o construtor irmão é ESSA LINHA, e nenhuma outra: se
    // um dos dois ganhar markup próprio, este caso reprova e a dupla precisa ser
    // reexaminada — ou vira um construtor só, ou a diferença se declara.
    expect(bornOpen.replace('signal(true)', 'signal(false)')).toBe(popoverBasicSource());
  });

  it('o modo controlado liga as DUAS pontas, e guarda o estado num sinal', () => {
    // Ligar só `open` é o defeito clássico: o painel fecha sozinho no Escape e
    // no clique fora, e o estado de fora continua dizendo que está aberto.
    const code = popoverControlledSource();
    expect(code).toContain('<div ndsPopover [open]="aberto()" (openChange)="aberto.set($event)">');
    expect(code).toContain('readonly aberto = signal(false);');
    // O par por extenso é o assunto — o açúcar apagaria justamente o que a
    // story mostra.
    expect(code).not.toContain('[(open)]');
  });

  it('e o comando de fora tem nome próprio, sem o alvo inerte da play', () => {
    const code = popoverControlledSource();
    expect(code).toContain('(click)="aberto.set(!aberto())"');
    expect(code).toContain('Alternar por fora');
    // O parágrafo existe para a play ter onde clicar fora do painel.
    expect(code).not.toContain('Área externa');
  });

  it('o modal declara o input, e o painel NÃO traz peça de fechar', () => {
    // A ausência é o assunto: com um `ndsPopoverClose` registrado quem prende o
    // foco passa a ser a lib (`hasPopupClose()`), e o laço de tabulação que
    // esta stack escreve — que é o que ela de fato entrega — deixaria de ser
    // exercido. Um snippet com botão de fechar ensinaria a versão que mede a lib.
    const code = popoverModalSource();
    expect(code).toContain('<div ndsPopover [modal]="true">');
    expect(code).not.toContain('ndsPopoverClose');
  });

  it('e leva DOIS controles que se bastam, cada um com rótulo amarrado', () => {
    // Dois, porque com um só "o Tab do último volta ao primeiro" seria verdade
    // sem laço nenhum. Checkbox, porque sem peça de fechar um "Cancelar" não
    // cancelaria nada — marcar já é o efeito.
    const code = popoverModalSource();
    expect(code.match(/<button ndsCheckbox/g)).toHaveLength(2);
    expect(code).toContain('<button ndsCheckbox id="popover-modal-remember"></button>');
    expect(code).toContain('<label ndsLabel for="popover-modal-remember">Lembrar minha escolha</label>');
    expect(code).toContain('<button ndsCheckbox id="popover-modal-email"></button>');
    expect(code).toContain('<label ndsLabel for="popover-modal-email">Receber aviso por e-mail</label>');
    // Campo sem rótulo amarrado chega ao leitor de tela sem nome nenhum, e num
    // painel que prende o foco isso é o pior lugar possível.
    expect(code).not.toContain('Cancelar');
    expect(code).not.toContain('Confirmar');
    // O painel com título se nomeia pelo título — `aria-label` junto seriam dois
    // contratos de nome no mesmo painel.
    expect(code).toContain('<h2 ndsPopoverTitle>Popover modal</h2>');
    expect(code).not.toContain('aria-label');
    // E os imports que os dois controles exigem, senão o exemplo não compila.
    expect(code).toContain("import { NdsCheckbox } from '@/components/ui/checkbox';");
    expect(code).toContain("import { NdsLabel } from '@/components/ui/label';");
    expect(code).toContain('imports: [...NDS_POPOVER, NdsButton, NdsCheckbox, NdsLabel]');
  });
});
