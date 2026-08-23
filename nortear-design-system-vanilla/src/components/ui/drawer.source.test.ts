import { describe, expect, it } from 'vitest';
import {
  drawerWithFormSnippet,
  drawerSnippet,
  drawerSource,
  drawerSourceWith,
} from './drawer.source';

describe('drawerSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = drawerSnippet();
    expect(code).toContain("import { createDrawer } from '@/components/ui/drawer';");
    expect(code).toContain('createDrawer({');
    // A prova aqui NÃO é `not.toContain('data-slot=')` como nos outros
    // componentes: o snippet do Drawer PRECISA falar de `data-slot="drawer-close"`,
    // que é o fechador explícito desta fábrica. O que não pode aparecer é o
    // markup que o renderer despejaria.
    expect(code).not.toContain('data-slot="drawer-content"');
    expect(code).not.toContain('aria-modal');
    expect(code).not.toContain('data-vaul-drawer-direction');
  });

  it('o nome do painel sai do título, e não de um apelido inventado', () => {
    // A fábrica não tem opção de nome acessível: `aria-labelledby` aponta para o
    // título. Um `ariaLabel` no snippet seria API que não existe.
    const code = drawerSnippet({ title: 'Editar perfil' });
    expect(code).toContain("title: 'Editar perfil'");
    expect(code).not.toContain('ariaLabel');
  });

  it('mostra o fechador explícito, que é o que liga o botão ao fechamento', () => {
    const code = drawerSnippet();
    expect(code).toContain("acao1.dataset.slot = 'drawer-close';");
    expect(code).toContain('footer: rodape');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = drawerSnippet();
    expect(code).not.toContain('direction');
    expect(code).not.toContain('dismissible');
    expect(code).not.toContain('modal');
    expect(code).not.toContain('onOpenChange');
    expect(code).not.toContain("variant: 'default'");
  });

  it('a borda de baixo é o padrão e não entra; as outras entram', () => {
    expect(drawerSnippet({ direction: 'bottom' })).not.toContain('direction');
    expect(drawerSnippet({ direction: 'right' })).toContain("direction: 'right'");
  });

  it('mostra as opções quando a story as usa', () => {
    const code = drawerSnippet({ dismissible: false, modal: false });
    expect(code).toContain('dismissible: false');
    expect(code).toContain('modal: false');
  });

  it('não inventa `defaultOpen`: abrir sem clique é comando da raiz', () => {
    // A fábrica não tem essa opção. O que existe são os verbos devolvidos pela
    // raiz, e é isso que o snippet mostra.
    const code = drawerSnippet({ defaultOpen: true });
    expect(code).not.toContain('defaultOpen');
    expect(code).toContain('gaveta.open();');
    expect(drawerSnippet()).not.toContain('gaveta.open()');
  });

  it('lista vazia de ações é gaveta SEM rodapé', () => {
    const code = drawerSnippet({ footer: [] });
    expect(code).not.toContain('footer');
    expect(code).not.toContain('drawer-close');
  });

  it('não vaza helper de story', () => {
    const code = drawerSnippet();
    expect(code).not.toContain('buildDrawerEl');
    expect(code).not.toContain('buildBase');
    expect(code).not.toContain('buildFooter');
    expect(code).not.toContain('buildWrapper');
    expect(code).not.toContain('limparPortaisDoDrawer');
  });

  it('ignora um callback que não seja escrito como texto', () => {
    const code = drawerSnippet({ onOpenChange: (() => {}) as unknown as string });
    expect(code).not.toContain('onOpenChange');
  });
});

describe('drawerSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = drawerSource('<div data-slot="drawer-content">', {});
    const withArgs = drawerSource('<div data-slot="drawer-content">', {
      args: { direction: 'left', triggerLabel: 'Abrir menu' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("direction: 'left'");
    expect(withArgs).toContain("label: 'Abrir menu'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(drawerSource('<div role="dialog" data-vaul-drawer-direction="bottom">', {})).not.toContain(
      'role="dialog"',
    );
  });
});

describe('drawerSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = drawerSourceWith({ direction: 'top', dismissible: false });
    const code = transform('', { args: { direction: 'left' } });
    expect(code).toContain("direction: 'top'");
    expect(code).toContain('dismissible: false');
  });
});

describe('drawerComFormularioSnippet', () => {
  it('constrói o corpo com a fábrica de campo, e não com rótulo e controle soltos', () => {
    const code = drawerWithFormSnippet({
      fields: [{ label: 'E-mail', type: 'email', value: 'maria@exemplo.com' }],
    });
    expect(code).toContain("import { createFormField } from '@/components/ui/form';");
    expect(code).toContain("input: createInput({ type: 'email', value: 'maria@exemplo.com' })");
    expect(code).toContain('content: formulario');
    expect(code).not.toContain('buildField');
  });

  it('mantém o fechador do rodapé, que a gaveta precisa para fechar por dentro', () => {
    expect(drawerWithFormSnippet()).toContain("acao1.dataset.slot = 'drawer-close';");
  });
});
