import { describe, expect, it } from 'vitest';
import {
  commandCheckedItemSource,
  commandDemoInlineSource,
  commandDemoPaletteSource,
  commandEmptyStateSource,
  commandItemDisabledSource,
  commandLongListSource,
  commandPaletteSource,
  commandPlaygroundSource,
  commandWithDisabledItemsSource,
  commandWithGroupsSource,
  commandWithSeparatorSource,
  commandWithShortcutsSource,
} from './command.source';

/**
 * O painel Code imprime o `template` da story literalmente — o `@if` que
 * alterna os grupos, a interpolação dos args, o `(itemSelect)` ligado ao
 * espião. O `transform` devolve o uso real, e é isto que estes casos guardam.
 *
 * A varredura genérica do `source-snippets.test.ts` já prova coerência de
 * import e de binding; o que ela NÃO alcança é se o snippet ensina o certo e
 * bate com a story ao lado. Aqui a distância existia antes deste arquivo: o
 * snippet da Playground ensinava dois comandos num grupo só, enquanto o canvas
 * ao lado desenhava cinco em dois grupos com traço.
 */

/** Quantas vezes `needle` aparece em `text`. */
function count(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

/** O template do componente do snippet, sem o resto do arquivo. */
function template(code: string): string {
  const m = /template:\s*`([\s\S]*?)`/.exec(code);
  expect(m).not.toBeNull();
  return m![1]!;
}

describe('commandPlaygroundSource', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const code = commandPlaygroundSource();
    expect(code).toContain(
      "import { NDS_COMMAND, type CommandSelectDetails } from '@/components/ui/command';",
    );
    expect(code).toContain('imports: [...NDS_COMMAND]');
    expect(code).toContain('<nds-command (itemSelect)="run($event)">');
    expect(code).toContain('run(command: CommandSelectDetails): void');

    // O andaime da story: controle de fluxo que alterna os grupos, interpolação
    // dos args e o espião do renderer.
    const tpl = template(code);
    expect(tpl).not.toContain('@if');
    expect(tpl).not.toContain('{{');
    expect(code).not.toContain('args.');
    expect(code).not.toContain('onItemSelect');
    expect(code).not.toContain('[placeholder]');
    // Atributos que as diretivas escrevem em runtime — no Angular o host
    // binding os disputa, então o snippet não pode ensiná-los.
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('[attr.');
  });

  it('bate com a story: cinco comandos, dois grupos nomeados e um traço', () => {
    const code = commandPlaygroundSource();
    expect(count(code, '<div ndsCommandItem ')).toBe(5);
    expect(code).toContain('<div ndsCommandGroup heading="Componentes">');
    expect(code).toContain('<div ndsCommandGroup heading="Utilitários">');
    expect(count(code, '<div ndsCommandSeparator></div>')).toBe(1);
    for (const label of ['>Button<', '>Input<', '>Separator<', '>cn()<', '>clsx()<']) {
      expect(code).toContain(label);
    }
  });

  it('sem grupos vira UM bloco, sem cabeçalho e sem traço', () => {
    const code = commandPlaygroundSource('', { args: { showGroups: false } });
    expect(count(code, '<div ndsCommandItem ')).toBe(5);
    expect(count(code, '<div ndsCommandGroup>')).toBe(1);
    expect(code).not.toContain('heading=');
    expect(code).not.toContain('ndsCommandSeparator');
  });

  it('leva o placeholder e a frase de vazio que vieram dos controls', () => {
    const code = commandPlaygroundSource('', {
      args: { placeholder: 'Buscar ação...', emptyMessage: 'Nada por aqui.' },
    });
    expect(code).toContain('<input ndsCommandInput placeholder="Buscar ação..." />');
    expect(code).toContain('<div ndsCommandEmpty>Nada por aqui.</div>');
    expect(code).not.toContain('Buscar componente...');
  });

  it('a frase de vazio vem por último, FORA da lista', () => {
    // `role="status"` não é filho permitido de `role="listbox"`: dentro da
    // lista o axe reprova, e a região viva perderia o anúncio.
    const tpl = template(commandPlaygroundSource());
    const listEnd = tpl.lastIndexOf('</div>', tpl.indexOf('<div ndsCommandEmpty>'));
    const listStart = tpl.indexOf('<div ndsCommandList>');
    expect(listStart).toBeGreaterThan(-1);
    expect(listEnd).toBeGreaterThan(listStart);
    expect(tpl.indexOf('<div ndsCommandEmpty>')).toBeGreaterThan(tpl.lastIndexOf('ndsCommandItem'));
  });
});

describe('os snippets das stories batem com o canvas', () => {
  it('WithGroups: sete comandos em dois grupos, com traço', () => {
    const code = commandWithGroupsSource();
    expect(count(code, '<div ndsCommandItem ')).toBe(7);
    expect(count(code, 'heading=')).toBe(2);
    expect(count(code, '<div ndsCommandSeparator></div>')).toBe(1);
    expect(code).toContain('value="twmerge">twMerge()<');
    // Nenhum comando escolhe nada aqui: sem `(itemSelect)`, sem corpo.
    expect(code).not.toContain('itemSelect');
    expect(code).toContain('export class Exemplo {}');
  });

  it('EmptyState: três comandos sem grupo, e a busca da story não entra', () => {
    const code = commandEmptyStateSource();
    expect(count(code, '<div ndsCommandItem ')).toBe(3);
    expect(code).not.toContain('heading=');
    expect(code).not.toContain('ndsCommandSeparator');
    expect(code).not.toContain('xyznotfound');
    expect(code).not.toContain('buscaInicial');
    expect(code).toContain('<div ndsCommandEmpty>Nenhum resultado encontrado.</div>');
  });

  it('ItemDisabled: só "Arquivar" desabilitado, e o padrão não é escrito', () => {
    const code = commandItemDisabledSource();
    expect(code).toContain('<div ndsCommandItem value="arquivar" [disabled]="true">Arquivar</div>');
    expect(count(code, '[disabled]')).toBe(1);
    // Repetir `[disabled]="false"` nos habilitados ensinaria ruído.
    expect(code).not.toContain('[disabled]="false"');
    expect(code).toContain('placeholder="Buscar comando..."');
  });

  it('CheckedItem: marcado e não marcado, e o atalho sem `textValue`', () => {
    const code = commandCheckedItemSource();
    expect(code).toContain('[checked]="true">Claro<');
    expect(code).toContain('[checked]="false">Escuro<');
    expect(code).toContain('Sistema <span ndsCommandShortcut>Ctrl+S</span>');
  });

  it('LongList: os trinta nomes vêm de um array, não de trinta linhas', () => {
    const code = commandLongListSource();
    expect(code).toContain('@for (name of components; track name)');
    expect(code).toContain('readonly components = [');
    expect(count(template(code), '<div ndsCommandItem')).toBe(1);
    for (const name of ['Accordion', 'AlertDialog', 'Dialog', 'Popover']) {
      expect(code).toContain(`'${name}'`);
    }
    const names = code.slice(code.indexOf('readonly components = ['));
    expect(count(names, "', ") + count(names, "',\n")).toBe(30);
  });

  it('WithShortcuts: três atalhos, e o comando sem atalho não ganha um', () => {
    const code = commandWithShortcutsSource();
    expect(count(code, '<span ndsCommandShortcut>')).toBe(3);
    expect(code).toContain('value="preferencias">Preferências</div>');
    expect(count(code, '<div ndsCommandSeparator></div>')).toBe(1);
  });

  it('WithSeparator: dois blocos sem cabeçalho e um traço entre eles', () => {
    const code = commandWithSeparatorSource();
    expect(count(code, '<div ndsCommandGroup>')).toBe(2);
    expect(code).not.toContain('heading=');
    expect(count(code, '<div ndsCommandSeparator></div>')).toBe(1);
    expect(code).toContain('value="sair">Sair<');
  });

  it('WithDisabledItems: três desabilitados entre seis', () => {
    const code = commandWithDisabledItemsSource();
    expect(count(code, '<div ndsCommandItem ')).toBe(6);
    expect(count(code, '[disabled]="true"')).toBe(3);
    expect(code).toContain('placeholder="Buscar..."');
  });
});

describe('commandPaletteSource', () => {
  it('compõe com o Dialog e registra o atalho global na janela', () => {
    const code = commandPaletteSource();
    expect(code).toContain("import { NDS_DIALOG } from '@/components/ui/dialog';");
    expect(code).toContain('imports: [...NDS_COMMAND, ...NDS_DIALOG, NdsButton]');
    expect(code).toContain("host: { '(window:keydown)': 'openFromShortcut($event)' }");
    expect(code).toContain('event.preventDefault();');
    expect(code).toContain('class="nds-command-dialog-content" [showCloseButton]="false"');
  });

  it('a dica do atalho é um <kbd> DENTRO do gatilho, sem aria-label', () => {
    // O nome acessível do botão sai do texto visível (WCAG 2.5.3): um
    // `aria-label` por cima dele dizendo outra coisa é o defeito que isto barra.
    const code = commandPaletteSource();
    expect(code).toContain(
      '<button ndsDialogTrigger ndsButton variant="outline">\n        Buscar <kbd class="nds-kbd">Ctrl+K</kbd>\n      </button>',
    );
    expect(code).not.toContain('aria-label');
    // O atalho de ITEM é outra peça: mora dentro de um comando, nunca no gatilho.
    const trigger = code.slice(code.indexOf('<button'), code.indexOf('</button>'));
    expect(trigger).not.toContain('ndsCommandShortcut');
  });

  it('o diálogo se nomeia por título e descrição que só o leitor de tela vê', () => {
    const code = commandPaletteSource();
    expect(code).toContain('<h2 ndsDialogTitle class="nds-sr-only">Command Palette</h2>');
    expect(code).toContain(
      '<p ndsDialogDescription class="nds-sr-only">Busque por um comando ou ação...</p>',
    );
  });

  it('escolher executa e FECHA a paleta', () => {
    const code = commandPaletteSource();
    expect(code).toContain('<nds-command (itemSelect)="run($event)">');
    expect(code).toMatch(/run\(command: CommandSelectDetails\): void \{[\s\S]*this\.open\.set\(false\);/);
  });

  it('bate com a story: dois comandos com atalho, traço, e um utilitário', () => {
    const code = commandPaletteSource();
    expect(code).toContain('Button <span ndsCommandShortcut>Ctrl+B</span>');
    expect(code).toContain('Input <span ndsCommandShortcut>Ctrl+I</span>');
    expect(code).toContain('value="cn">cn()<');
    expect(count(code, '<div ndsCommandSeparator></div>')).toBe(1);
  });
});

describe('os cartões de Variantes ensinam a lista da demonstração', () => {
  // O cartão desenha a lista da DEMONSTRAÇÃO, e não a da Playground nem a da
  // story da paleta: foi a distância que a verificação cruzada mediu, com o
  // canvas mostrando três comandos e o código ensinando cinco.
  it('Inline: Button e Input em Componentes, Separator em Utilitários, com traço', () => {
    const code = commandDemoInlineSource();
    expect(count(code, '<div ndsCommandItem ')).toBe(3);
    expect(code).toContain('<div ndsCommandGroup heading="Componentes">');
    expect(code).toContain('<div ndsCommandGroup heading="Utilitários">');
    expect(code).toContain('value="separator">Separator<');
    expect(count(code, '<div ndsCommandSeparator></div>')).toBe(1);
    expect(code).not.toContain('cn()');
    expect(code).not.toContain('ndsCommandShortcut');
    expect(code).toContain('<nds-command (itemSelect)="run($event)">');
  });

  it('Command palette: a composição com o Dialog, e os atalhos só nos componentes', () => {
    const code = commandDemoPaletteSource();
    expect(code).toContain("import { NDS_DIALOG } from '@/components/ui/dialog';");
    expect(code).toContain('class="nds-command-dialog-content" [showCloseButton]="false"');
    expect(code).toContain('Button <span ndsCommandShortcut>Ctrl+B</span>');
    expect(code).toContain('Input <span ndsCommandShortcut>Ctrl+I</span>');
    expect(code).toContain('value="separator">Separator</div>');
    expect(count(code, '<span ndsCommandShortcut>')).toBe(2);
    expect(code).not.toContain('cn()');
    expect(code).toMatch(/run\(command: CommandSelectDetails\): void \{[\s\S]*this\.open\.set\(false\);/);
  });
});

describe('as lições do componente', () => {
  it('nenhum snippet escreve `textValue`: o filtro já deixa o atalho de fora', () => {
    // Antes o atalho entrava no texto do filtro, e a saída era declarar
    // `textValue` em todo comando com tecla. Ensinar esse passo agora seria
    // ensinar um contorno para um defeito que não existe mais.
    for (const code of [
      commandPlaygroundSource(),
      commandCheckedItemSource(),
      commandWithShortcutsSource(),
      commandPaletteSource(),
      commandDemoPaletteSource(),
    ]) {
      expect(code).not.toContain('textValue');
    }
  });

  it('a lista vem sem `tabindex` escrito: ela não é parada de Tab', () => {
    for (const code of [
      commandPlaygroundSource(),
      commandPaletteSource(),
      commandDemoInlineSource(),
      commandDemoPaletteSource(),
    ]) {
      expect(code).not.toContain('tabindex');
    }
  });
});
