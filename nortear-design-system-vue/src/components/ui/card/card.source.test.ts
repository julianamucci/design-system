import { describe, expect, it } from 'vitest';
import {
  cardClickableSource,
  headerCardWithActionSource,
  cardWithImageSource,
  cardWithFooterSource,
  cardCompactoSource,
  cardDeMetricaSource,
  cardDePerfilSource,
  productCardSource,
  cardSimpleSource,
  cardSource,
} from './card.source';

describe('cardSource', () => {
  it('sem args, entrega a unidade completa no tamanho padrão', () => {
    expect(cardSource()).toBe(
      `<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Card class="nds-w-sm">
    <CardHeader>
      <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
      <CardDescription>Estrutura ergonômica com ajuste de altura e apoio lombar.</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="nds-text-h4">R$ 1.299,00</p>
    </CardContent>
    <CardFooter class="nds-cluster" data-justify="end" data-spacing="md">
      <Button variant="outline" aria-label="Editar produto Cadeira Gamer Pro">Editar</Button>
      <Button variant="destructive" aria-label="Excluir produto Cadeira Gamer Pro">Excluir</Button>
    </CardFooter>
  </Card>
</template>`,
    );
  });

  it('acompanha o control de tamanho, e omite o padrão', () => {
    expect(cardSource('', { args: { size: 'sm' } })).toContain(
      '<Card size="sm" class="nds-w-sm">',
    );
    expect(cardSource('', { args: { size: 'default' } })).not.toContain('size=');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = cardSource('', { args: { size: (() => {}) as never } });
    expect(output).not.toContain('function');
    expect(output).not.toContain('size=');
  });

  it('o título vira heading de verdade — o padrão do componente é neutro', () => {
    // O CSS dá a aparência de título; quem dá a semântica é o elemento.
    expect(cardSource()).toContain('<CardTitle as="h3">');
  });

  it('cada ação do rodapé diz sobre qual item ela age', () => {
    const output = cardSource();
    // "Excluir" sozinho vira uma fileira de botões idênticos numa lista.
    expect(output).toContain('aria-label="Editar produto Cadeira Gamer Pro"');
    expect(output).toContain('aria-label="Excluir produto Cadeira Gamer Pro"');
  });
});

describe('transforms das stories de tamanho e de estado', () => {
  it('a unidade mínima é cabeçalho e corpo, e não importa o que não usa', () => {
    const output = cardSimpleSource();
    expect(output).not.toContain('CardFooter');
    expect(output).not.toContain('CardAction');
    expect(output).not.toContain('@/components/ui/button');
    // Container passivo: nenhum papel, nenhuma entrada na ordem de foco.
    expect(output).not.toContain('tabindex');
    expect(output).not.toContain('role=');
  });

  it('o tamanho compacto propaga sozinho às partes internas', () => {
    const output = cardCompactoSource();
    expect(output).toContain('<Card size="sm" class="nds-w-xs">');
    // Não há prop de tamanho a repetir em cada peça.
    expect(output).not.toContain('<CardHeader size=');
    expect(output).not.toContain('<CardTitle size=');
  });

  it('o card clicável põe o destino no elemento de fora, não no card', () => {
    const output = cardClickableSource();
    expect(output).toContain('href="/produtos/cadeira-gamer-pro"');
    expect(output).toContain('aria-label="Abrir detalhes do produto Cadeira Gamer Pro"');
    expect(output).toContain('nds-focus-ring');
    // O card continua sem prop de ativação nenhuma.
    expect(output).toContain('  <Card>');
    expect(output).not.toContain('<Card @click');
  });

  it('o rodapé é filho direto do card, e vem depois do corpo', () => {
    const output = cardWithFooterSource();
    const root = output.slice(output.indexOf('<Card '));
    expect(root.indexOf('</CardContent>')).toBeLessThan(root.indexOf('<CardFooter'));
    // Um invólucro entre os dois mataria a regra que zera o respiro de baixo.
    expect(output).toContain('    <CardFooter class="nds-cluster"');
  });
});

describe('transforms das stories de composição', () => {
  it('a ação vive dentro do cabeçalho, depois do título e da descrição', () => {
    const output = headerCardWithActionSource();
    expect(output).toContain('  CardAction,');
    const header = output.slice(output.indexOf('<CardHeader>'), output.indexOf('</CardHeader>'));
    expect(header.indexOf('<CardTitle')).toBeLessThan(header.indexOf('<CardDescription'));
    expect(header.indexOf('<CardDescription')).toBeLessThan(header.indexOf('<CardAction>'));
  });

  it('a imagem é o primeiro filho, e o canto vem do card, não de classe nela', () => {
    const output = cardWithImageSource();
    const root = output.slice(output.indexOf('<Card '));
    expect(root.indexOf('<img')).toBeLessThan(root.indexOf('<CardHeader>'));
    expect(output).not.toContain('nds-rounded-t');
    // Imagem informativa: alt vazio a esconderia de quem usa leitor de tela.
    expect(output).toContain('alt="Cadeira Gamer Pro vista de frente, em fundo neutro"');
  });

  it('o card de produto monta as sete peças, com o status na ação do cabeçalho', () => {
    const output = productCardSource();
    for (const part of ['CardAction', 'CardContent', 'CardDescription', 'CardFooter', 'CardHeader', 'CardTitle']) {
      expect(output).toContain(`  ${part},`);
    }
    const header = output.slice(output.indexOf('<CardHeader>'), output.indexOf('</CardHeader>'));
    expect(header).toContain('<Badge variant="info">Em estoque</Badge>');
  });

  it('na métrica o título nomeia e o corpo carrega o valor', () => {
    const output = cardDeMetricaSource();
    expect(output).toContain('<CardTitle as="h3">Assinantes ativos</CardTitle>');
    const body = output.slice(output.indexOf('<CardContent>'), output.indexOf('</CardContent>'));
    expect(body).toContain('8.742');
    // Trocar título e valor faria o leitor anunciar "8.742" como nome do card.
    expect(output).not.toContain('<CardTitle as="h3">8.742');
  });

  it('o perfil termina no cabeçalho e o avatar fica fora da leitura', () => {
    const output = cardDePerfilSource();
    expect(output).toContain(`import { Avatar, AvatarFallback } from '@/components/ui/avatar'`);
    expect(output).not.toContain('CardFooter');
    // O nome já está no título: um alt no avatar o anunciaria duas vezes.
    expect(output).not.toContain('alt=');
    expect(output).toContain('<AvatarFallback>MR</AvatarFallback>');
  });
});
