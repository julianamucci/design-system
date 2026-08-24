import { describe, expect, it } from 'vitest';
import {
  buttonLoadingSource,
  buttonWithIconFinalSource,
  buttonWithIconInitialSource,
  buttonAsLinkSource,
  buttonDisabledSource,
  buttonTargetInseguroSource,
  buttonTargetMalformadoSource,
  buttonDestructiveWithIconSource,
  buttonDestructiveSource,
  buttonFocusVisibleSource,
  buttonGhostSource,
  buttonIconLgSource,
  buttonIconSmSource,
  buttonIconSource,
  buttonIconXsSource,
  buttonInvalidoSource,
  buttonLinkDisabledSource,
  buttonLinkSource,
  buttonOutlineSource,
  buttonDefaultSource,
  actionsButtonPairSource,
  buttonSecundarioSource,
  buttonSoIconSource,
  buttonSource,
  buttonSizeLgSource,
  buttonSizeDefaultSource,
  buttonSizeSmSource,
  buttonSizeXsSource,
} from './button.source';

describe('buttonSource', () => {
  it('sem args, entrega um botão de texto sem prop nenhuma escrita', () => {
    expect(buttonSource()).toBe(
      `<script lang="ts">
  import { Button } from "@/components/ui/button";
</script>

<Button>Botão</Button>`,
    );
  });

  it('acompanha o control de variante', () => {
    expect(buttonSource('', { args: { variant: 'default' } })).not.toContain('variant');
    expect(buttonSource('', { args: { variant: 'ghost' } })).toContain('<Button variant="ghost">');
  });

  it('acompanha o control de tamanho', () => {
    expect(buttonSource('', { args: { size: 'default' } })).not.toContain('size');
    expect(buttonSource('', { args: { size: 'lg' } })).toContain('<Button size="lg">');
  });

  it('acompanha o control de desabilitado, sem escrever o valor falso', () => {
    expect(buttonSource('', { args: { disabled: false } })).not.toContain('disabled');
    expect(buttonSource('', { args: { disabled: true } })).toContain('<Button disabled>');
  });

  it('combina os três controls na ordem em que a API é lida', () => {
    expect(
      buttonSource('', { args: { variant: 'destructive', size: 'sm', disabled: true } }),
    ).toContain('<Button variant="destructive" size="sm" disabled>');
  });
});

describe('transforms das stories de variante', () => {
  it('cada variante leva o próprio rótulo, e a padrão não escreve a prop', () => {
    expect(buttonDefaultSource()).toContain('<Button>Salvar</Button>');
    expect(buttonDefaultSource()).not.toContain('variant');
    expect(buttonDestructiveSource()).toContain('<Button variant="destructive">Excluir conta');
    expect(buttonOutlineSource()).toContain('<Button variant="outline">Cancelar');
    expect(buttonSecundarioSource()).toContain('<Button variant="secondary">Ver detalhes');
    expect(buttonGhostSource()).toContain('<Button variant="ghost">Fechar');
    expect(buttonLinkSource()).toContain('<Button variant="link">Saiba mais');
  });
});

describe('transforms das stories de tamanho', () => {
  it('o tamanho padrão não escreve a prop, e os outros três escrevem', () => {
    expect(buttonSizeDefaultSource()).toBe(
      `<script lang="ts">
  import { Button } from "@/components/ui/button";
</script>

<Button>Padrão</Button>`,
    );
    expect(buttonSizeXsSource()).toContain('<Button size="xs">Mínimo');
    expect(buttonSizeSmSource()).toContain('<Button size="sm">Pequeno');
    expect(buttonSizeLgSource()).toContain('<Button size="lg">Grande');
  });

  it('os botões de ícone levam rótulo acessível e a classe que segue o tamanho', () => {
    for (const [saida, size] of [
      [buttonIconSource(), 'icon'],
      [buttonIconXsSource(), 'icon-xs'],
      [buttonIconSmSource(), 'icon-sm'],
      [buttonIconLgSource(), 'icon-lg'],
    ] as const) {
      expect(saida).toContain(`<Button size="${size}" aria-label="Adicionar item">`);
      // A classe genérica de ícone não acompanha os modificadores de tamanho.
      expect(saida).toContain('class="nds-button-icon-svg"');
      expect(saida).toContain('aria-hidden="true"');
    }
  });
});

describe('transforms das stories de estado', () => {
  it('o desabilitado é o único atributo do estado, sem cor cravada', () => {
    expect(buttonDisabledSource()).toContain('<Button disabled>Salvar</Button>');
  });

  it('o carregamento junta desabilitado, ocupado e rótulo progressivo', () => {
    const saida = buttonLoadingSource();
    expect(saida).toContain('<Button disabled aria-busy="true">');
    expect(saida).toContain('Salvando…');
    // O giro vem da classe do componente, que tem guarda de movimento reduzido.
    expect(saida).toContain('nds-button-icon-svg nds-spin');
  });

  it('o foco visível não precisa de prop: o anel é do componente', () => {
    expect(buttonFocusVisibleSource()).toContain('<Button>Foco visível</Button>');
  });

  it('o inválido sinaliza pelo atributo, e não pela variante destrutiva', () => {
    const saida = buttonInvalidoSource();
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toContain('variant="outline"');
  });
});

describe('transforms das stories de composição', () => {
  it('o ícone inicial vem antes do rótulo, e o final depois', () => {
    const inicial = buttonWithIconInitialSource();
    const final = buttonWithIconFinalSource();
    expect(inicial.indexOf('<Plus')).toBeLessThan(inicial.indexOf('Adicionar item'));
    expect(final.indexOf('Próximo')).toBeLessThan(final.indexOf('<ChevronRight'));
  });

  it('a variante destrutiva com ícone mantém o desenho decorativo', () => {
    const saida = buttonDestructiveWithIconSource();
    expect(saida).toContain('<Button variant="destructive">');
    expect(saida).toContain('<Trash2 class="nds-button-icon-svg" aria-hidden="true" />');
  });

  it('o botão só de ícone traz o rótulo acessível, que é obrigatório', () => {
    expect(buttonSoIconSource()).toContain('<Button size="icon" aria-label="Baixar arquivo">');
  });

  it('no par de ações a primária fica à direita, com o respiro do container', () => {
    const saida = actionsButtonPairSource();
    expect(saida).toContain('class="nds-cluster" data-spacing="md"');
    expect(saida.indexOf('Cancelar')).toBeLessThan(saida.indexOf('Confirmar'));
  });

  it('com destino, a composição navegacional renderiza um link', () => {
    expect(buttonAsLinkSource()).toContain(
      '<Button variant="link" href="#docs">Ver documentação</Button>',
    );
  });

  it('o link desabilitado soma o estado ao destino', () => {
    expect(buttonLinkDisabledSource()).toContain(
      '<Button variant="link" href="#docs" disabled>',
    );
  });

  it('os destinos recusados chegam por variável, com o motivo da recusa junto', () => {
    const inseguro = buttonTargetInseguroSource();
    expect(inseguro).toContain('const destino = ');
    expect(inseguro).toContain('<Button variant="link" href={destino}>');
    expect(inseguro).toContain('mailto, tel');

    const malformado = buttonTargetMalformadoSource();
    expect(malformado).toContain('const destino = "http://[";');
    expect(malformado).toContain('<Button variant="link" href={destino}>');
  });
});
