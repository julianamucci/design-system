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
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

  type Variant =
    | 'default'
    | 'small'
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
    productStock?: string;
    actionEdit?: string;
    actionDelete?: string;
    actionCancel?: string;
    actionSave?: string;
    metricValue?: string;
    metricTrend?: string;
    imageAlt?: string;
    imageSrc?: string;
    class?: string;
  }

  let {
    variant = 'default',
    size = 'default',
    title = 'Cadeira Gamer Pro',
    description = 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
    productPrice = 'R$ 1.299,00',
    productStock = 'Em estoque',
    actionEdit = 'Editar',
    actionDelete = 'Excluir',
    actionCancel = 'Cancelar',
    actionSave = 'Salvar',
    metricValue = '8.742',
    metricTrend = '+12% no mês',
    imageAlt = 'Cadeira Gamer Pro',
    imageSrc = 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?auto=format&fit=crop&w=640&q=80',
    class: className = '',
  }: Props = $props();
</script>

{#if variant === 'default'}
  <Card class={className} {size}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="text-sm text-muted-foreground">{productPrice} · {productStock}</p>
    </CardContent>
  </Card>
{:else if variant === 'small'}
  <Card class={className} size="sm">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="text-sm text-muted-foreground">{metricValue}</p>
    </CardContent>
  </Card>
{:else if variant === 'withFooter'}
  <Card class={className} {size}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="text-sm text-muted-foreground">{productPrice} · {productStock}</p>
    </CardContent>
    <CardFooter class="justify-end gap-2">
      <Button variant="outline" size="sm">{actionCancel}</Button>
      <Button size="sm">{actionSave}</Button>
    </CardFooter>
  </Card>
{:else if variant === 'withAction'}
  <Card class={className} {size}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
      <CardAction>
        <Button variant="ghost" size="sm" aria-label={`${actionEdit} ${title}`}>{actionEdit}</Button>
      </CardAction>
    </CardHeader>
    <CardContent>
      <p class="text-sm text-muted-foreground">{productPrice} · {productStock}</p>
    </CardContent>
  </Card>
{:else if variant === 'withImage'}
  <Card class={className} {size}>
    <img src={imageSrc} alt={imageAlt} class="aspect-[4/3] w-full object-cover" />
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p class="text-sm text-muted-foreground">{productPrice} · {productStock}</p>
    </CardContent>
  </Card>
{:else if variant === 'clickable'}
  <a
    href="#card"
    aria-label={`Abrir ${title}`}
    class="block rounded-(--radius-card) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    <Card class={className} {size}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">{productPrice} · {productStock}</p>
      </CardContent>
    </Card>
  </a>
{:else if variant === 'product'}
  <Card class={className} {size}>
    <img src={imageSrc} alt={imageAlt} class="aspect-[4/3] w-full object-cover" />
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
      <CardAction>
        <Badge variant="secondary">{productStock}</Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <p class="text-base font-semibold">{productPrice}</p>
    </CardContent>
    <CardFooter class="justify-end gap-2">
      <Button variant="outline" size="sm" aria-label={`${actionEdit} produto ${title}`}>
        {actionEdit}
      </Button>
      <Button variant="destructive" size="sm" aria-label={`${actionDelete} produto ${title}`}>
        {actionDelete}
      </Button>
    </CardFooter>
  </Card>
{:else if variant === 'profile'}
  <Card class={className} {size}>
    <CardHeader>
      <div class="flex items-center gap-3">
        <Avatar>
          <AvatarImage src="https://i.pravatar.cc/80?img=47" alt={title} />
          <AvatarFallback>MR</AvatarFallback>
        </Avatar>
        <div class="flex flex-col">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardFooter class="justify-end gap-2">
      <Button variant="outline" size="sm">{actionEdit}</Button>
    </CardFooter>
  </Card>
{:else if variant === 'metric'}
  <Card class={className} size="sm">
    <CardHeader>
      <CardDescription>{title}</CardDescription>
      <CardTitle class="text-2xl font-semibold tabular-nums">{metricValue}</CardTitle>
    </CardHeader>
    <CardContent>
      <p class="text-xs text-emerald-700 dark:text-emerald-300">{metricTrend}</p>
    </CardContent>
  </Card>
{/if}
