import { describe, expect, it } from 'vitest';
import {
  commandEmptyStateSource,
  commandItemCheckedSource,
  commandItemDisabledSource,
  commandLongListSource,
  commandPaletteSource,
  commandSource,
  commandWithDisabledItemsSource,
  commandWithGroupsSource,
  commandWithSeparatorSource,
  commandWithShortcutsSource,
} from './command.source';

/**
 * Todo construtor do módulo. A lista é FECHADA e o caso logo abaixo a confere
 * contra os exports: construtor novo que não entrar aqui reprova, em vez de
 * ficar de fora das guardas transversais em silêncio.
 */
const ALL_BUILDERS = {
  commandSource: () => commandSource(),
  commandWithGroupsSource,
  commandEmptyStateSource,
  commandItemDisabledSource,
  commandItemCheckedSource,
  commandLongListSource,
  commandWithSeparatorSource,
  commandWithShortcutsSource,
  commandWithDisabledItemsSource,
  commandPaletteSource,
} satisfies Record<string, () => string>;

describe('o conjunto de construtores', () => {
  it('toda função exportada está na lista das guardas', async () => {
    const mod = await import('./command.source');
    const exported = Object.entries(mod)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort();
    expect(exported).toEqual(Object.keys(ALL_BUILDERS).sort());
  });
});

describe('commandSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const output = commandSource();
    expect(output).toContain('} from "@/components/ui/command";');
    expect(output).not.toContain('cmdk');
  });

  it('monta o par que separa a paleta de um menu: campo de busca e lista', () => {
    const output = commandSource();
    expect(output).toContain('<CommandInput placeholder="Buscar componente..." />');
    expect(output).toContain('<CommandList>');
  });

  it('põe a mensagem de vazio FORA da lista, onde a região viva pode morar', () => {
    // `role="status"` não é filho permitido de `role="listbox"` (só `option` e
    // `group` são), e é como `role="status"` que a mensagem anuncia a busca sem
    // resultado. Snippet com ela dentro da lista ensinaria o defeito.
    const output = commandSource();
    const endList = output.indexOf('</CommandList>');
    const emptyAt = output.indexOf('<CommandEmpty>');
    expect(endList).toBeGreaterThan(-1);
    expect(emptyAt).toBeGreaterThan(endList);
  });

  it('nomeia cada grupo pelo cabeçalho, e separa os dois blocos', () => {
    const output = commandSource();
    expect(output).toContain('<CommandGroup heading="Componentes">');
    expect(output).toContain('<CommandGroup heading="Utilitários">');
    expect(output).toContain('<CommandSeparator />');
  });

  it('ensina a lista da story: cinco comandos, sem ícone', () => {
    // A story do Playground desenha a lista do Vanilla, sem ícone nenhum. O
    // snippet com lucide ao lado de uma story sem ícone ensinava outra paleta.
    const output = commandSource();
    expect(output.match(/<CommandItem /g)).toHaveLength(5);
    expect(output).not.toContain('lucide-react');
    expect(output).not.toMatch(/Icon \/>/);
  });

  it('omite loop e shouldFilter quando são o padrão do componente', () => {
    const output = commandSource(undefined, { args: { loop: false, shouldFilter: true } });
    expect(output).toContain('<Command>');
    expect(output).not.toContain('loop');
    expect(output).not.toContain('shouldFilter');
  });

  it('escreve as duas quando diferem do padrão', () => {
    const output = commandSource(undefined, { args: { loop: true, shouldFilter: false } });
    expect(output).toContain('<Command loop shouldFilter={false}>');
  });

  it('não deixa o espião do onSelect virar código', () => {
    const spy = (() => 'CORPO_DO_MOCK') as never;
    const output = commandSource(undefined, { args: { loop: spy, shouldFilter: spy } });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).toContain('<Command>');
  });
});

describe('todo snippet do módulo', () => {
  it('mantém o vazio fora da lista', () => {
    // A guarda de cima cobre só o snippet canônico. Sem esta, um snippet novo
    // (ou um já existente, editado) volta a ensinar a mensagem dentro da lista
    // sem que nada reprove: o defeito não compila diferente.
    for (const [name, build] of Object.entries(ALL_BUILDERS)) {
      const output = build();
      expect(output.indexOf('<CommandEmpty>'), name).toBeGreaterThan(
        output.indexOf('</CommandList>'),
      );
    }
  });

  it('importa só as peças que usa', () => {
    // Peça importada e não usada é ruído para quem cola; peça usada e não
    // importada não compila.
    const PIECES = [
      'CommandDialog',
      'CommandEmpty',
      'CommandGroup',
      'CommandInput',
      'CommandItem',
      'CommandList',
      'CommandSeparator',
      'CommandShortcut',
    ];
    for (const [name, build] of Object.entries(ALL_BUILDERS)) {
      const output = build();
      const importBlock = output.slice(0, output.indexOf('} from "@/components/ui/command";'));
      for (const piece of PIECES) {
        const imported = new RegExp(`\\b${piece},`).test(importBlock);
        const used = output.includes(`<${piece}`);
        expect(imported, `${name}: ${piece}`).toBe(used);
      }
    }
  });

  it('não ensina o andaime da story', () => {
    for (const [name, build] of Object.entries(ALL_BUILDERS)) {
      const output = build();
      expect(output, name).not.toContain('Demo');
      expect(output, name).not.toContain('fixtures');
      expect(output, name).not.toContain('storybook');
    }
  });
});

describe('variantes e estados', () => {
  it('com grupos ensina os sete comandos da story, em dois blocos', () => {
    const output = commandWithGroupsSource();
    expect(output.match(/<CommandItem /g)).toHaveLength(7);
    expect(output).toContain('<CommandItem value="twmerge">twMerge()</CommandItem>');
    expect(output.match(/<CommandGroup /g)).toHaveLength(2);
    expect(output).toContain('<CommandSeparator />');
  });

  it('sem resultados ensina três comandos num grupo sem cabeçalho', () => {
    // Item sem grupo mora num grupo SEM cabeçalho (contrato das cinco stacks,
    // 2026-09-10): a caixa dá o padding de que o raio aninhado depende.
    const output = commandEmptyStateSource();
    expect(output.match(/<CommandItem /g)).toHaveLength(3);
    expect(output.match(/<CommandGroup>/g)).toHaveLength(1);
    expect(output).not.toContain('heading=');
    expect(output).toContain('<CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>');
  });

  it('o desabilitado carrega a prop no ITEM, não na paleta', () => {
    const output = commandItemDisabledSource();
    expect(output).toContain('<CommandItem value="arquivar" disabled>');
    expect(output).not.toContain('<Command disabled');
    expect(output.match(/<CommandGroup>/g)).toHaveLength(1);
    expect(output).not.toContain('heading=');
  });

  it('o marcado publica os dois valores, e o caso em que o atalho esconde a marca', () => {
    const output = commandItemCheckedSource();
    expect(output).toContain('<CommandItem value="claro" checked>');
    expect(output).toContain('checked={false}');
    // É o mesmo comando da story: marcado E com atalho — o caso que a folha
    // resolve escondendo a marca.
    expect(output).toContain('<CommandItem value="sistema" checked>');
    expect(output).toContain('<CommandShortcut>Ctrl+S</CommandShortcut>');
  });

  it('a lista longa itera os trinta nomes, com a origem declarada', () => {
    const output = commandLongListSource();
    const start = output.indexOf('const COMPONENTES = [');
    expect(start).toBeGreaterThan(-1);
    const list = output.slice(start, output.indexOf('];', start));
    expect(list.match(/"[A-Za-z]+"/g)).toHaveLength(30);
    expect(output).toContain('{COMPONENTES.map((nome) => (');
    expect(output).toContain('value={nome.toLowerCase()}');
  });
});

describe('composições', () => {
  it('o traço separa dois blocos de uma lista sem grupos nomeados', () => {
    const output = commandWithSeparatorSource();
    // Dois grupos SEM cabeçalho, um de cada lado do traço — a forma da fábrica
    // do Vanilla.
    expect(output.match(/<CommandGroup>/g)).toHaveLength(2);
    expect(output).not.toContain('heading=');
    const separatorAt = output.indexOf('<CommandSeparator />');
    expect(separatorAt).toBeGreaterThan(output.indexOf('Abrir recente'));
    expect(separatorAt).toBeGreaterThan(output.indexOf('</CommandGroup>'));
    expect(separatorAt).toBeLessThan(output.indexOf('Sair'));
  });

  it('o atalho mora dentro do comando e não sai da árvore de acessibilidade', () => {
    const output = commandWithShortcutsSource();
    expect(output).toContain('Salvar <CommandShortcut>Ctrl+S</CommandShortcut>');
    expect(output.match(/<CommandShortcut>/g)).toHaveLength(3);
    expect(output).toContain('<CommandItem value="preferencias">Preferências</CommandItem>');
    expect(output).not.toContain('aria-hidden');
  });

  it('os desabilitados são três, espalhados pelos dois grupos', () => {
    const output = commandWithDisabledItemsSource();
    expect(output.match(/<CommandItem /g)).toHaveLength(6);
    expect(output.match(/ disabled>/g)).toHaveLength(3);
  });

  it('a paleta nomeia o diálogo por title e description', () => {
    const output = commandPaletteSource();
    expect(output).toContain('title="Command Palette"');
    expect(output).toContain('description="Busque por um comando ou ação..."');
  });

  it('a dica do atalho mora DENTRO do gatilho, e o nome sai do texto visível', () => {
    // WCAG 2.5.3: `aria-label` diferente do que se lê quebra quem comanda por
    // voz — a pessoa diz "Buscar" e o botão se chama outra coisa.
    const output = commandPaletteSource();
    const trigger = output.slice(output.indexOf('<Button'), output.indexOf('</Button>'));
    expect(trigger).toMatch(/\}\s*>\s*Buscar\s*<kbd className="nds-kbd">Ctrl\+K<\/kbd>\s*$/);
    expect(output).not.toContain('aria-label');
  });

  it('o gatilho anuncia o diálogo que abre e se ele está aberto', () => {
    // O botão mora fora do CommandDialog: o Dialog não o marca como gatilho, e
    // quem declara os dois atributos é o call site.
    const output = commandPaletteSource();
    const trigger = output.slice(output.indexOf('<Button'), output.indexOf('</Button>'));
    expect(trigger).toContain('aria-haspopup="dialog"');
    expect(trigger).toContain('aria-expanded={aberta}');
  });

  it('o atalho global é listener de janela, com cleanup, e só abre', () => {
    // Sem o cleanup o listener sobrevive à desmontagem e passa a abrir uma
    // paleta que já saiu da tela.
    const output = commandPaletteSource();
    expect(output).toContain('window.addEventListener("keydown", aoTeclar);');
    expect(output).toContain('return () => window.removeEventListener("keydown", aoTeclar);');
    expect(output).toContain('evento.preventDefault();');
    expect(output).toContain('setAberta(true);');
    expect(output).not.toContain('setAberta((');
  });

  it('escolher um comando executa e fecha', () => {
    const output = commandPaletteSource();
    expect(output).toContain('setAberta(false);');
    expect(output.match(/onSelect=\{executar\}/g)).toHaveLength(3);
  });
});
