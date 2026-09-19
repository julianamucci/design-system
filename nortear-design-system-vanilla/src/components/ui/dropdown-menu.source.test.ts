import { describe, expect, it } from 'vitest';
import {
  dropdownMenuControlledSnippet,
  dropdownMenuSnippet,
  dropdownMenuSource,
  dropdownMenuSourceControlled,
  dropdownMenuSourceWith,
} from './dropdown-menu.source';

describe('dropdownMenuControladoSnippet', () => {
  it('abre por `open()`, e não por um clique encenado no gatilho', () => {
    const code = dropdownMenuControlledSnippet();
    expect(code).toContain('menu.open()');
    expect(code).toContain('onOpenChange:');
    expect(code).not.toMatch(/\.click\(\)/);
  });

  it('e NÃO ensina o gatilho escondido', () => {
    // A story montava um `<button>` com `.nds-sr-only`, `tabindex="-1"` e
    // `aria-hidden="true"` só para clicar nele por código — e o menu ancorava
    // naquele retângulo de 1px fora da tela.
    const code = dropdownMenuControlledSnippet();
    expect(code).not.toContain('nds-sr-only');
    expect(code).not.toContain('aria-hidden');
    expect(code).not.toContain('tabindex');
  });

  it('o gatilho FICA: ele é a âncora do menu, não um alvo de clique', () => {
    // Ao contrário do Sheet e do Dialog, aqui `trigger` continua obrigatório —
    // é dele que o menu desce e é ele que carrega o contrato ARIA.
    const code = dropdownMenuControlledSnippet();
    expect(code).toContain('const gatilho = createButton(');
    expect(code).toContain('trigger: gatilho');
  });
});

describe('dropdownMenuSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = dropdownMenuSnippet();
    expect(code).toContain(
      "import { createDropdownMenu } from '@/components/ui/dropdown-menu';",
    );
    expect(code).toContain('createDropdownMenu({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="menu"');
    expect(code).not.toContain('aria-haspopup');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = dropdownMenuSnippet();
    // bottom/start/4/modal são os padrões, e documentação não ensina a repetir
    // o valor que a fábrica já assume.
    expect(code).not.toContain('side:');
    expect(code).not.toContain('align:');
    expect(code).not.toContain('sideOffset');
    expect(code).not.toContain('modal');
    expect(code).not.toContain('defaultOpen');
    expect(code).not.toContain('onOpenChange');
    // `item` é o tipo padrão do item, e `default` a ênfase padrão.
    expect(code).not.toContain("type: 'item'");
    expect(code).not.toContain("variant: 'default'");
  });

  it('mostra lado, encosto e vão quando eles saem do padrão', () => {
    const code = dropdownMenuSnippet({ side: 'top', align: 'end', sideOffset: 12, modal: false });
    expect(code).toContain("side: 'top'");
    expect(code).toContain("align: 'end'");
    expect(code).toContain('sideOffset: 12');
    expect(code).toContain('modal: false');
    // O vão padrão continua fora quando ninguém o muda.
    expect(dropdownMenuSnippet({ sideOffset: 4 })).not.toContain('sideOffset');
  });

  it('a lista é dado: cada tipo de item aparece com a chave que o define', () => {
    const code = dropdownMenuSnippet({
      items: [
        { type: 'label', label: 'Colunas visíveis' },
        { type: 'checkbox', label: 'Nome', value: 'nome', indeterminate: true },
        {
          type: 'radio-group',
          value: 'light',
          options: [
            { value: 'light', label: 'Claro' },
            { value: 'dark', label: 'Escuro' },
          ],
        },
        { type: 'separator' },
        { label: 'Excluir conta', value: 'delete', variant: 'destructive' },
        { label: 'Copiar', value: 'copy', shortcut: 'Ctrl+C' },
        { label: 'Arquivar', value: 'archive', disabled: true },
      ],
    });
    expect(code).toContain("{ type: 'label', label: 'Colunas visíveis' }");
    expect(code).toContain(
      "{ type: 'checkbox', label: 'Nome', value: 'nome', indeterminate: true }",
    );
    // A escolha única é UM grupo com as opções dentro (D16), e não itens soltos
    // amarrados por um nome — a forma que o `createMenubar` já tinha.
    expect(code).toContain(
      "{ type: 'radio-group', value: 'light', " +
        "options: [{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }] }",
    );
    expect(code).not.toContain("type: 'radio'");
    expect(code).not.toContain('group:');
    expect(code).toContain("{ type: 'separator' }");
    expect(code).toContain("variant: 'destructive'");
    expect(code).toContain("shortcut: 'Ctrl+C'");
    expect(code).toContain('disabled: true');
  });

  it('o submenu leva a própria lista, aninhada dentro do item que o abre', () => {
    // A hierarquia é o assunto deste item: sem os `items` do filho o snippet
    // ensinaria um `type: 'submenu'` que não abre coisa nenhuma.
    const code = dropdownMenuSnippet({
      triggerLabel: 'Arquivo',
      items: [
        { label: 'Renomear', value: 'rename' },
        {
          type: 'submenu',
          label: 'Exportar',
          value: 'export',
          items: [
            { label: 'PDF', value: 'pdf' },
            { label: 'CSV', value: 'csv' },
          ],
        },
      ],
    });
    expect(code).toContain(
      "{ type: 'submenu', label: 'Exportar', value: 'export', " +
        "items: [{ label: 'PDF', value: 'pdf' }, { label: 'CSV', value: 'csv' }] }",
    );
    // O filho segue as mesmas regras do pai: item de ação não repete o tipo
    // padrão nem dentro do submenu.
    expect(code).not.toContain("type: 'item'");
  });

  it('o recuo entra só quando pedido, no item, no rótulo e no sub-gatilho', () => {
    const code = dropdownMenuSnippet({
      items: [
        { type: 'label', label: 'Ações', inset: true },
        { label: 'Editar', value: 'edit', inset: true },
        { type: 'submenu', label: 'Exportar', value: 'export', inset: true, items: [{ label: 'PDF', value: 'pdf' }] },
        { label: 'Copiar', value: 'copy', inset: false },
      ],
    });
    expect(code).toContain("{ type: 'label', label: 'Ações', inset: true }");
    expect(code).toContain("{ label: 'Editar', value: 'edit', inset: true }");
    expect(code).toContain("{ type: 'submenu', label: 'Exportar', value: 'export', inset: true, ");
    // `false` é o padrão da fábrica: escrito, ensinaria a repeti-lo.
    expect(code).toContain("{ label: 'Copiar', value: 'copy' }");
  });

  it('o item de ação simples não repete o tipo padrão', () => {
    expect(dropdownMenuSnippet({ items: [{ label: 'Perfil', value: 'profile' }] })).toContain(
      "{ label: 'Perfil', value: 'profile' }",
    );
  });

  it('não vaza helper de story', () => {
    const code = dropdownMenuSnippet();
    expect(code).not.toContain('buildMenuEl');
    expect(code).not.toContain('buildBase');
    expect(code).not.toContain('mount(');
    expect(code).not.toContain('wrap(');
  });

  it('ignora um callback que não seja escrito como texto', () => {
    const code = dropdownMenuSnippet({ onOpenChange: (() => {}) as unknown as string });
    expect(code).not.toContain('onOpenChange');
  });
});

describe('dropdownMenuSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = dropdownMenuSource('<ul role="menu">', {});
    const withArgs = dropdownMenuSource('<ul role="menu">', {
      args: { side: 'top', align: 'end', triggerLabel: 'Abrir para cima' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("side: 'top'");
    expect(withArgs).toContain("align: 'end'");
    expect(withArgs).toContain("label: 'Abrir para cima'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(dropdownMenuSource('<ul role="menu" data-side="bottom">', {})).not.toContain(
      'data-side=',
    );
  });
});

/**
 * O transform da story `Controlled`, e não só o construtor que ele embrulha.
 *
 * Ele era um export que este arquivo NÃO cobria: a varredura transversal
 * (`source-snippets.test.ts`) o chamava com os args padrão e o achava honesto,
 * e o teste do componente parava no `dropdownMenuControlledSnippet`. O que
 * ficava sem portão é justamente o que o transform acrescenta — a fusão das
 * opções FIXAS da story com os `ctx.args` do Storybook, que é onde as duas
 * outras transforms deste arquivo já tiveram defeito.
 */
describe('dropdownMenuSourceControlled', () => {
  it('leva as opções fixas da story para dentro do trecho comandado', () => {
    const transform = dropdownMenuSourceControlled({
      triggerLabel: 'Ações',
      items: [
        { label: 'Comando A', value: 'a' },
        { label: 'Comando B', value: 'b' },
      ],
    });
    const code = transform('', { args: { triggerLabel: 'Abrir menu' } });
    // A opção fixa vence o control: é a story que sabe o que está na tela.
    expect(code).toContain("label: 'Ações'");
    expect(code).toContain("{ label: 'Comando A', value: 'a' },");
    expect(code).not.toContain("label: 'Perfil'");
    // E continua sendo o trecho COMANDADO — o verbo público, não um clique
    // encenado num gatilho escondido.
    expect(code).toContain('menu.open()');
    expect(code).toContain('const gatilho = createButton(');
    expect(code).not.toContain('nds-sr-only');
  });

  it('sem opções fixas cai na lista canônica, como o construtor', () => {
    const code = dropdownMenuSourceControlled()('', {});
    expect(code).toContain("{ type: 'label', label: 'Conta' },");
    expect(code).toContain('onOpenChange:');
  });
});

describe('dropdownMenuSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = dropdownMenuSourceWith({
      side: 'top',
      items: [{ label: 'Renomear', value: 'rename' }],
    });
    const code = transform('', { args: { side: 'bottom', triggerLabel: 'Abrir menu' } });
    expect(code).toContain("side: 'top'");
    expect(code).toContain("{ label: 'Renomear', value: 'rename' }");
    expect(code).not.toContain("label: 'Perfil'");
  });
});
