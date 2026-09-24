import { describe, expect, it } from 'vitest';
import {
  tableBasicSource,
  tableCaptionSrOnlySource,
  tableEmptySource,
  tableExpandableRowsSource,
  tableFilterToolbarSource,
  tableFooterSource,
  tableHorizontalScrollSource,
  tableLoadingSource,
  tablePlaygroundSource,
  tableRowActionsSource,
  tableRowSelectionSource,
  tableSelectedRowSource,
  tableSortableHeadersSource,
} from './table.source';

/**
 * A varredura genérica (`source-snippets.test.ts`) prova que o snippet importa o
 * que usa e que todo binding resolve num membro da classe do exemplo. O que ela
 * NÃO prova é que ele ensina o CERTO: que a legenda nunca sai do DOM, que a
 * peça importada é também DECLARADA no `imports` do componente, que o nome da
 * região rolável acompanha a story ao lado, e que o andaime da story — o `@for`
 * sobre a fixture, os `props` do renderer — não vaza para o painel.
 *
 * É isto que este arquivo cobra, e ele nasceu porque esta stack era a única com
 * `table.source.ts` e sem `table.source.test.ts`.
 */
const ALL: Array<[string, () => string]> = [
  ['tablePlaygroundSource', () => tablePlaygroundSource()],
  ['tableBasicSource', tableBasicSource],
  ['tableFooterSource', tableFooterSource],
  ['tableCaptionSrOnlySource', tableCaptionSrOnlySource],
  ['tableRowActionsSource', tableRowActionsSource],
  ['tableHorizontalScrollSource', tableHorizontalScrollSource],
  ['tableExpandableRowsSource', tableExpandableRowsSource],
  ['tableEmptySource', tableEmptySource],
  ['tableSelectedRowSource', tableSelectedRowSource],
  ['tableLoadingSource', tableLoadingSource],
  ['tableFilterToolbarSource', tableFilterToolbarSource],
  ['tableSortableHeadersSource', tableSortableHeadersSource],
  ['tableRowSelectionSource', tableRowSelectionSource],
];

/** Os nomes importados do design system, por peça. */
function imported(code: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const m of code.matchAll(
    /import\s+\{([^}]*)\}\s*from\s*'@\/components\/ui\/([a-z0-9-]+)'/g,
  )) {
    out[m[2]!] = m[1]!
      .split(',')
      .map((n) => n.trim().replace(/^type\s+/, ''))
      .filter(Boolean);
  }
  return out;
}

/** O conteúdo do array `imports` do `@Component`. */
function declared(code: string): string[] {
  const block = /imports:\s*\[([\s\S]*?)\]/.exec(code)?.[1] ?? '';
  return block
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
}

describe('todos os snippets do Table', () => {
  it('ensinam a importação do design system, nunca a diretiva escrita à mão', () => {
    for (const [name, build] of ALL) {
      const code = build();
      expect(code, name).toContain("} from '@/components/ui/table';");
      expect(code, name).toContain('<table ndsTable>');
      // `data-slot` é escrito pelo host binding da diretiva: mostrá-lo no
      // exemplo ensinaria a repetir o que o componente já faz.
      expect(code, name).not.toContain('data-slot=');
    }
  });

  it('nunca desmontam a legenda — ela é o nome da tabela para quem ouve', () => {
    for (const [name, build] of ALL) {
      expect(build(), name).toContain('<caption ndsTableCaption');
    }
  });

  it('DECLARAM no componente toda peça que mandam importar', () => {
    // Em standalone é o array `imports` que faz a diretiva valer no template.
    // Importar no topo e não declarar deixa `<button ndsButton>` inerte, e
    // nenhum dos outros portões olha para isso.
    for (const [name, build] of ALL) {
      const code = build();
      const inImports = declared(code);
      for (const [slug, names] of Object.entries(imported(code))) {
        for (const part of names) {
          // Tipo não entra em `imports`: ele não é diretiva.
          if (part === 'TableSortDirection') continue;
          expect(inImports, `${name}: ${part} (de ${slug})`).toContain(part);
        }
      }
    }
  });

  it('declaram os próprios dados, e nunca a fixture das stories', () => {
    // O painel que imprime `@for (invoice of faturas; …)` publica o `props` do
    // renderer: quem copia recebe um laço sobre um nome que não existe.
    for (const [name, build] of ALL) {
      const code = build();
      expect(code, name).not.toContain('table.fixtures');
      expect(code, name).not.toContain('INVOICES');
      expect(code, name).not.toContain('STATUS_VARIANT');
      // O laço da story percorre o `props` do renderer (`faturas`); o do exemplo
      // percorre um membro declarado logo abaixo.
      expect(code, name).not.toMatch(/@for\s*\(\s*\w+\s+of\s+faturas\b/);
      expect(code, name).not.toContain('variantOf: ');
    }
  });

  it('mostram o elemento externo, que esta stack não monta sozinha', () => {
    // A diretiva tem o `<table>` como host e não pode criar um pai: quem escreve
    // o container que rola é quem usa, e o exemplo tem de ensinar isso.
    for (const [name, build] of ALL) {
      expect(build(), name).toContain('<div ndsTableWrapper');
    }
  });
});

describe('tablePlaygroundSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = tablePlaygroundSource('<table data-slot="table">', {});
    const withCaption = tablePlaygroundSource('<table data-slot="table">', {
      args: { captionVisible: true, withFooter: true },
    });
    expect(noArgs).not.toBe(withCaption);
    expect(withCaption).toContain(
      '<caption ndsTableCaption>Lista de faturas recentes</caption>',
    );
    expect(noArgs).toContain('<caption ndsTableCaption class="nds-sr-only">');
  });

  it('o rodapé é o padrão, e some — com o import junto — quando o control o desliga', () => {
    const withFooter = tablePlaygroundSource('', {
      args: { captionVisible: false, withFooter: true },
    });
    const noFooter = tablePlaygroundSource('', {
      args: { captionVisible: false, withFooter: false },
    });
    expect(withFooter).toContain('<tfoot ndsTableFooter>');
    expect(withFooter).toContain('  NdsTableFooter,');
    expect(noFooter).not.toContain('<tfoot ndsTableFooter>');
    expect(noFooter).not.toContain('NdsTableFooter');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(
      tablePlaygroundSource('<div data-slot="table-container" tabindex="0">', {}),
    ).not.toContain('table-container');
  });
});

describe('tableBasicSource', () => {
  it('é a forma mínima: legenda visível e nenhum sumário', () => {
    const code = tableBasicSource();
    expect(code).toContain('<caption ndsTableCaption>Lista de faturas recentes</caption>');
    expect(code).not.toContain('nds-sr-only');
    expect(code).not.toContain('<tfoot');
  });
});

describe('tableFooterSource', () => {
  it('põe o total no tfoot, com o colspan das colunas descritivas', () => {
    const code = tableFooterSource();
    expect(code).toContain('<tfoot ndsTableFooter>');
    expect(code).toContain('<td ndsTableCell colspan="3">Total</td>');
  });
});

describe('tableCaptionSrOnlySource', () => {
  it('esconde a legenda SÓ ao lado de um título visível', () => {
    const code = tableCaptionSrOnlySource();
    expect(code).toContain('<caption ndsTableCaption class="nds-sr-only">');
    // Sem o `<h2>` por perto, esconder a legenda é só esconder informação.
    expect(code).toContain('<h2 class="nds-text-h3 nds-m-0">Faturas recentes</h2>');
    // Três colunas: a de método sai, e com ela a célula correspondente.
    expect(code).not.toContain('{{ invoice.method }}');
  });
});

describe('tableRowActionsSource', () => {
  it('nomeia cada botão pelo registro a que ele pertence', () => {
    const code = tableRowActionsSource();
    // Cinco botões chamados "Editar" seriam cinco controles indistinguíveis na
    // lista do leitor de tela.
    expect(code).toContain(`[attr.aria-label]="'Editar fatura ' + invoice.id"`);
    expect(code).not.toContain('ariaLabel');
  });

  it('mantém o cabeçalho da coluna de ações, apenas invisível', () => {
    const code = tableRowActionsSource();
    expect(code).toContain('<span class="nds-sr-only">Ações</span>');
    expect(code).toContain("import { NdsButton, NdsButtonIcon } from '@/components/ui/button';");
  });
});

describe('tableHorizontalScrollSource', () => {
  it('ensina o NOME da região rolável junto com a rolagem', () => {
    const code = tableHorizontalScrollSource();
    // Foco sem nome faz uma parada que o leitor de tela não sabe anunciar, e o
    // nome é do conteúdo — o design system não tem como cravá-lo.
    expect(code).toContain(
      '<div ndsTableWrapper regionLabel="Faturas por mês de competência">',
    );
    // O `tabindex` vem da diretiva: escrevê-lo no exemplo ensinaria a repetir o
    // que o componente já garante.
    expect(code).not.toContain('tabindex=');
    expect(code).not.toContain('overflow');
  });

  it('mostra o que PROVOCA a rolagem, com identificador em inglês', () => {
    const code = tableHorizontalScrollSource();
    expect(code).toContain('readonly months = signal(');
    expect(code).not.toMatch(/\bmeses\b/);
  });
});

describe('tableExpandableRowsSource', () => {
  it('põe o estado no CONTROLE, nunca na linha', () => {
    const code = tableExpandableRowsSource();
    // O `data-state` da `<tr>` já é da SELEÇÃO, e os dois estados coexistem: é
    // disso que o `:has([aria-expanded="true"])` da folha compartilhada vive.
    expect(code).toContain(`[attr.aria-expanded]="expanded().has(invoice.id)"`);
    expect(code).toContain(`[attr.aria-controls]="detailId(invoice.id)"`);
    expect(code).not.toContain('data-state');
    // A seleção continua sendo a entrada da diretiva, e as duas convivem.
    expect(code).toContain(`[selected]="invoice.id === selectedId()"`);
  });

  it('mantém a linha revelada no DOM, escondida por hidden', () => {
    const code = tableExpandableRowsSource();
    // Alvo de `aria-controls` que some deixa o atributo apontando para nada;
    // `hidden` tira da tela, da árvore de acessibilidade e da tabulação de uma
    // vez, e a ordem de foco sai do DOM — sem `tabindex` nenhum.
    expect(code).toContain(`[hidden]="!expanded().has(invoice.id)"`);
    expect(code).toContain(`[attr.id]="detailId(invoice.id)"`);
    expect(code).toContain(`[attr.colspan]="columnCount()"`);
    expect(code).not.toContain('tabindex');
  });

  it('dá nome de REGISTRO ao controle, e não de ação', () => {
    const code = tableExpandableRowsSource();
    // Trocar "Mostrar" por "Ocultar" diria o que o `aria-expanded` já diz, e
    // ficaria em desacordo com ele no instante entre uma escrita e outra.
    expect(code).toContain(`[attr.aria-label]="'Detalhes da fatura ' + invoice.id"`);
    expect(code).not.toMatch(/Mostrar|Ocultar/);
    expect(code).not.toContain('aria-live');
  });

  it('marca o chevron como decorativo e usa a rotação global', () => {
    const code = tableExpandableRowsSource();
    // `.nds-chevron` gira sob `[aria-expanded="true"]` — o mesmo atributo que a
    // folha da linha lê. O `chevron-right` apontaria para trás ao girar.
    expect(code).toContain('<svg ndsButtonIcon kind="chevron-down" class="nds-chevron">');
  });

  it('dá cabeçalho à coluna do disclosure, com o rótulo fora da tela', () => {
    const code = tableExpandableRowsSource();
    expect(code).toContain('<span class="nds-sr-only">Detalhes</span>');
  });
});

describe('tableEmptySource', () => {
  it('atravessa a tabela com a mensagem, sem desmontar o cabeçalho', () => {
    const code = tableEmptySource();
    // `.nds-table-empty` traz o piso de altura, o centro e o tom discreto de uma
    // vez — três utilitárias soltas davam duas das três.
    expect(code).toContain('class="nds-table-empty"');
    expect(code).not.toContain('nds-text-center nds-text-muted-foreground');
    // O `colspan` sai do tamanho da lista: escrito à mão, ele deixaria a
    // mensagem torta na próxima coluna acrescentada.
    expect(code).toContain(`[attr.colspan]="columns().length"`);
    expect(code).toContain('<th ndsTableHead>{{ column }}</th>');
    expect(code).not.toContain('readonly invoices');
  });
});

describe('tableSelectedRowSource', () => {
  it('marca a LINHA, e pela entrada da diretiva', () => {
    const code = tableSelectedRowSource();
    expect(code).toContain(`[selected]="invoice.id === selectedId()"`);
    expect(code).not.toContain('<td ndsTableCell [selected]');
  });
});

describe('tableLoadingSource', () => {
  it('põe o esqueleto na célula e o anúncio na região', () => {
    const code = tableLoadingSource();
    expect(code).toContain("import { NdsSkeleton } from '@/components/ui/skeleton';");
    expect(code).toContain(
      '<div role="status" aria-busy="true" aria-label="Carregando faturas">',
    );
    // Forma por atributo, nunca altura cravada (WCAG 1.4.4).
    expect(code).toContain('<div ndsSkeleton data-shape="text" data-width="3-4"></div>');
    expect(code).not.toContain('height');
  });
});

describe('tableFilterToolbarSource', () => {
  it('filtra por sinal, e cai no estado vazio quando a busca não acha nada', () => {
    const code = tableFilterToolbarSource();
    // O stack é zoneless: sem sinal a digitação não dispara detecção nenhuma.
    expect(code).toContain("readonly term = signal('');");
    expect(code).toContain('readonly filtered = computed(() => {');
    expect(code).toContain('} @empty {');
    expect(code).toContain('class="nds-table-empty"');
  });

  it('nomeia o campo por rótulo visível, ligado por for/id', () => {
    const code = tableFilterToolbarSource();
    expect(code).toContain('<label ndsLabel for="filter-invoices">Buscar fatura</label>');
    expect(code).toContain('id="filter-invoices"');
  });
});

describe('tableSortableHeadersSource', () => {
  it('põe aria-sort na CÉLULA de cabeçalho, nunca no botão', () => {
    const code = tableSortableHeadersSource();
    expect(code).toContain(`<th ndsTableHead [sort]="direction()">`);
    expect(code).not.toContain('<button ndsButton [sort]');
    // O tipo entra no import, e não no array `imports` do componente.
    expect(code).toContain('  type TableSortDirection,');
  });
});

describe('tableRowSelectionSource', () => {
  it('nomeia cada checkbox pela fatura que ele marca', () => {
    const code = tableRowSelectionSource();
    expect(code).toContain(`[attr.aria-label]="'Selecionar fatura ' + invoice.id"`);
    expect(code).toContain('aria-label="Selecionar todas as faturas"');
    // O mestre fica misto enquanto a seleção é parcial.
    expect(code).toContain(`[indeterminate]="someSelected()"`);
    expect(code).toContain(`[selected]="selected().has(invoice.id)"`);
  });
});
