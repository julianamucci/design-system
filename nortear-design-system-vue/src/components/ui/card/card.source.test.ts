import { describe, expect, it } from 'vitest';
import {
  cardClicavelSource,
  headerSourceCardWithAction,
  cardComImagemSource,
  cardComRodapeSource,
  cardCompactoSource,
  cardDeMetricaSource,
  cardDePerfilSource,
  cardDeProdutoSource,
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
    <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
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
    const saida = cardSource('', { args: { size: (() => {}) as never } });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('size=');
  });

  it('o título vira heading de verdade — o padrão do componente é neutro', () => {
    // O CSS dá a aparência de título; quem dá a semântica é o elemento.
    expect(cardSource()).toContain('<CardTitle as="h3">');
  });

  it('cada ação do rodapé diz sobre qual item ela age', () => {
    const saida = cardSource();
    // "Excluir" sozinho vira uma fileira de botões idênticos numa lista.
    expect(saida).toContain('aria-label="Editar produto Cadeira Gamer Pro"');
    expect(saida).toContain('aria-label="Excluir produto Cadeira Gamer Pro"');
  });
});

describe('transforms das stories de tamanho e de estado', () => {
  it('a unidade mínima é cabeçalho e corpo, e não importa o que não usa', () => {
    const saida = cardSimpleSource();
    expect(saida).not.toContain('CardFooter');
    expect(saida).not.toContain('CardAction');
    expect(saida).not.toContain('@/components/ui/button');
    // Container passivo: nenhum papel, nenhuma entrada na ordem de foco.
    expect(saida).not.toContain('tabindex');
    expect(saida).not.toContain('role=');
  });

  it('o tamanho compacto propaga sozinho às partes internas', () => {
    const saida = cardCompactoSource();
    expect(saida).toContain('<Card size="sm" class="nds-w-xs">');
    // Não há prop de tamanho a repetir em cada peça.
    expect(saida).not.toContain('<CardHeader size=');
    expect(saida).not.toContain('<CardTitle size=');
  });

  it('o card clicável põe o destino no elemento de fora, não no card', () => {
    const saida = cardClicavelSource();
    expect(saida).toContain('href="/produtos/cadeira-gamer-pro"');
    expect(saida).toContain('aria-label="Abrir detalhes do produto Cadeira Gamer Pro"');
    expect(saida).toContain('nds-focus-ring');
    // O card continua sem prop de ativação nenhuma.
    expect(saida).toContain('  <Card>');
    expect(saida).not.toContain('<Card @click');
  });

  it('o rodapé é filho direto do card, e vem depois do corpo', () => {
    const saida = cardComRodapeSource();
    const raiz = saida.slice(saida.indexOf('<Card '));
    expect(raiz.indexOf('</CardContent>')).toBeLessThan(raiz.indexOf('<CardFooter'));
    // Um invólucro entre os dois mataria a regra que zera o respiro de baixo.
    expect(saida).toContain('    <CardFooter class="nds-cluster"');
  });
});

describe('transforms das stories de composição', () => {
  it('a ação vive dentro do cabeçalho, depois do título e da descrição', () => {
    const saida = headerSourceCardWithAction();
    expect(saida).toContain('  CardAction,');
    const cabecalho = saida.slice(saida.indexOf('<CardHeader>'), saida.indexOf('</CardHeader>'));
    expect(cabecalho.indexOf('<CardTitle')).toBeLessThan(cabecalho.indexOf('<CardDescription'));
    expect(cabecalho.indexOf('<CardDescription')).toBeLessThan(cabecalho.indexOf('<CardAction>'));
  });

  it('a imagem é o primeiro filho, e o canto vem do card, não de classe nela', () => {
    const saida = cardComImagemSource();
    const raiz = saida.slice(saida.indexOf('<Card '));
    expect(raiz.indexOf('<img')).toBeLessThan(raiz.indexOf('<CardHeader>'));
    expect(saida).not.toContain('nds-rounded-t');
    // Imagem informativa: alt vazio a esconderia de quem usa leitor de tela.
    expect(saida).toContain('alt="Cadeira Gamer Pro vista de frente, em fundo neutro"');
  });

  it('o card de produto monta as sete peças, com o status na ação do cabeçalho', () => {
    const saida = cardDeProdutoSource();
    for (const peca of ['CardAction', 'CardContent', 'CardDescription', 'CardFooter', 'CardHeader', 'CardTitle']) {
      expect(saida).toContain(`  ${peca},`);
    }
    const cabecalho = saida.slice(saida.indexOf('<CardHeader>'), saida.indexOf('</CardHeader>'));
    expect(cabecalho).toContain('<Badge variant="secondary">Em estoque</Badge>');
  });

  it('na métrica o título nomeia e o corpo carrega o valor', () => {
    const saida = cardDeMetricaSource();
    expect(saida).toContain('<CardTitle as="h3">Assinantes ativos</CardTitle>');
    const corpo = saida.slice(saida.indexOf('<CardContent>'), saida.indexOf('</CardContent>'));
    expect(corpo).toContain('8.742');
    // Trocar título e valor faria o leitor anunciar "8.742" como nome do card.
    expect(saida).not.toContain('<CardTitle as="h3">8.742');
  });

  it('o perfil termina no cabeçalho e o avatar fica fora da leitura', () => {
    const saida = cardDePerfilSource();
    expect(saida).toContain(`import { Avatar, AvatarFallback } from '@/components/ui/avatar'`);
    expect(saida).not.toContain('CardFooter');
    // O nome já está no título: um alt no avatar o anunciaria duas vezes.
    expect(saida).not.toContain('alt=');
    expect(saida).toContain('<AvatarFallback>MR</AvatarFallback>');
  });
});
