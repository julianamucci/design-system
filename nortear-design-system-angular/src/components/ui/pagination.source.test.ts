import { describe, expect, it } from 'vitest';
import paginationTranslations from '@shared/content/pagination/translations.json';
import {
  paginationContrastSource,
  paginationDirectionalSource,
  paginationFirstPageSource,
  paginationFocusVisibleSource,
  paginationInteractiveSource,
  paginationLastPageSource,
  paginationPlaygroundSource,
  paginationSimpleSource,
  paginationWithEllipsisSource,
  LABEL_NEXT,
  LABEL_PAGE,
  LABEL_PREVIOUS,
} from './pagination.source';

/**
 * A ausência deste arquivo era o `source_sem_teste` do auditor.
 *
 * A varredura genérica (`source-snippets.test.ts`) prova que o snippet importa o
 * que usa e liga só o que a classe declara. O que ela não prova é o que este
 * arquivo cobra: acompanhar os controls, omitir o andaime da story, ensinar a
 * peça certa em cada composição e bater com a story ao lado — a story e o
 * painel Code da MESMA tela dizendo a mesma coisa.
 */

/** Texto do conteúdo compartilhado, lido cru do JSON — caminho independente do `t()`. */
function text(path: string): string {
  let node: unknown = (paginationTranslations as Record<string, unknown>)['pt-BR'];
  for (const key of path.split('.')) node = (node as Record<string, unknown>)[key];
  return String(node);
}

const label = (key: string) => text(`demonstration.labels.${key}`);

/** Os arquivos de story, como texto: cada story tem de ligar o construtor dela. */
const stories = import.meta.glob<string>('./pagination*.stories.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const allStories = Object.values(stories).join('\n');

/** O bloco de uma story, do `export const Nome` até o próximo export. */
function storyBlock(name: string): string {
  const match = new RegExp(`export const ${name}: Story = \\{([\\s\\S]*?)(?=\\nexport |$)`).exec(
    allStories,
  );
  return match?.[1] ?? '';
}

/** Todos os construtores, para as regras que valem para o módulo inteiro. */
const builders: Array<[string, () => string]> = [
  ['paginationPlaygroundSource', paginationPlaygroundSource],
  ['paginationSimpleSource', paginationSimpleSource],
  ['paginationWithEllipsisSource', paginationWithEllipsisSource],
  ['paginationLastPageSource', paginationLastPageSource],
  ['paginationInteractiveSource', paginationInteractiveSource],
  ['paginationDirectionalSource', paginationDirectionalSource],
  ['paginationFirstPageSource', paginationFirstPageSource],
  ['paginationFocusVisibleSource', paginationFocusVisibleSource],
  ['paginationContrastSource', paginationContrastSource],
];

describe('os rótulos acessíveis são os do conteúdo compartilhado', () => {
  it('o prefixo do link numerado é o texto publicado, e não uma segunda redação', () => {
    // Duas cópias do mesmo rótulo é como uma delas envelhece sozinha: a docs
    // page leria "Ir para página" e a story afirmaria outra coisa.
    expect(LABEL_PAGE).toBe(label('page'));
  });

  it('os direcionais publicam o texto visível do conteúdo compartilhado', () => {
    for (const fn of [paginationSimpleSource, paginationDirectionalSource]) {
      expect(fn()).toContain(`text="${label('previous')}"`);
      expect(fn()).toContain(`text="${label('next')}"`);
    }
  });
});

describe('paginationPlaygroundSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = paginationPlaygroundSource();
    const comArgs = paginationPlaygroundSource('', {
      args: { total: 9, current: 4, previousText: 'Voltar', nextText: 'Avançar' },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain('readonly total = 9;');
    expect(comArgs).toContain('readonly current = signal(4);');
    expect(comArgs).toContain('text="Voltar"');
    expect(comArgs).toContain('text="Avançar"');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    const code = paginationPlaygroundSource('<nav role="navigation" data-slot="pagination">');
    expect(code).not.toContain('role="navigation"');
    expect(code).not.toContain('data-slot');
  });

  it('não nomeia o landmark: sem nome escrito, o componente assume o padrão', () => {
    expect(paginationPlaygroundSource()).not.toContain('<nav ndsPagination label=');
  });
});

describe('o snippet ensina o componente, não o andaime da story', () => {
  // Nomes que só existem dentro do `render` de uma story: propriedade de
  // captura, espião e o rótulo repassado por binding. Vazar qualquer um deles
  // entrega ao leitor um template que não resolve na mão dele.
  const scaffoldNames = [
    'pageLabel',
    'labelPrevious',
    'labelNext',
    'dontNavigate',
    'onNavigate',
    'onPageChange',
    'canvasElement',
  ];

  for (const [name, fn] of builders) {
    it(`${name} não vaza propriedade de story nem estilo inline`, () => {
      const code = fn();
      for (const leaked of scaffoldNames) expect(code, `${name} vaza ${leaked}`).not.toContain(leaked);
      // Valor de design em `style` inline sai do tema, da densidade e da escala
      // tipográfica — e o snippet é o que o leitor copia.
      expect(code).not.toContain('style=');
      // A `play` consulta por papel; o snippet não precisa de gancho de teste.
      expect(code).not.toContain('data-slot=');
    });
  }

  it('todo construtor monta um componente autocontido', () => {
    for (const [name, fn] of builders) {
      const code = fn();
      expect(code, `${name} não declara @Component`).toContain('@Component({');
      expect(code, `${name} não abre a classe do exemplo`).toContain('export class Exemplo {');
      expect(code, `${name} não importa do design system`).toContain(
        "from '@/components/ui/pagination';",
      );
    }
  });
});

describe('cada snippet importa só as peças que usa', () => {
  it('a faixa numérica traz o link, mas não as reticências', () => {
    const code = paginationSimpleSource();
    expect(code).toContain('NdsPaginationLink');
    expect(code).not.toContain('NdsPaginationEllipsis');
  });

  it('a lista longa traz as reticências', () => {
    const code = paginationWithEllipsisSource();
    expect(code).toContain('NdsPaginationEllipsis');
    expect(code).toContain('<span ndsPaginationEllipsis></span>');
  });

  it('o direcional não traz link numerado nem reticências', () => {
    const code = paginationDirectionalSource();
    expect(code).not.toContain('NdsPaginationLink');
    expect(code).not.toContain('NdsPaginationEllipsis');
    expect(code).not.toContain('@for');
  });

  it('quem guarda página importa o signal, e só quem guarda', () => {
    for (const fn of [paginationSimpleSource, paginationInteractiveSource, paginationDirectionalSource]) {
      expect(fn()).toContain("import { Component, signal } from '@angular/core';");
    }
    // A lista longa é um recorte fixo: não há estado a guardar.
    expect(paginationWithEllipsisSource()).toContain("import { Component } from '@angular/core';");
    expect(paginationWithEllipsisSource()).not.toContain('signal');
  });
});

describe('a tag do controle segue a ROTA', () => {
  // A decisão: com endereço de página o controle é `<a>` — destino de verdade,
  // abre em nova aba, é indexável. SEM rota é `<button type="button">`, porque
  // âncora vazia que age na própria página engana quem navega por teclado e por
  // leitor de tela. Nenhum exemplo do painel tem rota, então nenhum é âncora.
  for (const [name, fn] of builders) {
    it(`${name} não ensina âncora vazia`, () => {
      const code = fn();
      expect(code, `${name} ainda escreve href="#"`).not.toContain('href="#"');
      expect(code, `${name} deixou um </a> no exemplo`).not.toContain('</a>');
      expect(code, `${name} não declara o type do botão`).toContain('type="button"');
    });

    it(`${name} não anula um clique que não navega`, () => {
      // `preventDefault` é do caminho de âncora. Num botão sem formulário não
      // há ação padrão, e anulá-la ensinaria a copiar cerimônia morta.
      expect(fn()).not.toContain('preventDefault');
    });
  }
});

describe('o extremo é desabilitado por ESTADO, e não por remoção do link', () => {
  for (const [name, fn] of [
    ['paginationFirstPageSource', paginationFirstPageSource],
    ['paginationLastPageSource', paginationLastPageSource],
  ] as Array<[string, () => string]>) {
    it(`${name} mantém os dois controles e liga o disabled à página`, () => {
      const code = fn();
      expect(code).toContain('[disabled]="current() === 1"');
      expect(code).toContain('[disabled]="current() === total"');
      expect(code).toContain(`label="${LABEL_PREVIOUS}"`);
      expect(code).toContain(`label="${LABEL_NEXT}"`);
      // `aria-disabled`/`tabindex` são do componente: escrever à mão no exemplo
      // ensinaria a duplicar o que a diretiva já faz.
      expect(code).not.toContain('aria-disabled');
      expect(code).not.toContain('tabindex');
    });
  }

  it('a primeira e a última página diferem só na página corrente', () => {
    expect(paginationFirstPageSource()).toContain('readonly current = signal(1);');
    expect(paginationLastPageSource()).toContain('readonly current = signal(5);');
  });
});

describe('a lista longa mostra o recorte, e não uma sequência derivada', () => {
  it('o recorte é dado da classe, com o caractere tipográfico no componente', () => {
    const code = paginationWithEllipsisSource();
    expect(code).toContain("[1, 'ellipsis', 5, 6, 7, 'ellipsis', 12]");
    expect(code).toContain('readonly current = 6;');
    // As reticências vêm do componente; três pontos à mão seriam outra coisa.
    expect(code).not.toContain('...');
  });
});

describe('a faixa interativa mantém o estado do lado de quem consome', () => {
  it('o exemplo guarda a página e mostra o valor', () => {
    const code = paginationInteractiveSource();
    expect(code).toContain('readonly current = signal(3);');
    expect(code).toContain('this.current.set(page);');
    expect(code).toContain('Página {{ current() }} de {{ total }}');
  });
});

describe('cada story liga o próprio construtor', () => {
  const pairs: Array<[string, string]> = [
    ['Playground', 'paginationPlaygroundSource'],
    ['Simple', 'paginationSimpleSource'],
    ['WithEllipsis', 'paginationWithEllipsisSource'],
    ['LastPage', 'paginationLastPageSource'],
    ['Interactive', 'paginationInteractiveSource'],
    ['Directional', 'paginationDirectionalSource'],
    ['FirstPage', 'paginationFirstPageSource'],
    ['FocusVisible', 'paginationFocusVisibleSource'],
    ['Contrast', 'paginationContrastSource'],
  ];

  it('os quatro arquivos de story foram lidos', () => {
    // Raiz (Playground), Compositions, States e Variants. Contar aqui é o que
    // impede a varredura de encolher em silêncio se um arquivo sair do glob.
    expect(Object.keys(stories)).toHaveLength(4);
  });

  for (const [story, builder] of pairs) {
    it(`${story} → ${builder}`, () => {
      const block = storyBlock(story);
      expect(block, `a story ${story} não foi encontrada`).not.toBe('');
      expect(block).toContain(`transform: ${builder}`);
    });
  }
});

describe('o painel diz o que a tela mostra', () => {
  // Cada linha é: story, construtor, e o nome do landmark que os dois publicam.
  // O nome acessível é o que a `play` consulta e o que o leitor da docs page vê
  // — divergir aqui faz o painel Code ensinar uma paginação que não é a da tela.
  const pairs: Array<[string, () => string, string]> = [
    ['Simple', paginationSimpleSource, 'Paginação simples'],
    ['WithEllipsis', paginationWithEllipsisSource, 'Paginação com reticências'],
    ['LastPage', paginationLastPageSource, 'Paginação na última página'],
    ['Interactive', paginationInteractiveSource, 'Paginação interativa'],
    ['Directional', paginationDirectionalSource, 'Paginação direcional'],
    ['FirstPage', paginationFirstPageSource, 'Paginação na primeira página'],
    ['FocusVisible', paginationFocusVisibleSource, 'Paginação com foco'],
    ['Contrast', paginationContrastSource, 'Paginação medida por contraste'],
  ];

  for (const [story, fn, landmark] of pairs) {
    it(`${story}: snippet e story nomeiam o mesmo landmark`, () => {
      expect(fn()).toContain(`label="${landmark}"`);
      const block = storyBlock(story);
      expect(block, `a story ${story} não foi encontrada`).not.toBe('');
      expect(block, `${story} não publica o landmark "${landmark}"`).toContain(landmark);
    });
  }

  it('a faixa do snippet tem o mesmo tamanho da faixa da story', () => {
    expect(paginationSimpleSource()).toContain('readonly total = 5;');
    expect(storyBlock('Simple')).toContain('pages: [1, 2, 3, 4, 5]');

    expect(paginationInteractiveSource()).toContain('readonly total = 8;');
    expect(storyBlock('Interactive')).toContain('const total = 8;');
  });
});
