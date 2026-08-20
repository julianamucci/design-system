import { describe, expect, it } from 'vitest';
import {
  buttonCarregandoSource,
  buttonComIconeFinalSource,
  buttonComIconeInicialSource,
  buttonComoLinkSource,
  buttonDesabilitadoSource,
  buttonDestrutivoComIconeSource,
  buttonDestrutivoSource,
  buttonFocoVisivelSource,
  buttonGhostSource,
  buttonIconeLgSource,
  buttonIconeSmSource,
  buttonIconeSource,
  buttonIconeXsSource,
  buttonInvalidoSource,
  buttonLinkSource,
  buttonOutlineSource,
  buttonPadraoSource,
  buttonParDeAcoesSource,
  buttonSecundarioSource,
  buttonSoIconeSource,
  buttonSource,
  buttonTamanhoLgSource,
  buttonTamanhoPadraoSource,
  buttonTamanhoSmSource,
  buttonTamanhoXsSource,
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
    const saida = buttonSource('', { args: { variant: 'destructive', size: 'lg', disabled: true } });
    expect(saida).toContain('<Button variant="destructive" size="lg" disabled>Botão</Button>');
  });

  it('não escreve variante nem tamanho padrão — repetir padrão ensina ruído', () => {
    const saida = buttonSource('', { args: { variant: 'default', size: 'default', disabled: false } });
    expect(saida).toContain('<Button>Botão</Button>');
    expect(saida).not.toContain('variant="default"');
    expect(saida).not.toContain('size="default"');
    expect(saida).not.toContain('disabled');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    // O Playground declara `onClick: fn()`, e todo arg de ação chega à
    // transform como FUNÇÃO. Interpolado direto, o corpo do mock apareceria no
    // lugar do exemplo.
    const saida = buttonSource('', {
      args: { variant: (() => {}) as never, size: (() => {}) as never },
    });
    expect(saida).toContain('<Button>Botão</Button>');
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('=>');
  });
});

describe('transforms das stories de variante', () => {
  it('cada variante traz o próprio rótulo, e a primária não escreve prop', () => {
    expect(buttonPadraoSource()).toContain('<Button>Salvar</Button>');
    expect(buttonDestrutivoSource()).toContain('<Button variant="destructive">Excluir conta</Button>');
    expect(buttonOutlineSource()).toContain('<Button variant="outline">Cancelar</Button>');
    expect(buttonSecundarioSource()).toContain('<Button variant="secondary">Ver detalhes</Button>');
    expect(buttonGhostSource()).toContain('<Button variant="ghost">Fechar</Button>');
    expect(buttonLinkSource()).toContain('<Button variant="link">Saiba mais</Button>');
  });

  it('o rótulo diz o que a ação faz, e não qual é a variante', () => {
    const rotulos = [
      buttonPadraoSource(),
      buttonDestrutivoSource(),
      buttonOutlineSource(),
      buttonSecundarioSource(),
      buttonGhostSource(),
      buttonLinkSource(),
    ].map((saida) => saida.match(/>([^<>]+)<\/Button>/)![1]);
    expect(new Set(rotulos).size).toBe(rotulos.length);
  });
});

describe('transforms das stories de tamanho', () => {
  it('o tamanho padrão não escreve prop nenhuma', () => {
    expect(buttonTamanhoPadraoSource()).toContain('<Button>Padrão</Button>');
  });

  it('cada tamanho de texto escreve o próprio', () => {
    expect(buttonTamanhoXsSource()).toContain('size="xs"');
    expect(buttonTamanhoSmSource()).toContain('size="sm"');
    expect(buttonTamanhoLgSource()).toContain('size="lg"');
  });

  it('o botão só de ícone importa o ícone e nomeia a ação', () => {
    const saida = buttonIconeSource();
    expect(saida).toBe(
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
    for (const saida of [
      buttonIconeSource(),
      buttonIconeXsSource(),
      buttonIconeSmSource(),
      buttonIconeLgSource(),
    ]) {
      expect(saida).toContain('aria-label="Adicionar item"');
      // O SVG é decorativo: lido em voz alta duplicaria o rótulo.
      expect(saida).toContain('aria-hidden="true"');
    }
    expect(buttonIconeXsSource()).toContain('size="icon-xs"');
    expect(buttonIconeSmSource()).toContain('size="icon-sm"');
    expect(buttonIconeLgSource()).toContain('size="icon-lg"');
  });
});

describe('transforms das stories de estado', () => {
  it('o desabilitado é atributo puro, não vinculado', () => {
    expect(buttonDesabilitadoSource()).toContain('<Button disabled>Salvar</Button>');
  });

  it('o carregamento junta desabilitado, ocupado e rótulo de progresso', () => {
    const saida = buttonCarregandoSource();
    expect(saida).toContain('<Button disabled aria-busy="true">');
    expect(saida).toContain('class="nds-button-icon-svg nds-spin"');
    // O rótulo troca junto: um "Salvar" parado durante o envio mente sobre o
    // estado.
    expect(saida).toContain('Salvando…');
  });

  it('o foco não tem prop — a ausência é o assunto da story', () => {
    const saida = buttonFocoVisivelSource();
    expect(saida).toContain('<Button>Foco visível</Button>');
    expect(saida).not.toContain('focus');
  });

  it('o inválido sinaliza no atributo, não na cor', () => {
    expect(buttonInvalidoSource()).toContain(
      '<Button variant="outline" aria-invalid="true">Formulário inválido</Button>',
    );
  });
});

describe('transforms das stories de composição', () => {
  it('o ícone inicial vem antes do rótulo', () => {
    const saida = buttonComIconeInicialSource();
    expect(saida.indexOf('<Plus')).toBeLessThan(saida.indexOf('Adicionar item'));
    expect(saida).toContain(`import { Plus } from 'lucide-vue-next'`);
  });

  it('o ícone final vem depois — é o que distingue as duas composições', () => {
    const saida = buttonComIconeFinalSource();
    expect(saida.indexOf('Próximo')).toBeLessThan(saida.indexOf('<ChevronRight'));
  });

  it('a composição destrutiva troca ícone e variante juntos', () => {
    const saida = buttonDestrutivoComIconeSource();
    expect(saida).toContain(`import { Trash2 } from 'lucide-vue-next'`);
    expect(saida).toContain('<Button variant="destructive">');
  });

  it('o botão só de ícone da composição nomeia a própria ação', () => {
    const saida = buttonSoIconeSource();
    expect(saida).toContain('aria-label="Baixar arquivo"');
    expect(saida).toContain('<Download aria-hidden="true" />');
  });

  it('o par de ações põe a primária à direita, com o respiro no container', () => {
    const saida = buttonParDeAcoesSource();
    expect(saida).toContain('<div class="nds-cluster" data-spacing="sm">');
    expect(saida.indexOf('Cancelar')).toBeLessThan(saida.indexOf('Confirmar'));
    // O respiro é do container: margem no botão vazaria para toda composição
    // que reusasse a variante.
    expect(saida).not.toContain('nds-ml');
  });

  it('como link, o botão veste o elemento do consumidor', () => {
    const saida = buttonComoLinkSource();
    expect(saida).toContain('<Button as-child variant="link">');
    expect(saida).toContain('<a href="#docs">Ver documentação</a>');
  });
});
