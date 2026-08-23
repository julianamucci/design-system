import { describe, expect, it } from 'vitest';
import {
  commandEmDialogSnippet,
  commandEmPopoverSnippet,
  commandSnippet,
  commandSource,
  commandSourceWith,
} from './command.source';

describe('commandSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = commandSnippet();
    expect(code).toContain("import { createCommand } from '@/components/ui/command';");
    expect(code).toContain('createCommand({');
    expect(code).toContain("document.querySelector('#app')?.append(paleta);");
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="listbox"');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = commandSnippet();
    expect(code).not.toContain('placeholder');
    expect(code).not.toContain('emptyMessage');
    expect(code).not.toContain('onSelect');
  });

  it('mostra os textos quando a story os troca', () => {
    const code = commandSnippet({
      placeholder: 'Buscar componente...',
      emptyMessage: 'Nenhum resultado encontrado.',
    });
    expect(code).toContain("placeholder: 'Buscar componente...'");
    expect(code).toContain("emptyMessage: 'Nenhum resultado encontrado.'");
  });

  it('agrupa os itens por padrão e desagrupa quando o control pede', () => {
    expect(commandSnippet()).toContain("group: 'Componentes'");
    expect(commandSnippet({ showGroups: false })).not.toContain('group:');
  });

  it('mostra as chaves de item que a story exercita', () => {
    const code = commandSnippet({
      items: [
        { value: 'novo', label: 'Novo arquivo', shortcut: '⌘N' },
        { type: 'separator' },
        { value: 'claro', label: 'Claro', checked: true },
        { value: 'arquivar', label: 'Arquivar', disabled: true },
      ],
    });
    expect(code).toContain("shortcut: '⌘N'");
    expect(code).toContain("{ type: 'separator' }");
    expect(code).toContain('checked: true');
    expect(code).toContain('disabled: true');
  });

  it('não vaza o andaime das stories', () => {
    const code = commandSnippet();
    expect(code).not.toContain('montarInline');
    expect(code).not.toContain('buildItems');
    expect(code).not.toContain('ITENS_AGRUPADOS');
    expect(code).not.toContain('WRAPPER');
  });

  it('nunca imprime a função que os args trazem no lugar do corpo do callback', () => {
    const code = commandSnippet({ onSelect: (() => undefined) as unknown as string });
    expect(code).not.toContain('onSelect');
  });
});

describe('commandEmPopoverSnippet', () => {
  it('mostra a sub-fábrica que é o assunto da composição', () => {
    const code = commandEmPopoverSnippet();
    expect(code).toContain("import { createPopover } from '@/components/ui/popover';");
    expect(code).toContain('createPopover({');
    expect(code).toContain('trigger: gatilho');
    expect(code).toContain('content: paleta');
    // O papel é de quem compõe: sem ele o leitor anuncia só "botão".
    expect(code).toContain("gatilho.setAttribute('role', 'combobox');");
  });
});

describe('commandEmDialogSnippet', () => {
  it('mostra o diálogo e o atalho global, que é de quem consome', () => {
    const code = commandEmDialogSnippet();
    expect(code).toContain("import { createDialog } from '@/components/ui/dialog';");
    expect(code).toContain('headerHidden: true');
    expect(code).toContain('showCloseButton: false');
    expect(code).toContain("window.addEventListener('keydown'");
    expect(code).not.toContain('dialog.fixtures');
  });
});

describe('commandSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = commandSource('<div data-slot="command">', {});
    const withArgs = commandSource('<div data-slot="command">', {
      args: { placeholder: 'Buscar comando...', showGroups: false },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("placeholder: 'Buscar comando...'");
    expect(withArgs).not.toContain('group:');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(commandSource('<div data-slot="command" class="nds-command">', {})).not.toContain(
      'class="nds-command"',
    );
  });
});

describe('commandSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = commandSourceWith({
      items: [{ value: 'sair', label: 'Sair' }],
    });
    const code = transform('', { args: { placeholder: 'Buscar comando...' } });
    expect(code).toContain("placeholder: 'Buscar comando...'");
    expect(code).toContain("{ value: 'sair', label: 'Sair' }");
    expect(code).not.toContain("label: 'Button'");
  });
});
