import { describe, expect, it } from 'vitest';
import {
  cardClicavelSource,
  cardComAcaoSource,
  cardComImagemSource,
  cardComRodapeSource,
  cardDeMetricaSource,
  cardDePerfilSource,
  cardDeProdutoSource,
  cardPadraoSource,
  cardPequenoSource,
  cardSource,
} from './card.source';

describe('cardSource', () => {
  it('sem args, entrega a unidade completa no tamanho padrão', () => {
    expect(cardSource()).toBe(
      `<script lang="ts">
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
</script>

<Card class="nds-w-cap-sm">
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
</Card>`,
    );
  });

  it('só escreve size quando o valor difere do padrão', () => {
    expect(cardSource('', { args: { size: 'default' } })).not.toContain('size=');
    expect(cardSource('', { args: { size: 'sm' } })).toContain('<Card class="nds-w-cap-sm" size="sm">');
  });

  it('o rodapé é filho DIRETO do Card — é o que aciona a borda superior', () => {
    const saida = cardSource();
    const linhas = saida.split('\n');
    const rodape = linhas.find((linha) => linha.includes('<CardFooter'))!;
    // Dois espaços de indentação: um nível abaixo do <Card>, sem invólucro no meio.
    expect(rodape.match(/^ */)![0]).toBe('  ');
  });
});

describe('transforms das stories de tamanho, estado e composição', () => {
  it('o card padrão não traz rodapé nem botão', () => {
    const saida = cardPadraoSource();
    expect(saida).toContain('<CardHeader>');
    expect(saida).not.toContain('CardFooter');
    expect(saida).not.toContain('Button');
  });

  it('o tamanho pequeno escreve a prop e aperta a largura máxima', () => {
    const saida = cardPequenoSource();
    expect(saida).toContain('size="sm"');
    expect(saida).toContain('nds-w-cap-xs');
  });

  it('o card clicável ativa pelo link em volta, nunca pelo Card', () => {
    const saida = cardClicavelSource();
    expect(saida).toContain('aria-label="Abrir detalhes do produto Cadeira Gamer Pro"');
    expect(saida).toContain('nds-focus-ring');
    // Handler de clique no Card raiz é justamente o que a story desaconselha.
    expect(saida).not.toContain('onclick');
    expect(saida).not.toContain('tabindex');
  });

  it('o rodapé traz as duas ações nomeando o card em que agem', () => {
    const saida = cardComRodapeSource();
    expect(saida).toContain('<CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">');
    expect(saida).toContain('aria-label="Cancelar edição de Cadeira Gamer Pro"');
    expect(saida).toContain('aria-label="Salvar alterações em Cadeira Gamer Pro"');
  });

  it('a ação mora DENTRO do header, depois da descrição', () => {
    const saida = cardComAcaoSource();
    expect(saida).toContain('CardAction');
    expect(saida.indexOf('<CardAction>')).toBeGreaterThan(saida.indexOf('<CardDescription>'));
    expect(saida.indexOf('<CardAction>')).toBeLessThan(saida.indexOf('</CardHeader>'));
  });

  it('a imagem é o primeiro filho do card e tem alternativa textual', () => {
    const saida = cardComImagemSource();
    expect(saida.indexOf('<img')).toBeLessThan(saida.indexOf('<CardHeader>'));
    expect(saida).toContain('alt="Cadeira Gamer Pro vista de frente, em fundo neutro"');
  });

  it('o card de produto junta imagem, status no header e ações no rodapé', () => {
    const saida = cardDeProdutoSource();
    expect(saida).toContain('from "@/components/ui/badge"');
    expect(saida).toContain('<Badge variant="secondary">Em estoque</Badge>');
    expect(saida.indexOf('<img')).toBeLessThan(saida.indexOf('<CardHeader>'));
    expect(saida).toContain('<CardFooter');
  });

  it('o card de métrica deixa o número no corpo, e o nome no título', () => {
    const saida = cardDeMetricaSource();
    expect(saida).toContain('<CardTitle as="h3">Assinantes ativos</CardTitle>');
    expect(saida.indexOf('8.742')).toBeGreaterThan(saida.indexOf('<CardContent>'));
    expect(saida).toContain('size="sm"');
  });

  it('o card de perfil termina no header e traz o avatar', () => {
    const saida = cardDePerfilSource();
    expect(saida).toContain('from "@/components/ui/avatar"');
    expect(saida).toContain('<AvatarFallback>MR</AvatarFallback>');
    expect(saida).not.toContain('CardFooter');
    expect(saida).not.toContain('CardContent');
  });
});
