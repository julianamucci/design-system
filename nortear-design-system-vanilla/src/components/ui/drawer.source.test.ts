import { describe, expect, it } from 'vitest';
import {
  drawerComFormularioSnippet,
  drawerSnippet,
  drawerSource,
  drawerSourceCom,
} from './drawer.source';

describe('drawerSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = drawerSnippet();
    expect(código).toContain("import { createDrawer } from '@/components/ui/drawer';");
    expect(código).toContain('createDrawer({');
    // A prova aqui NÃO é `not.toContain('data-slot=')` como nos outros
    // componentes: o snippet do Drawer PRECISA falar de `data-slot="drawer-close"`,
    // que é o fechador explícito desta fábrica. O que não pode aparecer é o
    // markup que o renderer despejaria.
    expect(código).not.toContain('data-slot="drawer-content"');
    expect(código).not.toContain('aria-modal');
    expect(código).not.toContain('data-vaul-drawer-direction');
  });

  it('o nome do painel sai do título, e não de um apelido inventado', () => {
    // A fábrica não tem opção de nome acessível: `aria-labelledby` aponta para o
    // título. Um `ariaLabel` no snippet seria API que não existe.
    const código = drawerSnippet({ title: 'Editar perfil' });
    expect(código).toContain("title: 'Editar perfil'");
    expect(código).not.toContain('ariaLabel');
  });

  it('mostra o fechador explícito, que é o que liga o botão ao fechamento', () => {
    const código = drawerSnippet();
    expect(código).toContain("acao1.dataset.slot = 'drawer-close';");
    expect(código).toContain('footer: rodape');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = drawerSnippet();
    expect(código).not.toContain('direction');
    expect(código).not.toContain('dismissible');
    expect(código).not.toContain('modal');
    expect(código).not.toContain('onOpenChange');
    expect(código).not.toContain("variant: 'default'");
  });

  it('a borda de baixo é o padrão e não entra; as outras entram', () => {
    expect(drawerSnippet({ direction: 'bottom' })).not.toContain('direction');
    expect(drawerSnippet({ direction: 'right' })).toContain("direction: 'right'");
  });

  it('mostra as opções quando a story as usa', () => {
    const código = drawerSnippet({ dismissible: false, modal: false });
    expect(código).toContain('dismissible: false');
    expect(código).toContain('modal: false');
  });

  it('não inventa `defaultOpen`: abrir sem clique é comando da raiz', () => {
    // A fábrica não tem essa opção. O que existe são os verbos devolvidos pela
    // raiz, e é isso que o snippet mostra.
    const código = drawerSnippet({ defaultOpen: true });
    expect(código).not.toContain('defaultOpen');
    expect(código).toContain('gaveta.open();');
    expect(drawerSnippet()).not.toContain('gaveta.open()');
  });

  it('lista vazia de ações é gaveta SEM rodapé', () => {
    const código = drawerSnippet({ footer: [] });
    expect(código).not.toContain('footer');
    expect(código).not.toContain('drawer-close');
  });

  it('não vaza helper de story', () => {
    const código = drawerSnippet();
    expect(código).not.toContain('buildDrawerEl');
    expect(código).not.toContain('buildBase');
    expect(código).not.toContain('buildFooter');
    expect(código).not.toContain('buildWrapper');
    expect(código).not.toContain('limparPortaisDoDrawer');
  });

  it('ignora um callback que não seja escrito como texto', () => {
    const código = drawerSnippet({ onOpenChange: (() => {}) as unknown as string });
    expect(código).not.toContain('onOpenChange');
  });
});

describe('drawerSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = drawerSource('<div data-slot="drawer-content">', {});
    const comArgs = drawerSource('<div data-slot="drawer-content">', {
      args: { direction: 'left', triggerLabel: 'Abrir menu' },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain("direction: 'left'");
    expect(comArgs).toContain("label: 'Abrir menu'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(drawerSource('<div role="dialog" data-vaul-drawer-direction="bottom">', {})).not.toContain(
      'role="dialog"',
    );
  });
});

describe('drawerSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = drawerSourceCom({ direction: 'top', dismissible: false });
    const código = transform('', { args: { direction: 'left' } });
    expect(código).toContain("direction: 'top'");
    expect(código).toContain('dismissible: false');
  });
});

describe('drawerComFormularioSnippet', () => {
  it('constrói o corpo com a fábrica de campo, e não com rótulo e controle soltos', () => {
    const código = drawerComFormularioSnippet({
      campos: [{ label: 'E-mail', type: 'email', value: 'maria@exemplo.com' }],
    });
    expect(código).toContain("import { createFormField } from '@/components/ui/form';");
    expect(código).toContain("input: createInput({ type: 'email', value: 'maria@exemplo.com' })");
    expect(código).toContain('content: formulario');
    expect(código).not.toContain('buildField');
  });

  it('mantém o fechador do rodapé, que a gaveta precisa para fechar por dentro', () => {
    expect(drawerComFormularioSnippet()).toContain("acao1.dataset.slot = 'drawer-close';");
  });
});
