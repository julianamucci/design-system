<script lang="ts">
  import { Tabs, TabsList, TabsTrigger, TabsContent, type TabsListVariant } from './index';

  interface TabItem {
    value: string;
    label: string;
    content: string;
    disabled?: boolean;
  }

  interface Props {
    items?: TabItem[];
    defaultValue?: string;
    variant?: TabsListVariant;
    orientation?: 'horizontal' | 'vertical';
    activationMode?: 'automatic' | 'manual';
    ariaLabel?: string;
    class?: string;
    listClass?: string;
    contentClass?: string;
  }

  let {
    items = [
      { value: 'overview',   label: 'Visão geral',  content: 'Conteúdo da visão geral' },
      { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades'   },
      { value: 'examples',   label: 'Exemplos',     content: 'Exemplos de uso'         },
    ],
    defaultValue,
    variant = 'default',
    orientation = 'horizontal',
    activationMode = 'automatic',
    ariaLabel = 'Seções do componente',
    class: className = 'w-full max-w-lg',
    listClass = '',
    contentClass = '',
  }: Props = $props();

  let value = $state<string>(defaultValue ?? items[0]?.value ?? '');
</script>

<Tabs bind:value {orientation} {activationMode} class={className}>
  <TabsList {variant} class={listClass} aria-label={ariaLabel}>
    {#each items as item (item.value)}
      <TabsTrigger value={item.value} disabled={item.disabled}>{item.label}</TabsTrigger>
    {/each}
  </TabsList>
  {#each items as item (item.value)}
    <TabsContent value={item.value} class={contentClass}>{item.content}</TabsContent>
  {/each}
</Tabs>
