import { describe, expect, it } from 'vitest';
import {
  lineTableActionsSource,
  tableBasicaSource,
  tableCaptionOcultaSource,
  tableExpandableRowsSource,
  tableLineSelecionadaSource,
  tableLoadingSource,
  tableScrollHorizontalSource,
  tableSource,
  tableVaziaSource,
} from './table.source';

/**
 * A varredura genérica (`source-snippets.test.ts`) prova que o snippet importa
 * o que usa. O que ela NÃO prova é que ele ensina o certo: que a legenda nunca
 * sai do DOM, que o total bate com as linhas declaradas, que o nome da região
 * rolável acompanha a story ao lado e que o HTML do renderer não vaza para o
 * painel. É isto que este arquivo cobra.
 */
const ALL: Array<() => string> = [
  tableBasicaSource,
  tableCaptionOcultaSource,
  lineTableActionsSource,
  tableScrollHorizontalSource,
  tableExpandableRowsSource,
  tableVaziaSource,
  tableLineSelecionadaSource,
  tableLoadingSource,
];

describe('todos os snippets do Table', () => {
  it('ensinam a importação do design system, nunca a tag crua', () => {
    for (const build of ALL) {
      const code = build();
      expect(code).toContain('} from "@/components/ui/table";');
      expect(code).toContain('<Table');
      // `<table>` minúsculo seria o elemento nativo escrito à mão: quem copiasse
      // perderia o contêiner que rola e o `tabIndex` que o componente monta.
      expect(code).not.toContain('<table');
      expect(code).not.toContain('data-slot=');
    }
  });

  it('nunca desmontam a legenda — ela é o nome da tabela para quem ouve', () => {
    for (const build of ALL) {
      expect(build()).toContain('<TableCaption');
    }
  });

  it('importam só as peças que o próprio snippet monta', () => {
    for (const build of ALL) {
      const code = build();
      const importBlock = code.slice(0, code.indexOf('} from "@/components/ui/table";'));
      for (const part of [
        'TableBody',
        'TableCaption',
        'TableCell',
        'TableFooter',
        'TableHead',
        'TableHeader',
        'TableRow',
      ]) {
        // `TableHead` é prefixo de `TableHeader`: o uso é cobrado com o `<`.
        const used = code.includes(`<${part}>`) || code.includes(`<${part} `);
        expect(importBlock.includes(`  ${part},`)).toBe(used);
      }
    }
  });
});

describe('tableSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = tableSource('<table data-slot="table">', {});
    const withCaption = tableSource('<table data-slot="table">', {
      args: { captionVisible: true, withFooter: true },
    });
    expect(noArgs).not.toBe(withCaption);
    // Legenda visível: a chamada fecha sem a classe que a tira da tela.
    expect(withCaption).toContain('<TableCaption>Lista de faturas recentes</TableCaption>');
    expect(noArgs).toContain('<TableCaption className="nds-sr-only">');
  });

  it('o rodapé é o padrão, e some quando o control o desliga', () => {
    const withFooter = tableSource('', { args: { captionVisible: false, withFooter: true } });
    const noFooter = tableSource('', { args: { captionVisible: false, withFooter: false } });
    expect(withFooter).toContain('<TableFooter>');
    expect(withFooter).toContain('  TableFooter,');
    expect(noFooter).not.toContain('<TableFooter>');
    expect(noFooter).not.toContain('  TableFooter,');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(tableSource('<div data-slot="table-container" tabindex="0">', {})).not.toContain(
      'table-container',
    );
  });

  it('DECLARA os dados que a tabela consome', () => {
    // O painel imprimia `{INVOICES.map(...)}` sem declarar `INVOICES` em lugar
    // nenhum: quem copiava recebia um erro de compilação.
    const code = tableSource('', {});
    expect(code).toContain('const invoices = [');
    expect(code.indexOf('const invoices')).toBeLessThan(code.indexOf('{invoices.map('));
    expect(code).not.toContain('INVOICES');
    expect(code).not.toContain('table.fixtures');
  });

  it('o total escrito por extenso é a soma das linhas que o snippet mostra', () => {
    const code = tableSource('', { args: { captionVisible: false, withFooter: true } });
    const amounts = [...code.matchAll(/amount: "R\$ ([\d.]+),00"/g)].map((match) =>
      Number(match[1].replace('.', '')),
    );
    expect(amounts).toHaveLength(3);
    const total = amounts.reduce((sum, value) => sum + value, 0);
    expect(code).toContain(`<TableCell className="nds-text-right">R$ ${total},00</TableCell>`);
  });
});

describe('tableBasicaSource', () => {
  it('é a forma mínima: legenda visível e nenhum sumário', () => {
    const code = tableBasicaSource();
    expect(code).toContain('<TableCaption>Lista de faturas recentes</TableCaption>');
    expect(code).not.toContain('nds-sr-only');
    expect(code).not.toContain('<TableFooter>');
  });
});

describe('tableCaptionOcultaSource', () => {
  it('esconde a legenda SÓ ao lado de um título visível', () => {
    const code = tableCaptionOcultaSource();
    expect(code).toContain('<TableCaption className="nds-sr-only">');
    // Sem o `<h2>` por perto, esconder a legenda é só esconder informação.
    expect(code).toContain('<h2 className="nds-text-h3 nds-m-0">Faturas recentes</h2>');
  });

  it('leva dados próprios, de três colunas, e não o recorte de quatro', () => {
    const code = tableCaptionOcultaSource();
    expect(code).toContain('const invoices = [');
    expect(code).not.toContain('method:');
    expect(code).not.toContain('{invoice.method}');
  });
});

describe('lineTableActionsSource', () => {
  it('nomeia cada botão pelo registro a que ele pertence', () => {
    const code = lineTableActionsSource();
    // Cinco botões chamados "Ações" seriam cinco controles indistinguíveis na
    // lista do leitor de tela.
    expect(code).toContain('aria-label={"Ações para fatura " + invoice.id}');
    expect(code).not.toContain('ariaLabel');
  });

  it('mantém o cabeçalho da coluna de ações, apenas invisível', () => {
    const code = lineTableActionsSource();
    expect(code).toContain('<span className="nds-sr-only">Ações</span>');
    // O ícone não nomeia nada: ele é decorativo.
    expect(code).toContain('<MoreHorizontal className="nds-icon" aria-hidden="true" />');
    expect(code).toContain('import { Button } from "@/components/ui/button";');
  });
});

describe('tableScrollHorizontalSource', () => {
  it('ensina o NOME da região rolável junto com a rolagem', () => {
    const code = tableScrollHorizontalSource();
    // Foco sem nome faz uma parada que o leitor de tela não sabe anunciar, e o
    // nome é do conteúdo — o design system não tem como cravá-lo.
    expect(code).toContain('<Table regionLabel="Faturas por mês de competência">');
    // Quem rola é o contêiner do próprio componente: nada de wrapper à mão.
    expect(code).not.toContain('overflow');
    expect(code).not.toContain('tabIndex');
  });

  it('mostra o que PROVOCA a rolagem, com identificador em inglês', () => {
    const code = tableScrollHorizontalSource();
    expect(code).toContain('const months = [');
    expect(code).not.toMatch(/\bmeses\b/);
    expect(code).not.toMatch(/\bano\b/);
  });
});

describe('tableVaziaSource', () => {
  it('atravessa a tabela com a mensagem, sem desmontar o cabeçalho', () => {
    const code = tableVaziaSource();
    expect(code).toContain('className="nds-table-empty"');
    // O `colSpan` sai do tamanho da lista: escrito à mão, ele deixaria a
    // mensagem torta na próxima coluna acrescentada.
    expect(code).toContain('colSpan={colunas.length}');
    expect(code).toContain('<TableHead key={coluna}>');
    expect(code).not.toContain('const invoices = [');
  });
});

describe('tableLineSelecionadaSource', () => {
  it('marca a LINHA, e só quando é verdade', () => {
    const code = tableLineSelecionadaSource();
    expect(code).toContain('data-state={invoice.id === selecionada ? "selected" : null}');
    // `data-state="none"` faria o seletor `[data-state]` casar a linha errada.
    expect(code).not.toContain('"none"');
    expect(code).not.toContain('<TableCell data-state');
  });
});

describe('tableLoadingSource', () => {
  it('põe o esqueleto na célula e o anúncio na região', () => {
    const code = tableLoadingSource();
    expect(code).toContain('import { Skeleton } from "@/components/ui/skeleton";');
    expect(code).toContain('<div role="status" aria-busy="true" aria-label="Carregando faturas">');
    // Forma por atributo, nunca altura cravada (WCAG 1.4.4).
    expect(code).toContain('<Skeleton data-shape="text" data-width="3-4" />');
    expect(code).not.toContain('height');
  });
});

describe('tableExpandableRowsSource', () => {
  it('põe o estado no CONTROLE, nunca na linha', () => {
    const code = tableExpandableRowsSource();
    // O `data-state` da linha já é da SELEÇÃO, e os dois estados coexistem: é
    // disso que o `:has([aria-expanded="true"])` da folha compartilhada vive.
    expect(code).toContain('aria-expanded={expanded.has(invoice.id)}');
    expect(code).toContain('aria-controls={detailId(invoice.id)}');
    expect(code).toContain('data-state={invoice.id === selectedId ? "selected" : null}');
    expect(code).not.toContain('<TableRow aria-expanded');
  });

  it('mantém a linha revelada no DOM, escondida por hidden', () => {
    const code = tableExpandableRowsSource();
    // Alvo de `aria-controls` que some deixa o atributo apontando para nada;
    // `hidden` tira da tela, da árvore de acessibilidade e da tabulação de uma
    // vez, e a ordem de foco sai do DOM.
    expect(code).toContain('id={detailId(invoice.id)} hidden={!expanded.has(invoice.id)}');
    expect(code).toContain('colSpan={5}');
    expect(code).not.toContain('tabIndex');
    // A irmã fica ao lado da linha de dados, no mesmo `key`: sem o Fragment
    // seriam dois filhos com a mesma chave.
    expect(code).toContain('<Fragment key={invoice.id}>');
  });

  it('dá nome de REGISTRO ao controle, e não de ação', () => {
    const code = tableExpandableRowsSource();
    // Trocar "Mostrar" por "Ocultar" diria o que o `aria-expanded` já diz, e
    // ficaria em desacordo com ele no instante entre uma escrita e outra.
    expect(code).toContain('aria-label={"Detalhes da fatura " + invoice.id}');
    expect(code).not.toMatch(/Mostrar|Ocultar/);
    expect(code).not.toContain('aria-live');
  });

  it('marca o chevron como decorativo e usa a rotação global', () => {
    const code = tableExpandableRowsSource();
    // `.nds-chevron` gira sob `[aria-expanded="true"]` — o mesmo atributo que a
    // folha da linha lê.
    expect(code).toContain('<ChevronDown className="nds-chevron" aria-hidden="true" />');
    expect(code).toContain('import { ChevronDown } from "lucide-react";');
  });

  it('dá cabeçalho à coluna do disclosure, com o rótulo fora da tela', () => {
    expect(tableExpandableRowsSource()).toContain(
      '<span className="nds-sr-only">Detalhes</span>',
    );
  });
});
