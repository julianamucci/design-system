import { describe, expect, it } from 'vitest';
import {
  buttonLoadingSource,
  buttonWithIconFinalSource,
  buttonWithIconInitialSource,
  buttonAsLinkSource,
  buttonDisabledSource,
  buttonDestructiveWithIconSource,
  buttonDestructiveSource,
  buttonFocusVisibleSource,
  buttonGhostSource,
  buttonIconLgSource,
  buttonIconSmSource,
  buttonIconSource,
  buttonIconXsSource,
  buttonInvalidoSource,
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
  it('sem args, entrega o botão de texto na variante e no tamanho padrão', () => {
    expect(buttonSource()).toBe(
      `<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>

<template>
  <Button>Botão</Button>
</template>`,
    );
  });

  it('acompanha os controls que diferem do padrão', () => {
    const output = buttonSource('', { args: { variant: 'destructive', size: 'lg', disabled: true } });
    expect(output).toContain('<Button variant="destructive" size="lg" disabled>Botão</Button>');
  });

  it('não escreve variante nem tamanho padrão — repetir padrão ensina ruído', () => {
    const output = buttonSource('', { args: { variant: 'default', size: 'default', disabled: false } });
    expect(output).toContain('<Button>Botão</Button>');
    expect(output).not.toContain('variant="default"');
    expect(output).not.toContain('size="default"');
    expect(output).not.toContain('disabled');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    // O Playground declara `onClick: fn()`, e todo arg de ação chega à
    // transform como FUNÇÃO. Interpolado direto, o corpo do mock apareceria no
    // lugar do exemplo.
    const output = buttonSource('', {
      args: { variant: (() => {}) as never, size: (() => {}) as never },
    });
    expect(output).toContain('<Button>Botão</Button>');
    expect(output).not.toContain('function');
    expect(output).not.toContain('=>');
  });
});

describe('transforms das stories de variante', () => {
  it('cada variante traz o próprio rótulo, e a primária não escreve prop', () => {
    expect(buttonDefaultSource()).toContain('<Button>Salvar</Button>');
    expect(buttonDestructiveSource()).toContain('<Button variant="destructive">Excluir conta</Button>');
    expect(buttonOutlineSource()).toContain('<Button variant="outline">Cancelar</Button>');
    expect(buttonSecundarioSource()).toContain('<Button variant="secondary">Ver detalhes</Button>');
    expect(buttonGhostSource()).toContain('<Button variant="ghost">Fechar</Button>');
    expect(buttonLinkSource()).toContain('<Button variant="link">Saiba mais</Button>');
  });

  it('o rótulo diz o que a ação faz, e não qual é a variante', () => {
    const rotulos = [
      buttonDefaultSource(),
      buttonDestructiveSource(),
      buttonOutlineSource(),
      buttonSecundarioSource(),
      buttonGhostSource(),
      buttonLinkSource(),
    ].map((output) => output.match(/>([^<>]+)<\/Button>/)![1]);
    expect(new Set(rotulos).size).toBe(rotulos.length);
  });
});

describe('transforms das stories de tamanho', () => {
  it('o tamanho padrão não escreve prop nenhuma', () => {
    expect(buttonSizeDefaultSource()).toContain('<Button>Padrão</Button>');
  });

  it('cada tamanho de texto escreve o próprio', () => {
    expect(buttonSizeXsSource()).toContain('size="xs"');
    expect(buttonSizeSmSource()).toContain('size="sm"');
    expect(buttonSizeLgSource()).toContain('size="lg"');
  });

  it('o botão só de ícone importa o ícone e nomeia a ação', () => {
    const output = buttonIconSource();
    expect(output).toBe(
      `<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-vue-next'
</script>

<template>
  <Button size="icon" aria-label="Adicionar item">
    <Plus aria-hidden="true" />
  </Button>
</template>`,
    );
  });

  it('sem texto dentro, o rótulo acessível é o único nome que sobra', () => {
    for (const output of [
      buttonIconSource(),
      buttonIconXsSource(),
      buttonIconSmSource(),
      buttonIconLgSource(),
    ]) {
      expect(output).toContain('aria-label="Adicionar item"');
      // O SVG é decorativo: lido em voz alta duplicaria o rótulo.
      expect(output).toContain('aria-hidden="true"');
    }
    expect(buttonIconXsSource()).toContain('size="icon-xs"');
    expect(buttonIconSmSource()).toContain('size="icon-sm"');
    expect(buttonIconLgSource()).toContain('size="icon-lg"');
  });
});

describe('transforms das stories de estado', () => {
  it('o desabilitado é atributo puro, não vinculado', () => {
    expect(buttonDisabledSource()).toContain('<Button disabled>Salvar</Button>');
  });

  it('o carregamento junta desabilitado, ocupado e rótulo de progresso', () => {
    const output = buttonLoadingSource();
    expect(output).toContain('<Button disabled aria-busy="true">');
    expect(output).toContain('class="nds-button-icon-svg nds-spin"');
    // O rótulo troca junto: um "Salvar" parado durante o envio mente sobre o
    // estado.
    expect(output).toContain('Salvando…');
  });

  it('o foco não tem prop — a ausência é o assunto da story', () => {
    const output = buttonFocusVisibleSource();
    expect(output).toContain('<Button>Foco visível</Button>');
    expect(output).not.toContain('focus');
  });

  it('o inválido sinaliza no atributo, não na cor', () => {
    expect(buttonInvalidoSource()).toContain(
      '<Button variant="outline" aria-invalid="true">Formulário inválido</Button>',
    );
  });
});

describe('transforms das stories de composição', () => {
  it('o ícone inicial vem antes do rótulo', () => {
    const output = buttonWithIconInitialSource();
    expect(output.indexOf('<Plus')).toBeLessThan(output.indexOf('Adicionar item'));
    expect(output).toContain(`import { Plus } from 'lucide-vue-next'`);
  });

  it('o ícone final vem depois — é o que distingue as duas composições', () => {
    const output = buttonWithIconFinalSource();
    expect(output.indexOf('Próximo')).toBeLessThan(output.indexOf('<ChevronRight'));
  });

  it('a composição destrutiva troca ícone e variante juntos', () => {
    const output = buttonDestructiveWithIconSource();
    expect(output).toContain(`import { Trash2 } from 'lucide-vue-next'`);
    expect(output).toContain('<Button variant="destructive">');
  });

  it('o botão só de ícone da composição nomeia a própria ação', () => {
    const output = buttonSoIconSource();
    expect(output).toContain('aria-label="Baixar arquivo"');
    expect(output).toContain('<Download aria-hidden="true" />');
  });

  it('o par de ações põe a primária à direita, com o respiro no container', () => {
    const output = actionsButtonPairSource();
    expect(output).toContain('<div class="nds-cluster" data-spacing="md">');
    expect(output.indexOf('Cancelar')).toBeLessThan(output.indexOf('Confirmar'));
    // O respiro é do container: margem no botão vazaria para toda composição
    // que reusasse a variante.
    expect(output).not.toContain('nds-ml');
  });

  it('como link, o botão veste o elemento do consumidor', () => {
    const output = buttonAsLinkSource();
    expect(output).toContain('<Button as-child variant="link">');
    expect(output).toContain('<a href="#docs">Ver documentação</a>');
  });
});
