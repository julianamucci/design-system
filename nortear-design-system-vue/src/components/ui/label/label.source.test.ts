import { describe, expect, it } from 'vitest';
import {
  selectionLabelWithBoxSource,
  labelWithFieldSource,
  labelDisabledPeloGroupSource,
  labelDisabledSource,
  labelObrigatorioSource,
  labelDefaultSource,
  labelSource,
} from './label.source';

const ALL = [
  labelSource,
  labelDefaultSource,
  labelDisabledSource,
  labelDisabledPeloGroupSource,
  labelObrigatorioSource,
  labelWithFieldSource,
  selectionLabelWithBoxSource,
];

describe('labelSource', () => {
  it('sem args, entrega o par rótulo + campo na forma canônica', () => {
    expect(labelSource()).toBe(
      `<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
</script>

<template>
  <div class="nds-stack nds-w-xs" data-spacing="xs">
    <Label for="nome-completo">Nome completo</Label>
    <Input id="nome-completo" type="text" placeholder="ex: João da Silva" />
  </div>
</template>`,
    );
  });

  it('o control de destino move os DOIS lados do par', () => {
    // Mover só o `for` deixaria o snippet com uma associação quebrada — e é
    // justamente essa igualdade que o componente inteiro produz.
    const output = labelSource('', { args: { for: 'email-corporativo' } });
    expect(output).toContain('<Label for="email-corporativo">');
    expect(output).toContain('<Input id="email-corporativo"');
  });

  it('não escreve class vazia no rótulo', () => {
    // `class=""` no snippet é ruído que quem copia leva junto.
    expect(labelSource('', { args: { class: '' } })).toContain('<Label for="nome-completo">');
  });

  it('acrescenta a classe extra quando o control traz uma', () => {
    expect(labelSource('', { args: { class: 'nds-text-caption' } })).toContain(
      '<Label for="nome-completo" class="nds-text-caption">',
    );
  });

  it('ignora control que não é string — o espião vira ruído no painel', () => {
    const output = labelSource('', {
      args: { for: (() => {}) as never, class: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('class="undefined"');
    expect(output).toContain('<Label for="nome-completo">');
  });
});

describe('contrato comum a todo snippet de rótulo', () => {
  it('o rótulo nunca aparece sozinho — ele é metade de um par', () => {
    // Isolado, o `<Label>` é a única forma em que ele não produz nada: sem
    // controle não há nome acessível, nem clique que leve o foco.
    for (const fn of ALL) expect(fn()).toMatch(/<(Input|Checkbox)\b/);
  });

  it('o for do rótulo e o id do controle carregam o mesmo valor', () => {
    for (const fn of ALL) {
      const output = fn();
      const target = /<Label for="([^"]+)"/.exec(output)?.[1];
      expect(target).toBeTruthy();
      expect(output).toContain(`id="${target}"`);
    }
  });
});

describe('transforms das stories de estado', () => {
  it('o desabilitado pelo irmão marca o CONTROLE, e o rótulo não recebe prop', () => {
    const output = labelDisabledSource();
    // Sem `nds-peer` no controle a folha não alcança o rótulo: o campo apaga e
    // o rótulo fica aceso, prometendo interação que não existe.
    expect(output).toContain('class="nds-peer"');
    expect(output).toContain(' disabled />');
    expect(output).toMatch(/<Label for="cpf">CPF<\/Label>/);
  });

  it('o desabilitado pelo grupo age do contêiner, sem tocar o controle irmão', () => {
    const output = labelDisabledPeloGroupSource();
    expect(output).toContain('data-disabled="true"');
    expect(output).not.toContain('nds-peer');
  });

  it('os dois caminhos de desabilitar não se misturam', () => {
    // Um snippet com os dois ensinaria que é preciso escrever ambos.
    expect(labelDisabledSource()).not.toContain('data-disabled');
  });

  it('o obrigatório traz o asterisco decorativo e o anúncio no controle', () => {
    const output = labelObrigatorioSource();
    expect(output).toContain('<span class="nds-text-destructive" aria-hidden="true">*</span>');
    expect(output).toContain('aria-required="true"');
    // O asterisco fica DENTRO do rótulo, e fora da leitura: sem `aria-hidden` o
    // nome acessível do campo viraria "Email profissional asterisco".
    expect(output.indexOf('aria-hidden="true"')).toBeLessThan(output.indexOf('</Label>'));
  });
});

describe('transforms das stories de composição', () => {
  it('com campo de texto, o rótulo vem ANTES do controle', () => {
    const output = labelWithFieldSource();
    expect(output.indexOf('<Label')).toBeLessThan(output.indexOf('<Input'));
    expect(output).toContain('type="tel"');
  });

  it('com caixa de seleção, a ordem se inverte e o bloco deita', () => {
    const output = selectionLabelWithBoxSource();
    expect(output).toContain('<div class="nds-cluster" data-spacing="sm">');
    expect(output.indexOf('<Checkbox')).toBeLessThan(output.indexOf('<Label'));
    expect(output).toContain(`import { Checkbox } from '@/components/ui/checkbox'`);
    // Nada de Input nesta composição: o controle é outro.
    expect(output).not.toContain('<Input');
  });
});
