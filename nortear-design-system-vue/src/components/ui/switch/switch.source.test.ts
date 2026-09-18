import { describe, expect, it } from 'vitest';
import {
  switchWithDescriptionSource,
  switchCompactoSource,
  switchDisabledSource,
  switchDesligadoSource,
  formSwitchSource,
  switchInvalidoSource,
  switchSemRotuloSource,
  switchLigadoSource,
  switchControlledSource,
  switchDefaultSource,
  configSwitchPanelSource,
  switchSource,
} from './switch.source';

describe('switchSource', () => {
  it('sem args, entrega o par mínimo: controle e rótulo vinculados pelo id', () => {
    expect(switchSource()).toBe(
      `<script setup lang="ts">
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
</script>

<template>
  <div class="nds-cluster" data-spacing="sm">
    <Switch id="notificacoes" />
    <Label for="notificacoes">Receber notificações</Label>
  </div>
</template>`,
    );
  });

  it('o nome do campo entra como veio do control', () => {
    expect(switchSource('', { args: { name: 'alertas' } })).toContain(
      '<Switch id="notificacoes" name="alertas" />',
    );
  });

  it('o degrau padrão não é escrito, o compacto é', () => {
    expect(switchSource('', { args: { size: 'default' } })).not.toContain('size=');
    expect(switchSource('', { args: { size: 'sm' } })).toContain('size="sm"');
  });

  it('os booleanos só aparecem quando desligam do padrão', () => {
    const desligados = switchSource('', {
      args: { defaultValue: false, disabled: false, required: false },
    });
    expect(desligados).not.toContain('default-value');
    expect(desligados).not.toContain('disabled');
    expect(desligados).not.toContain('required');

    const ligados = switchSource('', {
      args: { defaultValue: true, disabled: true, required: true },
    });
    expect(ligados).toContain('<Switch id="notificacoes" default-value required disabled />');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = switchSource('', { args: { name: (() => {}) as never } });
    expect(output).not.toContain('function');
    expect(output).not.toContain('name=');
  });
});

describe('transforms das stories de variante', () => {
  it('a padrão é o par mínimo, sem nem o nome de campo', () => {
    expect(switchDefaultSource()).toContain('<Switch id="notificacoes" />');
    expect(switchDefaultSource()).not.toContain('name=');
  });

  it('com descrição, o parágrafo fica FORA do rótulo', () => {
    const output = switchWithDescriptionSource();
    // Dentro do Label, o parágrafo viraria parte do nome acessível do controle.
    expect(output).toContain('<Label for="marketing">Emails de marketing</Label>');
    expect(output).toContain(
      '<p class="nds-text-body">Receba novidades e promoções da plataforma.</p>',
    );
    expect(output).toContain('data-justify="between"');
  });

  it('o compacto mostra os DOIS degraus — a comparação é o assunto', () => {
    const output = switchCompactoSource();
    expect(output).toContain('<Switch id="tamanho-padrao" />');
    expect(output).toContain('<Switch id="tamanho-compacto" size="sm" />');
    expect([...output.matchAll(/<Switch /g)]).toHaveLength(2);
  });
});

describe('transforms das stories de estado', () => {
  it('o repouso não escreve prop nenhuma — o switch nasce desligado', () => {
    const output = switchDesligadoSource();
    expect(output).toContain('<Switch id="notificacoes" />');
    expect(output).not.toContain('default-value');
  });

  it('o ligado parte de `default-value`, que é prop de montagem', () => {
    expect(switchLigadoSource()).toContain('<Switch id="notificacoes" default-value />');
    // `modelValue` é a via controlada; misturar as duas no mesmo exemplo ensina
    // um estado que briga consigo mesmo.
    expect(switchLigadoSource()).not.toContain('v-model');
  });

  it('o desabilitado escreve só `disabled`', () => {
    expect(switchDisabledSource()).toContain('<Switch id="notificacoes" disabled />');
  });

  it('o inválido aponta para a mensagem, e a mensagem tem o id apontado', () => {
    const output = switchInvalidoSource();
    expect(output).toContain('aria-invalid="true" aria-describedby="aceitar-termos-erro"');
    expect(output).toContain('<p id="aceitar-termos-erro"');
    expect(output).toContain('nds-border-destructive');
  });
});

describe('transforms das stories de composição', () => {
  it('a lista dá a cada painel um id próprio — ids repetidos quebram o vínculo', () => {
    const output = configSwitchPanelSource();
    const ids = [...output.matchAll(/<Switch id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(ids.length);
    // Uma preferência nasce ligada e duas desligadas, como a lista demonstra.
    expect([...output.matchAll(/default-value/g)]).toHaveLength(1);
    expect(output).toContain('Preferências de notificação');
  });

  it('a descrição de cada painel fica FORA do rótulo', () => {
    // Dentro do `Label` ela entraria no nome acessível, e quem usa leitor de
    // tela ouviria a frase inteira a cada passagem pelo controle.
    const output = configSwitchPanelSource();
    expect(output).not.toMatch(/<Label[^>]*>[^<]*Resumo semanal/);
    expect(output).toContain('<p class="nds-text-body">Resumo semanal sobre o produto.</p>');
  });

  it('no formulário é o `name` que faz o campo ser enviado', () => {
    const output = formSwitchSource();
    expect(output).toContain('name="newsletter"');
    expect(output).toContain(`import { Button } from '@/components/ui/button'`);
    expect(output).toContain('<Button type="submit">Salvar preferências</Button>');
  });

  it('sem rótulo visível, o nome vive em aria-label — e existe', () => {
    const output = switchSemRotuloSource();
    expect(output).toContain('aria-label="Ativar modo escuro"');
    // É a única composição em que o par rótulo ↔ controle não aparece; se um
    // `<Label>` voltasse aqui, o exemplo deixaria de ensinar o que se propõe.
    expect(output).not.toContain('<Label');
  });

  it('o controlado escreve a ligação de volta, não só o valor', () => {
    // Ligar só o valor deixa o interruptor inerte: ele deixa de ser dono do
    // próprio estado e ninguém assume o lugar.
    const output = switchControlledSource();
    expect(output).toContain('v-model="ativo"');
    expect(output).toContain('const ativo = ref(false)');
  });
});
