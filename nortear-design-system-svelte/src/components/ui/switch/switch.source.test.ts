import { describe, expect, it } from 'vitest';
import { switchSource } from './switch.source';

describe('switchSource', () => {
  it('sem args, entrega a forma canônica: o controle e o rótulo que o nomeia', () => {
    expect(switchSource()).toBe(
      `<script lang="ts">
  import { Switch } from "@/components/ui/switch";
  import { Label } from "@/components/ui/label";

  let ligado = $state(false);
</script>

<div class="nds-cluster" data-spacing="sm">
  <Switch id="opcao" bind:checked={ligado} aria-labelledby="opcao-label" />
  <Label id="opcao-label" for="opcao" class="nds-text-body nds-font-medium">
    Receber notificações por email
  </Label>
</div>`,
    );
  });

  it('acompanha o control de estado no valor inicial', () => {
    expect(switchSource('', { args: { checked: false } })).toContain('$state(false)');
    expect(switchSource('', { args: { checked: true } })).toContain('$state(true)');
  });

  it('só escreve disabled, size e aria-invalid quando diferem do padrão', () => {
    const padrao = switchSource();
    expect(padrao).not.toContain('disabled');
    expect(padrao).not.toContain('size=');
    expect(padrao).not.toContain('aria-invalid');

    expect(switchSource('', { args: { disabled: true } })).toContain('disabled');
    expect(switchSource('', { args: { size: 'sm' } })).toContain('size="sm"');
    expect(switchSource('', { args: { ariaInvalid: true } })).toContain('aria-invalid="true"');
  });

  it('o nome do campo de formulário só entra quando a story o declara', () => {
    expect(switchSource()).not.toContain('name=');
    expect(switchSource('', { args: { name: 'notificacoes' } })).toContain('name="notificacoes"');
  });

  it('acompanha o texto do rótulo', () => {
    expect(switchSource('', { args: { labelText: 'Modo escuro' } })).toContain('Modo escuro');
  });

  it('o layout em painel acrescenta a descrição auxiliar, sem promovê-la a nome', () => {
    const painel = switchSource('', {
      args: {
        withDescription: true,
        labelText: 'Emails de marketing',
        descriptionText: 'Receba novidades e promoções da plataforma.',
      },
    });
    expect(painel).toContain('aria-labelledby="opcao-label"');
    expect(painel).toContain('aria-describedby="opcao-description"');
    expect(painel).toContain('<p id="opcao-description" class="nds-text-body">');
    expect(painel).toContain('data-justify="between"');
  });

  it('sem rótulo visível, o nome acessível passa a vir de aria-label', () => {
    const nu = switchSource('', { args: { withLabel: false, ariaLabel: 'Ativar modo escuro' } });
    expect(nu).toContain('aria-label="Ativar modo escuro"');
    expect(nu).not.toContain('aria-labelledby');
    // Sem rótulo não há Label a importar — o snippet não ensina um import morto.
    expect(nu).not.toContain('@/components/ui/label');
    expect(nu).not.toContain('<Label');
  });

  it('quando a fila de props não cabe na linha, escreve uma por linha', () => {
    const longo = switchSource('', {
      args: { name: 'notificacoes', size: 'sm', disabled: true, ariaInvalid: true },
    });
    expect(longo).toContain(`  <Switch
    id="opcao"
    bind:checked={ligado}
    name="notificacoes"
    size="sm"
    disabled
    aria-invalid="true"
    aria-labelledby="opcao-label"
  />`);
  });
});
