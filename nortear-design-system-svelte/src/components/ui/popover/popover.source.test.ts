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

  let open = $state(false);

  function salvar() {
    // Salvou: fecha por CÓDIGO. Só o Cancelar é \`PopoverClose\` — é a diferença
    // entre os dois caminhos que separa "desistiu" de "concluiu" no relatório.
    open = false;
  }
</script>

<Popover bind:open={open}>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Abrir popover</Button>
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
          <Button variant="ghost" size="sm" {...props}>Cancelar</Button>
        {/snippet}
      </PopoverClose>
      <Button size="sm" onclick={salvar}>Salvar</Button>
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
    expect(isOpen).toContain('let open = $state(true);');
    expect(isOpen).toContain('<Popover bind:open={open}>');
    // Sem rodapé de confirmação E fechado na montagem, não há o que ligar: a
    // composição de conteúdo livre segue sem estado nenhum.
    expect(popoverSource('', { args: { variant: 'default' } })).not.toContain('bind:open');
  });

  it('o rodapé com confirmação leva estado mesmo nascendo fechado', () => {
    // O botão de confirmação fecha por CÓDIGO, e escrever no `bind:open` é o
    // que fecha — sem o estado, o snippet ensinaria um botão inerte, que é o
    // defeito medido em três stacks.
    for (const variant of ['withTitle', 'form', 'tableFilter'] as const) {
      const saida = popoverSource('', { args: { variant } });
      expect(saida).toContain('let open = $state(false);');
      expect(saida).toContain('<Popover bind:open={open}>');
      expect(saida).toContain('open = false;');
    }
  });

  it('só o Cancelar é PopoverClose — o confirmar fecha por código', () => {
    // Envolver o confirmar na peça de fechar reportaria `close-button`, e
    // "concluiu" chegaria ao relatório como "apertou o botão de fechar".
    const saida = popoverSource();
    const dentroDoClose = saida.slice(
      saida.indexOf('<PopoverClose>'),
      saida.indexOf('</PopoverClose>'),
    );
    expect(dentroDoClose).toContain('Cancelar');
    expect(dentroDoClose).not.toContain('Salvar');
    expect(saida).toContain('<Button size="sm" onclick={salvar}>Salvar</Button>');
  });

  it('o rótulo do gatilho acompanha o control', () => {
    expect(popoverSource('', { args: { triggerLabel: 'Ver atalhos' } })).toContain(
      '<Button variant="outline" {...props}>Ver atalhos</Button>',
    );
  });

  it('a composição sem título traz só o texto, e importa só as três peças', () => {
    const saida = popoverSource('', {
      args: { variant: 'default', description: 'Use Ctrl+K para abrir a busca.' },
    });
    expect(saida).toContain('<p>Use Ctrl+K para abrir a busca.</p>');
    expect(saida).not.toContain('PopoverTitle');
  });

  it('a composição de formulário traz estado, campos rotulados e submit', () => {
    const saida = popoverSource('', { args: { variant: 'form' } });
    expect(saida).toContain('import { Input } from "@/components/ui/input";');
    expect(saida).toContain('import { Label } from "@/components/ui/label";');
    expect(saida).toContain('let nome = $state("Ana Ribeiro");');
    expect(saida).toContain('<Label for="perfil-nome">Nome</Label>');
    expect(saida).toContain('<Button type="submit" size="sm">Atualizar</Button>');
    // O fechamento vai no `submit`, depois do `preventDefault` — no `click` do
    // botão ele cancelaria o próprio submit.
    expect(saida).toContain(`function salvar(evento: SubmitEvent) {`);
    expect(saida).toMatch(/evento\.preventDefault\(\);\n\s*open = false;/);
  });

  it('a composição de filtro combina status e oferece Limpar / Aplicar', () => {
    const saida = popoverSource('', { args: { variant: 'tableFilter' } });
    expect(saida.match(/type="checkbox"/g)).toHaveLength(3);
    expect(saida).toContain('<Button size="sm" onclick={aplicar}>Aplicar</Button>');
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
