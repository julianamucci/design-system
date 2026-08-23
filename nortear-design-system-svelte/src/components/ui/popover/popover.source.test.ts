import { describe, expect, it } from 'vitest';
import { popoverSource } from './popover.source';

describe('popoverSource', () => {
  it('sem args, entrega a composição canônica com cabeçalho e ações', () => {
    expect(popoverSource()).toBe(
      `<script lang="ts">
  import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
    PopoverClose,
  } from "@/components/ui/popover";
  import { Button } from "@/components/ui/button";
</script>

<Popover>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button {...props}>Abrir popover</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Configurações de exibição</PopoverTitle>
      <PopoverDescription>Ajuste a aparência do conteúdo da página.</PopoverDescription>
    </PopoverHeader>
    <div class="nds-cluster" data-justify="end" data-spacing="sm">
      <PopoverClose>
        {#snippet child({ props })}
          <Button variant="outline" size="sm" {...props}>Cancelar</Button>
        {/snippet}
      </PopoverClose>
      <Button size="sm">Salvar</Button>
    </div>
  </PopoverContent>
</Popover>`,
    );
  });

  it('nunca importa do arquivo interno nem da lib headless', () => {
    // O leitor importa do design system; o caminho do `.svelte` interno é
    // detalhe de implementação e não sobrevive a uma reorganização de pasta.
    const saida = popoverSource();
    expect(saida).toContain('from "@/components/ui/popover"');
    expect(saida).not.toContain('.svelte');
  });

  it('só escreve side, align e sideOffset quando diferem do padrão', () => {
    expect(popoverSource()).toContain('<PopoverContent>');
    const movido = popoverSource('', { args: { side: 'top', sideOffset: 12 } });
    expect(movido).toContain('<PopoverContent side="top" sideOffset={12}>');
    expect(popoverSource('', { args: { align: 'start' } })).toContain('align="start"');
  });

  it('o painel que nasce aberto vira estado local com bind:open', () => {
    // `open` é bindable: um valor cravado congelaria o painel aberto, e o
    // snippet ensinaria um popover que não fecha.
    const isOpen = popoverSource('', { args: { defaultOpen: true } });
    expect(isOpen).toContain('let aberto = $state(true);');
    expect(isOpen).toContain('<Popover bind:open={aberto}>');
    expect(popoverSource()).not.toContain('bind:open');
  });

  it('o rótulo do gatilho acompanha o control', () => {
    expect(popoverSource('', { args: { triggerLabel: 'Ver atalhos' } })).toContain(
      '<Button {...props}>Ver atalhos</Button>',
    );
  });

  it('a composição sem título traz só o texto, e importa só as três peças', () => {
    const saida = popoverSource('', {
      args: { variant: 'default', description: 'Use Ctrl + K para abrir a busca.' },
    });
    expect(saida).toContain('<p class="nds-text-body">Use Ctrl + K para abrir a busca.</p>');
    expect(saida).not.toContain('PopoverTitle');
  });

  it('a composição de formulário traz estado, campos rotulados e submit', () => {
    const saida = popoverSource('', { args: { variant: 'form' } });
    expect(saida).toContain('import { Input } from "@/components/ui/input";');
    expect(saida).toContain('import { Label } from "@/components/ui/label";');
    expect(saida).toContain('let nome = $state("Ana Ribeiro");');
    expect(saida).toContain('<Label for="perfil-nome">Nome</Label>');
    expect(saida).toContain('<Button type="submit" size="sm">Atualizar</Button>');
  });

  it('a composição de filtro combina status e oferece Limpar / Aplicar', () => {
    const saida = popoverSource('', { args: { variant: 'tableFilter' } });
    expect(saida.match(/type="checkbox"/g)).toHaveLength(3);
    expect(saida).toContain('<Button size="sm">Aplicar</Button>');
  });

  it('cada amostra da paleta carrega nome acessível próprio', () => {
    // A cor não é o nome: sem `aria-label` o botão fica sem nome nenhum.
    const saida = popoverSource('', { args: { variant: 'colorPicker' } });
    expect(saida.match(/aria-label="/g)).toHaveLength(6);
  });

  it('as preferências rápidas são independentes entre si', () => {
    const saida = popoverSource('', { args: { variant: 'quickSettings' } });
    expect(saida).toContain('<span>Notificações</span>');
    expect(saida.match(/type="checkbox"/g)).toHaveLength(3);
  });
});
