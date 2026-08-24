<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardAction,
    CardContent,
    CardFooter,
  } from './index';
  import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';
  import { Avatar, AvatarFallback } from '@/components/ui/avatar';

  type Variant =
    | 'default'
    | 'small'
    | 'playground'
    | 'withFooter'
    | 'withAction'
    | 'withImage'
    | 'clickable'
    | 'product'
    | 'profile'
    | 'metric';

  interface Props {
    variant?: Variant;
    size?: 'default' | 'sm';
    title?: string;
    description?: string;
    productPrice?: string;
    /** Clique no wrapper do card clicável (a story impede a navegação real). */
    onNavigate?: () => void;
    /** Clique no botão primário do rodapé. */
    onPrimaryAction?: () => void;
    class?: string;
  }

  let {
    variant = 'default',
    size = 'default',
    title = 'Cadeira Gamer Pro',
    description = 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
    productPrice = 'R$ 1.299,00',
    onNavigate,
    onPrimaryAction,
    class: className = 'nds-w-sm',
  }: Props = $props();

  /**
   * Imagem em data URI, igual nas cinco stacks: a asserção de radius e de
   * padding mede a imagem REAL, e uma URL remota faria o resultado depender da
   * rede.
   */
  const imageProduct =
    "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='160'%3E%3Crect width='400' height='160' fill='%23cbd5e1'/%3E%3C/svg%3E";

  function navegar(event: MouseEvent) {
    event.preventDefault();
    onNavigate?.();
  }
</script>

{#if variant === 'default'}
  <Card class={className} {size}>
    <CardHeader>
      <CardTitle as="h3">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="nds-text-h4">{productPrice}</p>
    </CardContent>
  </Card>
{:else if variant === 'small'}
  <Card class="nds-w-xs" size="sm">
    <CardHeader>
      <CardTitle as="h3">Assinantes ativos</CardTitle>
      <CardDescription>+12% no mês</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="nds-text-h4 nds-tabular-nums">8.742</p>
    </CardContent>
  </Card>
{:else if variant === 'playground'}
  <Card class={className} {size}>
    <CardHeader>
      <CardTitle as="h3">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="nds-text-h4">{productPrice}</p>
    </CardContent>
    <CardFooter class="nds-cluster" data-justify="end" data-spacing="md">
      <Button variant="outline" aria-label={`Editar produto ${title}`}>Editar</Button>
      <Button variant="destructive" aria-label={`Excluir produto ${title}`}>Excluir</Button>
    </CardFooter>
  </Card>
{:else if variant === 'withFooter'}
  <Card class={className} {size}>
    <CardHeader>
      <CardTitle as="h3">{title}</CardTitle>
      <CardDescription>Produto atualizado em 12/04.</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="nds-text-h4">{productPrice}</p>
    </CardContent>
    <CardFooter class="nds-cluster" data-justify="end" data-spacing="md">
      <Button variant="outline" aria-label={`Cancelar edição de ${title}`}>Cancelar</Button>
      <Button aria-label={`Salvar alterações em ${title}`} onclick={() => onPrimaryAction?.()}>
        Salvar
      </Button>
    </CardFooter>
  </Card>
{:else if variant === 'withAction'}
  <Card class={className} {size}>
    <CardHeader>
      <CardTitle as="h3">{title}</CardTitle>
      <CardDescription>Em estoque</CardDescription>
      <CardAction>
        <Button variant="ghost" size="sm" aria-label={`Editar produto ${title}`}>Editar</Button>
      </CardAction>
    </CardHeader>
    <CardContent>
      <p class="nds-text-body">{productPrice}</p>
    </CardContent>
  </Card>
{:else if variant === 'withImage'}
  <Card class={className} {size}>
    <img
      src={imageProduct}
      alt={`${title} vista de frente, em fundo neutro`}
      class="nds-w-full nds-aspect-16-9"
      style="object-fit: cover"
    />
    <CardHeader>
      <CardTitle as="h3">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="nds-text-h4">{productPrice}</p>
    </CardContent>
  </Card>
{:else if variant === 'clickable'}
  <a
    href="#produto-cadeira-gamer-pro"
    aria-label={`Abrir detalhes do produto ${title}`}
    class="nds-block nds-w-sm nds-text-left nds-focus-ring nds-rounded-xl"
    onclick={navegar}
  >
    <Card {size}>
      <CardHeader>
        <CardTitle as="h3">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="nds-text-h4">{productPrice}</p>
      </CardContent>
    </Card>
  </a>
{:else if variant === 'product'}
  <Card class={className} {size}>
    <img
      src={imageProduct}
      alt={`${title} vista de frente, em fundo neutro`}
      class="nds-w-full nds-aspect-16-9"
      style="object-fit: cover"
    />
    <CardHeader>
      <CardTitle as="h3">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
      <CardAction>
        <Badge variant="secondary">Em estoque</Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <p class="nds-text-h4">{productPrice}</p>
    </CardContent>
    <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
      <Button variant="outline" size="sm" aria-label={`Editar produto ${title}`}>Editar</Button>
      <Button variant="destructive" size="sm" aria-label={`Excluir produto ${title}`}>
        Excluir
      </Button>
    </CardFooter>
  </Card>
{:else if variant === 'profile'}
  <Card class={className} {size}>
    <CardHeader class="nds-cluster" data-align="center" data-spacing="sm">
      <Avatar>
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
      <div class="nds-flex-1">
        <CardTitle as="h3">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
    </CardHeader>
  </Card>
{:else if variant === 'metric'}
  <Card class="nds-w-xs" size="sm">
    <CardHeader>
      <CardTitle as="h3">Assinantes ativos</CardTitle>
      <CardDescription>Últimos 30 dias</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="nds-text-h4 nds-tabular-nums">8.742</p>
      <p class="nds-text-caption nds-text-success">+12% no mês</p>
    </CardContent>
  </Card>
{/if}
