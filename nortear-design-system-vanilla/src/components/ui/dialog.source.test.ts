import { describe, expect, it } from 'vitest';
import {
  dialogWithBodyScrollableSnippet,
  dialogWithFormSnippet,
  dialogSnippet,
  dialogSource,
  dialogSourceWith,
} from './dialog.source';

describe('dialogSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = dialogSnippet();
    expect(código).toContain("import { createDialog } from '@/components/ui/dialog';");
    expect(código).toContain('createDialog({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('aria-modal');
  });

  it('o nome do diálogo sai do título, e não de um apelido inventado', () => {
    // A fábrica não tem opção de nome acessível: `aria-labelledby` aponta para o
    // título, e é ele o nome. Um `ariaLabel` no snippet seria API que não existe.
    const código = dialogSnippet({ title: 'Editar perfil' });
    expect(código).toContain("title: 'Editar perfil'");
    expect(código).not.toContain('ariaLabel');
    expect(código).not.toContain('aria-label');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = dialogSnippet();
    // O X do canto é desenhado por padrão, e o diálogo não avisa ninguém a menos
    // que peçam.
    expect(código).not.toContain('showCloseButton');
    expect(código).not.toContain('onOpenChange');
    expect(código).not.toContain('headerHidden');
    // `default` é a ênfase padrão do botão.
    expect(código).not.toContain("variant: 'default'");
  });

  it('mostra as opções quando a story as usa', () => {
    const código = dialogSnippet({
      showCloseButton: false,
      footer: [
        { label: 'Cancelar', variant: 'outline' },
        { label: 'Remover', variant: 'destructive' },
      ],
    });
    expect(código).toContain('showCloseButton: false');
    expect(código).toContain("createButton({ variant: 'destructive', label: 'Remover' })");
  });

  it('lista vazia de ações é diálogo SEM rodapé, e não rodapé vazio', () => {
    const código = dialogSnippet({ footer: [] });
    expect(código).not.toContain('footer');
  });

  it('as ações saem como lista, e não embrulhadas num elemento', () => {
    // Quem faz o arranjo é `.nds-dialog-footer`, e para isso os botões precisam
    // ser filhos DIRETOS dele.
    const código = dialogSnippet();
    expect(código).toContain('footer: [');
    expect(código).toContain("createButton({ variant: 'outline', label: 'Cancelar' })");
  });

  it('não vaza helper de story', () => {
    const código = dialogSnippet();
    expect(código).not.toContain('makeFooter');
    expect(código).not.toContain('makeBody');
    expect(código).not.toContain('buildField');
    expect(código).not.toContain('buildPlayground');
    expect(código).not.toContain('abrirNaMontagem');
  });

  it('ignora um callback que não seja escrito como texto', () => {
    // `ctx.args` chega do Storybook, e o control de callback do Playground é um
    // espião de teste: interpolá-lo despejaria o corpo do mock no snippet.
    const código = dialogSnippet({ onOpenChange: (() => {}) as unknown as string });
    expect(código).not.toContain('onOpenChange');
  });

  it('mostra o callback quando ele vem escrito', () => {
    const código = dialogSnippet({ onOpenChange: '(aberto) => registrar(aberto)' });
    expect(código).toContain('onOpenChange: (aberto) => registrar(aberto)');
  });
});

describe('dialogSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = dialogSource('<div data-slot="dialog-content">', {});
    const withArgs = dialogSource('<div data-slot="dialog-content">', {
      args: { triggerLabel: 'Remover item', showCloseButton: false },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("label: 'Remover item'");
    expect(withArgs).toContain('showCloseButton: false');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(dialogSource('<div role="dialog" aria-modal="true">', {})).not.toContain('role="dialog"');
  });
});

describe('dialogSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = dialogSourceWith({ title: 'Remover item da lista?', footer: [] });
    const código = transform('', { args: { title: 'Editar perfil' } });
    expect(código).toContain("title: 'Remover item da lista?'");
    expect(código).not.toContain('footer');
  });
});

describe('dialogComFormularioSnippet', () => {
  it('constrói o corpo com a fábrica de campo, e não com rótulo e controle soltos', () => {
    // `createFormField` é quem fecha o par rótulo ↔ controle e gera o id que
    // falta; um `<label>` cru pareceria igual e não faria nada disso.
    const código = dialogWithFormSnippet({
      campos: [{ label: 'Nome', value: 'Maria Souza' }],
    });
    expect(código).toContain("import { createFormField } from '@/components/ui/form';");
    expect(código).toContain("label: 'Nome'");
    expect(código).toContain("input: createInput({ value: 'Maria Souza' })");
    expect(código).toContain('content: formulario');
    expect(código).not.toContain('createLabel');
    expect(código).not.toContain('buildField');
  });

  it('omite o tipo quando ele já é o padrão do controle', () => {
    expect(dialogWithFormSnippet({ campos: [{ label: 'Nome', type: 'text' }] })).not.toContain(
      'type:',
    );
    expect(
      dialogWithFormSnippet({ campos: [{ label: 'E-mail', type: 'email' }] }),
    ).toContain("type: 'email'");
  });
});

describe('dialogComCorpoRolavelSnippet', () => {
  it('mostra a classe de rolagem e a costura de teclado que ela exige', () => {
    const código = dialogWithBodyScrollableSnippet({ paragrafos: 12 });
    expect(código).toContain('nds-dialog-body-scroll');
    expect(código).toContain("corpo.setAttribute('role', 'region')");
    expect(código).toContain('corpo.tabIndex = 0');
    expect(código).toContain("corpo.setAttribute('aria-label', 'Conteúdo rolável')");
    expect(código).toContain('i <= 12');
  });

  it('continua sendo a chamada da fábrica, e não o painel renderizado', () => {
    const código = dialogWithBodyScrollableSnippet();
    expect(código).toContain('createDialog({');
    expect(código).not.toContain('data-slot=');
  });
});
