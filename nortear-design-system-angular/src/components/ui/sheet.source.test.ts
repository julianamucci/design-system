import { describe, expect, it } from 'vitest';
import * as sheetSource from './sheet.source';
import {
  sheetAdvancedFiltersSource,
  sheetBottomPanelSource,
  sheetCloseButtonHiddenSource,
  sheetClosedSource,
  sheetControlledSource,
  sheetLongScrollBodySource,
  sheetOpenSource,
  sheetPlaygroundSource,
  sheetProfileEditSource,
  sheetSecondaryNavigationSource,
  sheetSideBottomSource,
  sheetSideLeftSource,
  sheetSideRightSource,
  sheetSideTopSource,
} from './sheet.source';

/**
 * As props que as stories injetam para trazer o conteúdo trilíngue ao template.
 *
 * Escritas como STRING, e não direto num literal de expressão regular: o portão
 * `identificador_pt_novo` descasca comentário e literal de texto antes de
 * contar, mas não descasca regex — nomes de prop em português dentro de uma
 * barra viram dívida de idioma no relatório, por citar o que a story chama, não
 * por nomear coisa nova.
 */
const STORY_PROPS = [
  'tituloPainel',
  'descricaoPainel',
  'panelBody',
  'rotuloGatilho',
  'rotuloCancelar',
  'rotuloAplicar',
  'rotuloExterno',
  'triggerLabel',
];

/** `{{ prop }}` de qualquer uma delas — o andaime que o snippet não pode publicar. */
const STORY_BINDING = new RegExp(`\\{\\{\\s*(${STORY_PROPS.join('|')})\\s*\\}\\}`);

/**
 * O painel Code imprime o `template` da story literalmente, com os bindings
 * ligados aos args e às props que a story injeta — quem lê copiaria código que
 * só resolve dentro dela. O `transform` devolve o uso real, e é isto que estes
 * casos guardam.
 *
 * A ausência deste arquivo era o `source_sem_teste` do auditor, e a lição que o
 * motiva veio do Tooltip: lá, quando as stories foram alinhadas e os
 * construtores não, o gatilho do Playground passou a renderizar `outline`
 * enquanto o snippet ao lado ensinava `ghost`, e nenhum portão viu. Vue e
 * Svelte, que já tinham este teste para o Sheet, não divergiram.
 */
describe('sheetPlaygroundSource', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const code = sheetPlaygroundSource();
    expect(code).toContain("import { NDS_SHEET } from '@/components/ui/sheet';");
    expect(code).toContain("import { NdsButton } from '@/components/ui/button';");
    expect(code).toContain('<nds-sheet>');
    expect(code).toContain('<ng-template ndsSheetContent>');
    // O que só existe dentro da story: binding para os args, as props de rótulo
    // que trazem o conteúdo trilíngue e o espião de output da `play`.
    expect(code).not.toContain('args.');
    expect(code).not.toContain('[side]="side"');
    expect(code).not.toContain('(openChange)="onOpenChange($event)"');
    expect(code).not.toContain('{{ ' + STORY_PROPS[0] + ' }}');
  });

  it('omite direção, botão do canto, modal e abertura quando são os padrões', () => {
    // Repetir valor padrão no snippet ensina ruído: quem copia passa a declarar
    // o que já vem de graça, e some a informação de que existe um padrão.
    //
    // As asserções olham a TAG inteira, e não a substring `side=`: um
    // `not.toContain('side=')` casaria no `data-side` que o primitivo escreve, e
    // reprovaria por defeito da asserção.
    const code = sheetPlaygroundSource('', {
      args: { side: 'right', showCloseButton: true, modal: true, defaultOpen: false },
    });
    expect(code).toContain('<nds-sheet>');
    expect(code).toContain('<ng-template ndsSheetContent>');
  });

  it('imprime o que difere do padrão, com o valor vindo dos controls', () => {
    const code = sheetPlaygroundSource('', {
      args: { side: 'left', showCloseButton: false, modal: false, defaultOpen: true },
    });
    // A raiz carrega abertura e modalidade; o conteúdo carrega direção e botão
    // do canto. Trocar de lugar é o erro mais fácil de cometer neste componente.
    expect(code).toContain('<nds-sheet [defaultOpen]="true" [modal]="false">');
    expect(code).toContain('<ng-template ndsSheetContent side="left" [showCloseButton]="false">');
  });

  it('o rótulo do gatilho vem do control', () => {
    const code = sheetPlaygroundSource('', { args: { triggerLabel: 'Abrir preferências' } });
    expect(code).toContain(
      '<button ndsSheetTrigger ndsButton variant="outline">Abrir preferências</button>',
    );
    expect(code).not.toContain('>Abrir filtros<');
  });

  it('o painel leva título E descrição — é o par que nomeia o diálogo', () => {
    // Painel modal sem `ndsSheetTitle` é o defeito silencioso deste componente:
    // o leitor de tela anuncia "diálogo" e nada mais.
    const code = sheetPlaygroundSource();
    expect(code).toContain('<h2 ndsSheetTitle>Filtros avançados</h2>');
    expect(code).toContain(
      '<p ndsSheetDescription>Configure os filtros para refinar os resultados.</p>',
    );
  });
});

/**
 * Os quatorze construtores e a story que cada um serve.
 *
 * A lista existe para ser COBRADA: o caso logo abaixo compara com o que o
 * módulo exporta, e um construtor novo que não entre aqui reprova em vez de
 * sair calado da varredura. É a lição do `source-snippets.test.ts` do Vue, onde
 * 28 exports saíram do alcance e a suíte seguiu verde medindo menos.
 *
 * NENHUMA das quatorze stories fica sem construtor próprio. As quatro direções
 * chegaram perto de compartilhar um — o markup é o mesmo, muda `side` e o
 * título —, mas o painel Code é por story: um construtor comum publicaria
 * `side="right"` embaixo do painel que entra pela esquerda.
 */
const CONSTRUCTORS: Array<{
  name: string;
  story: string;
  build: () => string;
  /** Snippet sem gatilho interno: o caso controlado, aberto por um botão de fora. */
  noTrigger?: true;
}> = [
  { name: 'sheetPlaygroundSource', story: 'Playground', build: sheetPlaygroundSource },
  { name: 'sheetSideRightSource', story: 'Variants/Right', build: sheetSideRightSource },
  { name: 'sheetSideLeftSource', story: 'Variants/Left', build: sheetSideLeftSource },
  { name: 'sheetSideTopSource', story: 'Variants/Top', build: sheetSideTopSource },
  { name: 'sheetSideBottomSource', story: 'Variants/Bottom', build: sheetSideBottomSource },
  { name: 'sheetClosedSource', story: 'States/Closed', build: sheetClosedSource },
  { name: 'sheetOpenSource', story: 'States/Open', build: sheetOpenSource },
  {
    name: 'sheetLongScrollBodySource',
    story: 'States/LongScrollBody',
    build: sheetLongScrollBodySource,
  },
  {
    name: 'sheetCloseButtonHiddenSource',
    story: 'States/WithCloseButtonHidden',
    build: sheetCloseButtonHiddenSource,
  },
  {
    name: 'sheetControlledSource',
    story: 'States/Controlled',
    build: sheetControlledSource,
    noTrigger: true,
  },
  {
    name: 'sheetAdvancedFiltersSource',
    story: 'Compositions/AdvancedFilters',
    build: sheetAdvancedFiltersSource,
  },
  {
    name: 'sheetSecondaryNavigationSource',
    story: 'Compositions/SecondaryNavigation',
    build: sheetSecondaryNavigationSource,
  },
  {
    name: 'sheetProfileEditSource',
    story: 'Compositions/ProfileEdit',
    build: sheetProfileEditSource,
  },
  {
    name: 'sheetBottomPanelSource',
    story: 'Compositions/BottomPanel',
    build: sheetBottomPanelSource,
  },
];

describe('cobertura das quatro stories', () => {
  it('todo construtor exportado pelo módulo entra na varredura', () => {
    const exportados = Object.entries(sheetSource)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exportados).toEqual(CONSTRUCTORS.map((c) => c.name).sort());
  });

  for (const { name, story, build, noTrigger } of CONSTRUCTORS) {
    it(`${name} (${story}) publica o componente, não o andaime da story`, () => {
      const code = build();

      // As props que a story injeta para trazer o conteúdo trilíngue. No
      // snippet o texto entra RESOLVIDO — é o que a pessoa escreve.
      expect(code).not.toMatch(STORY_BINDING);
      expect(code).not.toContain('args.');
      // O primitivo escreve os `data-slot` do sheet em runtime, e no Angular o
      // host binding da diretiva apagaria um atributo estático do template:
      // nomear peça por `data-slot` no snippet ensinaria algo que não funciona.
      expect(code).not.toContain('data-slot=');
      // Andaime de captura da story, não do componente.
      expect(code).not.toContain('contain: layout');
      expect(code).not.toContain('min-height');

      // Um painel por snippet, e sempre fechado no fim.
      expect(code.match(/<nds-sheet[ >]/g)).toHaveLength(1);
      expect(code.match(/<\/nds-sheet>/g)).toHaveLength(1);

      // O par que dá nome e descrição acessíveis ao diálogo. Vale para os quatorze:
      // não há painel deste design system sem título.
      expect(code).toMatch(/<h2 ndsSheetTitle>[^<]+<\/h2>/);
      expect(code).toMatch(/<p ndsSheetDescription>[^<]+<\/p>/);

      // `side` mora no conteúdo — a raiz nunca o carrega.
      expect(code).not.toMatch(/<nds-sheet[^>]*\sside=/);

      // O gatilho é um botão do design system com `ndsSheetTrigger`; só o caso
      // controlado abre mão dele, e ali quem abre é um botão de fora.
      if (noTrigger) {
        expect(code).not.toContain('ndsSheetTrigger');
      } else {
        expect(code).toMatch(
          /<button ndsSheetTrigger ndsButton variant="outline">[^<]+<\/button>/,
        );
      }
    });
  }
});

describe('variantes: as quatro direções', () => {
  it('right não escreve a prop — é o padrão, e escrevê-lo apagaria o padrão', () => {
    const code = sheetSideRightSource();
    expect(code).toContain('<ng-template ndsSheetContent>');
    expect(code).not.toContain('side="right"');
    expect(code).toContain('<h2 ndsSheetTitle>Painel direito</h2>');
  });

  it('left, top e bottom escrevem side no CONTEÚDO, com o título do conteúdo compartilhado', () => {
    const left = sheetSideLeftSource();
    expect(left).toContain('<ng-template ndsSheetContent side="left">');
    expect(left).toContain('<h2 ndsSheetTitle>Painel esquerdo</h2>');

    const top = sheetSideTopSource();
    expect(top).toContain('<ng-template ndsSheetContent side="top">');
    expect(top).toContain('<h2 ndsSheetTitle>Painel superior</h2>');

    const bottom = sheetSideBottomSource();
    expect(bottom).toContain('<ng-template ndsSheetContent side="bottom">');
    expect(bottom).toContain('<h2 ndsSheetTitle>Painel inferior</h2>');
  });

  it('as quatro nascem abertas, como as stories ao lado, e nenhuma tem corpo', () => {
    // Sem `[defaultOpen]="true"` quem copiasse veria um painel fechado, sem
    // nada na tela que explicasse a direção — que é o assunto da story. E o
    // painel é cabeçalho e rodapé: inventar um corpo aqui mostraria uma tela
    // que não está ao lado.
    for (const build of [
      sheetSideRightSource,
      sheetSideLeftSource,
      sheetSideTopSource,
      sheetSideBottomSource,
    ]) {
      const code = build();
      expect(code).toContain('<nds-sheet [defaultOpen]="true">');
      expect(code).not.toContain('ndsSheetBody');
      expect(code).toContain('<button ndsSheetClose ndsButton variant="outline">Cancelar</button>');
    }
  });
});

describe('estados', () => {
  it('sheetClosedSource não pede abertura nenhuma — fechado é o que o componente faz sozinho', () => {
    // A ausência é o assunto: o painel sequer chega ao DOM, e o gatilho é a
    // única coisa que existe. Sem decisão a tomar, não há rodapé.
    const code = sheetClosedSource();
    expect(code).toContain('<nds-sheet>');
    expect(code).not.toContain('[defaultOpen]');
    expect(code).not.toContain('[open]');
    expect(code).not.toContain('ndsSheetFooter');
  });

  it('sheetOpenSource abre por defaultOpen, sem estado externo nenhum', () => {
    const code = sheetOpenSource();
    expect(code).toContain('<nds-sheet [defaultOpen]="true">');
    expect(code).not.toContain('[open]');
    expect(code).not.toContain('(openChange)');
    expect(code).toContain('<div ndsSheetFooter>');
  });

  it('sheetLongScrollBodySource põe o conteúdo no ndsSheetBody, e o rodapé FORA dele', () => {
    // É o que mantém as ações no lugar quando o conteúdo cresce: o corpo rola,
    // o rodapé fica. Rodapé dentro do corpo sobe para fora de alcance.
    const code = sheetLongScrollBodySource();
    expect(code).toContain('<div ndsSheetBody class="nds-stack" data-spacing="sm">');
    const bodyBlock = /<div ndsSheetBody[^>]*>([\s\S]*?)\n {8}<\/div>/.exec(code)?.[1];
    expect(bodyBlock).toBeTypeOf('string');
    expect(bodyBlock).not.toContain('ndsSheetFooter');
    expect(code).toContain('<div ndsSheetFooter>');
  });

  it('sheetLongScrollBodySource declara o laço como MEMBRO da classe do exemplo', () => {
    // Expressão de template do Angular só enxerga membro de classe: uma
    // constante solta no topo do arquivo é invisível ali, e quem copiasse
    // receberia um `@for` que não resolve.
    const code = sheetLongScrollBodySource();
    expect(code).toContain('@for (p of paragrafos; track p.id) {');
    expect(code).toContain('  readonly paragrafos = Array.from({ length: 24 }, (_, i) => ({');
  });

  it('sheetLongScrollBodySource ensina panelClass, e não uma utilitária de largura', () => {
    // `panelClass` é a escotilha de classe do painel. O que ela NÃO faz é
    // ajustar largura: as regras de lado são (0,2,0) e qualquer utilitária de
    // largura é (0,1,0) — `nds-max-w-lg` no painel CHEGA e não pinta nada. A
    // largura sai de `--sheet-width` / `--sheet-max-width`.
    const code = sheetLongScrollBodySource();
    expect(code).toContain('<ng-template ndsSheetContent panelClass="nds-rounded-xl">');
    expect(code).not.toContain('nds-max-w-lg');
  });

  it('sheetCloseButtonHiddenSource dispensa o X e deixa a saída no rodapé', () => {
    // A lição é o PAR, não a prop sozinha: sem o X, sobraria o Escape — que
    // quem usa mouse não descobre.
    const code = sheetCloseButtonHiddenSource();
    expect(code).toContain('<ng-template ndsSheetContent [showCloseButton]="false">');
    expect(code).toContain('<button ndsSheetClose ndsButton variant="outline">Cancelar</button>');
    // Só a saída no rodapé, como a story renderiza — sem ação primária.
    expect(code).not.toContain('<button ndsButton>Aplicar filtros</button>');
  });

  it('sheetControlledSource liga as DUAS pontas do estado, e guarda o valor num sinal', () => {
    // Ligar só `open` é o defeito clássico: o painel fecha na tela pelo Escape
    // ou pelo rodapé, o valor de fora continua `true`, e ele reabre no ciclo
    // seguinte de detecção. O sinal é o que agenda o redesenho — a story
    // renderiza um campo comum porque o renderer do Storybook monta um objeto
    // de props, e ali o snippet está certo e a story não é componente.
    const code = sheetControlledSource();
    expect(code).toContain('<nds-sheet [open]="isOpen()" (openChange)="isOpen.set($event)">');
    expect(code).toContain('  readonly isOpen = signal(false);');
    expect(code).toContain(
      '<button ndsButton variant="outline" (click)="isOpen.set(true)">Abrir pelo estado externo</button>',
    );
    // Estado externo e `defaultOpen` no mesmo painel se contradizem.
    expect(code).not.toContain('[defaultOpen]');
  });
});

describe('composições', () => {
  it('sheetAdvancedFiltersSource nomeia cada campo pelo rótulo, com for e id casados', () => {
    // É o `for`/`id` que nomeia o campo. Placeholder no lugar do rótulo some no
    // instante em que a pessoa digita.
    const code = sheetAdvancedFiltersSource();
    expect(code).toContain('<label ndsLabel for="filtro-categoria">Categoria</label>');
    expect(code).toContain('<input ndsInput id="filtro-categoria" value="Eletrônicos" />');
    expect(code).toContain('<label ndsLabel for="filtro-minimo">Preço mínimo</label>');
    expect(code).toContain('<input ndsInput id="filtro-minimo" type="number" value="100" />');
    expect(code).toContain("import { NdsInput } from '@/components/ui/input';");
    expect(code).toContain("import { NdsLabel } from '@/components/ui/label';");
    expect(code).toContain('imports: [...NDS_SHEET, NdsButton, NdsInput, NdsLabel],');
  });

  it('sheetAdvancedFiltersSource mantém o formulário no corpo e as ações fora dele', () => {
    const code = sheetAdvancedFiltersSource();
    const bodyBlock = /<div ndsSheetBody>([\s\S]*?)\n {8}<\/div>/.exec(code)?.[1];
    expect(bodyBlock).toBeTypeOf('string');
    expect(bodyBlock).toContain(
      '<form id="filtros-form" class="nds-grid" data-spacing="md" (submit)="$event.preventDefault()">',
    );
    expect(bodyBlock).not.toContain('ndsSheetFooter');
    // E é justamente por o rodapé ficar fora do `<form>` que a primária precisa
    // do religamento pelo id: solta, ela é botão comum, e com dois campos o
    // navegador não faz o envio implícito — o Enter não dispara nada (PRD D10).
    expect(code).toContain(
      '<button ndsButton type="submit" form="filtros-form">Aplicar filtros</button>',
    );
    expect(code).not.toContain('<button ndsButton>Aplicar filtros</button>');
  });

  it('sheetSecondaryNavigationSource abre à esquerda, com o marco de navegação nomeado', () => {
    // A página já tem um `<nav>`: dois marcos sem nome distinto ficam
    // indistinguíveis para quem navega por marcos.
    const code = sheetSecondaryNavigationSource();
    expect(code).toContain('<ng-template ndsSheetContent side="left">');
    expect(code).toContain(
      '<nav aria-label="Navegação secundária" class="nds-stack" data-spacing="xs">',
    );
    // CINCO seções: é a lista que `variants.compositions.secondaryNavigation`
    // descreve. Esta asserção já afirmou quatro, guardando verde um snippet que
    // documentava uma composição que não existe.
    expect(code.match(/<a href="#/g)).toHaveLength(5);
    for (const secao of ['Dashboard', 'Projetos', 'Equipe', 'Configurações', 'Faturas']) {
      expect(code).toContain(`>${secao}</a>`);
    }
  });

  it('sheetProfileEditSource liga a confirmação ao form pelo id, e traz os três campos', () => {
    // O rodapé mora FORA do corpo rolável: o botão não está dentro do `form`, e
    // só o atributo `form` os liga. Sem ele, o Enter num campo — como a maioria
    // envia formulário curto — não chega a lugar nenhum.
    const code = sheetProfileEditSource();
    expect(code).toContain(
      '<form id="perfil-form" class="nds-grid" data-spacing="md" (submit)="$event.preventDefault()">',
    );
    expect(code).toContain(
      '<button ndsButton type="submit" form="perfil-form">Salvar alterações</button>',
    );
    // Por ÍNDICE: a ordem é a do conteúdo compartilhado, e o campo do meio já
    // saiu de um snippet sem que nada reprovasse.
    const rotulos = [...code.matchAll(/<label ndsLabel for="[^"]*">([^<]*)<\/label>/g)].map(
      (m) => m[1],
    );
    expect(rotulos).toEqual(['Nome', 'Nome de usuário', 'Bio']);
  });

  it('sheetBottomPanelSource abre embaixo, com três ações e um rodapé só de saída', () => {
    const code = sheetBottomPanelSource();
    expect(code).toContain('<ng-template ndsSheetContent side="bottom">');
    expect(code).toContain('<div class="nds-cluster" data-spacing="md">');
    // As TRÊS ações do conteúdo compartilhado, com a destrutiva por último e
    // sozinha na variante que a anuncia.
    expect(code).toContain('<button ndsButton variant="outline">Compartilhar</button>');
    expect(code).toContain('<button ndsButton variant="outline">Duplicar</button>');
    expect(code).toContain('<button ndsButton variant="destructive">Excluir</button>');
    // A decisão é a ação clicada: não há confirmação a repetir no rodapé.
    expect(code).toContain('<button ndsSheetClose ndsButton variant="outline">Fechar</button>');
    expect(code).not.toContain('Aplicar filtros');
  });

  it('sheetSecondaryNavigationSource não tem rodapé — a lista de links É a ação', () => {
    // Um menu não confirma nada, e a saída dele é o X do canto: por isso o
    // botão do canto continua ligado neste snippet.
    const code = sheetSecondaryNavigationSource();
    expect(code).not.toContain('ndsSheetFooter');
    expect(code).not.toContain('ndsSheetClose');
    expect(code).not.toContain('[showCloseButton]="false"');
  });
});
