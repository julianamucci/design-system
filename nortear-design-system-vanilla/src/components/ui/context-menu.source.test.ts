import { describe, expect, it } from 'vitest';
import {
  contextMenuCleanupSnippet,
  contextMenuSnippet,
  contextMenuSource,
  contextMenuSourceCleanup,
  contextMenuSourceDarkPalette,
  contextMenuSourceItemDestructive,
  contextMenuSourceWith,
  contextMenuSourceWithShortcut,
} from './context-menu.source';

describe('contextMenuSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = contextMenuSnippet();
    expect(code).toContain(
      "import { createContextMenu } from '@/components/ui/context-menu';",
    );
    expect(code).toContain('createContextMenu({');
    expect(code).toContain("document.querySelector('#app')?.append(menu);");
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('nds-dropdown-menu-item');
  });

  it('omite o tipo padrão e as opções que a fábrica já assume', () => {
    const code = contextMenuSnippet();
    // `item` é o padrão de `type`: escrevê-lo em toda entrada seria ensinar a
    // repetir o default.
    expect(code).not.toContain("type: 'item'");
    expect(code).not.toContain('inset');
    expect(code).not.toContain('disabled');
    expect(code).not.toContain('radioValue');
  });

  it('monta a área com DOM curto, sem a sonda de teste', () => {
    const code = contextMenuSnippet();
    expect(code).toContain("const area = document.createElement('div');");
    expect(code).toContain('trigger: area');
    expect(code).not.toContain('criarAreaDeClique');
    expect(code).not.toContain('abrirPorGesto');
    expect(code).not.toContain('menuAberto');
  });

  it('acompanha os controls do menu canônico', () => {
    const completo = contextMenuSnippet();
    expect(completo).toContain("shortcut: 'Ctrl+E'");
    expect(completo).toContain("{ type: 'separator' },");
    expect(completo).toContain("variant: 'destructive'");

    const enxuto = contextMenuSnippet({
      showShortcuts: false,
      showSeparator: false,
      showDestructive: false,
    });
    expect(enxuto).not.toContain('shortcut');
    expect(enxuto).not.toContain('separator');
    expect(enxuto).not.toContain('destructive');
  });

  it('mostra as peças que a story exercita', () => {
    const code = contextMenuSnippet({
      radioValue: 'grid',
      items: [
        { type: 'label', label: 'Visualização', inset: true },
        { type: 'checkbox', label: 'Colunas', value: 'colunas', indeterminate: true },
        { type: 'radio', label: 'Grade', value: 'grid' },
        { label: 'Duplicar', value: 'off', disabled: true },
      ],
    });
    expect(code).toContain("radioValue: 'grid'");
    expect(code).toContain("type: 'label'");
    expect(code).toContain("type: 'checkbox'");
    expect(code).toContain("type: 'radio'");
    expect(code).toContain('indeterminate: true');
    expect(code).toContain('inset: true');
    expect(code).toContain('disabled: true');
  });

  it('recua o submenu dentro da entrada que o abre', () => {
    const code = contextMenuSnippet({
      items: [
        {
          type: 'submenu',
          label: 'Compartilhar',
          value: 'sub',
          items: [{ label: 'Por e-mail', value: 'por-email' }],
        },
      ],
    });
    expect(code).toContain('      items: [');
    expect(code).toContain("        { label: 'Por e-mail', value: 'por-email' },");
  });

  it('nunca imprime a função que os args trazem no lugar do corpo do callback', () => {
    const code = contextMenuSnippet({
      onOpenChange: (() => undefined) as unknown as string,
    });
    expect(code).not.toContain('onOpenChange');
  });
});

describe('contextMenuSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = contextMenuSource('<div data-slot="context-menu">', {});
    const withArgs = contextMenuSource('<div data-slot="context-menu">', {
      args: { triggerLabel: 'Área do documento', showDestructive: false },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("area.textContent = 'Área do documento';");
    expect(withArgs).not.toContain('destructive');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(
      contextMenuSource('<div data-slot="context-menu" style="display: contents">', {}),
    ).not.toContain('display: contents');
  });
});

/**
 * Cada caso aqui compara o snippet com o que a STORY do mesmo nome monta.
 *
 * Story sem transform própria herda a do `meta` e publica o menu canônico —
 * silenciosamente, porque o painel Code não chega ao DOM durante a play e
 * nenhuma suíte de navegador o alcança. Era assim em quatro stories deste
 * componente, cada uma mostrando uma coisa e publicando outra.
 */
describe('transforms por story', () => {
  it('WithShortcut publica os atalhos do preview, e não o menu canônico', () => {
    const code = contextMenuSourceWithShortcut('', {});
    expect(code).toContain("{ label: 'Editar', value: 'editar', shortcut: 'Ctrl+E' },");
    expect(code).toContain("{ label: 'Desfazer', value: 'undo', shortcut: 'Ctrl+Z' },");
    // "Duplicar" é a segunda entrada do menu canônico, e ela NÃO está no
    // preview desta story: é exatamente a troca que o defeito fazia.
    expect(code).not.toContain("label: 'Duplicar'");
  });

  it('ItemDestructive publica o rótulo por extenso que está na tela', () => {
    const code = contextMenuSourceItemDestructive('', {});
    expect(code).toContain(
      "{ label: 'Excluir permanentemente', value: 'perigo', shortcut: 'Delete', variant: 'destructive' },",
    );
    expect(code).not.toContain("{ label: 'Excluir', value:");
  });

  it('DarkPalette publica o item desabilitado que aparece na foto', () => {
    const code = contextMenuSourceDarkPalette('', {});
    expect(code).toContain("{ label: 'Duplicar', value: 'off', disabled: true },");
    // A paleta vem do tema, não da chamada: nada de opção inventada no snippet.
    expect(code).not.toContain('dark');
    expect(code).not.toContain('theme');
  });

  it('ListenerCleanup publica o menu da sonda e o caminho de saída', () => {
    const code = contextMenuSourceCleanup('', {});
    expect(code).toContain("area.textContent = 'Área com menu de contexto';");
    expect(code).toContain("{ label: 'Copiar', value: 'copy' },");
    expect(code).toContain("{ label: 'Colar', value: 'paste' },");
    // O assunto da story é o CICLO, e é ele que o trecho copiável tem de
    // ensinar — sem esta linha o snippet seria o de qualquer outra story.
    expect(code).toContain('menu.destroy();');
  });

  it('o snippet da limpeza ainda respeita o rótulo que os controls trazem', () => {
    const code = contextMenuCleanupSnippet({ triggerLabel: 'Área do documento' });
    expect(code).toContain("area.textContent = 'Área do documento';");
    expect(code).toContain('menu.destroy();');
  });
});

describe('contextMenuSourceCom', () => {
  it('sobrepõe os args da story com as entradas fixas', () => {
    const transform = contextMenuSourceWith({
      items: [{ type: 'checkbox', label: 'Mostrar grade', value: 'grade', checked: false }],
    });
    const code = transform('', { args: { triggerLabel: 'Área do documento' } });
    expect(code).toContain("area.textContent = 'Área do documento';");
    expect(code).toContain('checked: false');
    expect(code).not.toContain("label: 'Editar'");
  });
});
