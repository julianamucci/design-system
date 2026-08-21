<script lang="ts">
  import { Separator } from './index';
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card/index.js';

  type Caso = 'playground' | 'variantes' | 'estados' | 'card' | 'menu' | 'emphasis';

  interface Props {
    caso?: Caso;
    orientation?: 'horizontal' | 'vertical';
    decorative?: boolean;
    emphasis?: 'default' | 'strong';
  }

  let {
    caso = 'playground',
    orientation = 'horizontal',
    decorative = true,
    emphasis = 'default',
  }: Props = $props();

  // Nenhuma medida cravada em `style`: o `align-self: stretch` da folha faz a
  // linha vertical acompanhar a linha do flex, e `nds-max-w-md` responde pela
  // largura. Estilo inline venceria a folha e sairia do tema e da densidade.
</script>

{#if caso === 'playground'}
  {#if orientation === 'vertical'}
    <div class="nds-cluster nds-docs-demo-row nds-w-md" data-spacing="md">
      <p class="nds-text-body">Item A</p>
      <Separator {orientation} {decorative} {emphasis} />
      <p class="nds-text-body">Item B</p>
    </div>
  {:else}
    <div class="nds-stack nds-w-md" data-spacing="md">
      <p class="nds-text-body">Seção superior</p>
      <Separator {orientation} {decorative} {emphasis} />
      <p class="nds-text-body">Seção inferior</p>
    </div>
  {/if}

{:else if caso === 'variantes'}
  {#if orientation === 'vertical'}
    <div class="nds-cluster nds-docs-demo-row nds-w-md" data-spacing="md">
      <span class="nds-text-body">Blog</span>
      <Separator orientation="vertical" />
      <span class="nds-text-body">Documentação</span>
      <Separator orientation="vertical" />
      <span class="nds-text-body">Contato</span>
    </div>
  {:else}
    <div class="nds-stack nds-w-md" data-spacing="md">
      <div class="nds-text-body">
        <p class="nds-font-medium">Configurações da conta</p>
        <p class="nds-text-muted-foreground">Gerencie seu nome e e-mail.</p>
      </div>
      <Separator orientation="horizontal" />
      <div class="nds-text-body">
        <p class="nds-font-medium">Preferências</p>
        <p class="nds-text-muted-foreground">Tema, idioma e notificações.</p>
      </div>
    </div>
  {/if}

{:else if caso === 'estados'}
  <div class="nds-stack nds-w-md" data-spacing="sm">
    <h3 class="nds-text-body nds-font-medium">{decorative ? 'Decorativo (padrão)' : 'Semântico'}</h3>
    <p class="nds-text-caption nds-text-muted-foreground">
      {decorative
        ? 'Ignorado por leitores de tela — a divisão é só visual.'
        : 'Anunciado como divisor, com a orientação da linha.'}
    </p>
    <p class="nds-text-body">{decorative ? 'Conteúdo antes do separador.' : 'Categoria: Layout'}</p>
    <Separator orientation="horizontal" {decorative} />
    <p class="nds-text-body">{decorative ? 'Conteúdo depois do separador.' : 'Categoria: Formulários'}</p>
  </div>

{:else if caso === 'card'}
  <Card class="nds-max-w-md">
    <CardHeader>
      <CardTitle>Resumo do pedido</CardTitle>
      <CardDescription>3 itens, entrega em 5 dias úteis.</CardDescription>
    </CardHeader>
    <Separator orientation="horizontal" />
    <CardContent>
      <p class="nds-text-body">Total: R$ 249,90</p>
    </CardContent>
  </Card>

{:else if caso === 'menu'}
  <div
    class="nds-stack nds-max-w-xs nds-rounded-md nds-border-default nds-bg-background nds-p-1"
    data-spacing="xs"
  >
    <div class="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Perfil</div>
    <div class="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Conta</div>
    <!-- A divisão entre grupos de um menu FAZ parte da estrutura da informação:
         é o caso em que o separador deixa de ser decorativo. -->
    <Separator orientation="horizontal" decorative={false} />
    <div class="nds-rounded-sm nds-hover-bg-accent nds-px-2 nds-py-1 nds-text-body">Sair</div>
  </div>

{:else}
  <div class="nds-stack nds-w-md" data-spacing="md">
    <p class="nds-text-body nds-text-muted-foreground">Fim da seção</p>
    <Separator orientation="horizontal" data-testid="padrao" />
    <p class="nds-text-body nds-text-muted-foreground">Continuação do mesmo assunto</p>
    <!-- A classe extra entra junto com a ênfase: é o mesmo par que a docs page
         documenta em Extensibilidade, e prova que ela convive com a base. -->
    <Separator
      orientation="horizontal"
      emphasis="strong"
      class="nds-mt-4"
      data-testid="forte"
    />
    <p class="nds-text-body nds-font-medium">Troca de assunto</p>
  </div>
{/if}
