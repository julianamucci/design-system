import { describe, expect, it } from 'vitest';
import {
  avatarCarregadoSource,
  avatarLoadingSource,
  avatarWithIconSource,
  avatarWithImageSource,
  avatarWithIniciaisSource,
  avatarWithStatusSource,
  avatarGroupSource,
  avatarLgSource,
  avatarMdSource,
  avatarNoImageSource,
  avatarSmSource,
  avatarSource,
  avatarTwoXlSource,
  avatarXlSource,
} from './avatar.source';

describe('avatarSource', () => {
  it('sem args, entrega a forma canônica com foto e reserva', () => {
    expect(avatarSource()).toBe(
      `<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
</script>

<template>
  <Avatar>
    <AvatarImage
      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format"
      alt="Foto de perfil de Maria Rodrigues"
    />
    <AvatarFallback :delay-ms="600">MR</AvatarFallback>
  </Avatar>
</template>`,
    );
  });

  it('o preset padrão não é escrito, e o resto entra', () => {
    expect(avatarSource('', { args: { size: 'md' } })).toContain('<Avatar>');
    expect(avatarSource('', { args: { size: '2xl' } })).toContain('<Avatar size="2xl">');
  });

  it('a classe do consumidor entra na raiz — ela SOMA à do componente', () => {
    expect(avatarSource('', { args: { class: 'nds-shadow-sm' } })).toContain(
      '<Avatar class="nds-shadow-sm">',
    );
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = avatarSource('', {
      args: { size: (() => {}) as never, class: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).toContain('<Avatar>');
  });
});

describe('transforms das stories de preset', () => {
  it('cada preset escreve o próprio valor', () => {
    expect(avatarSmSource()).toContain('<Avatar size="sm">');
    expect(avatarLgSource()).toContain('<Avatar size="lg">');
    expect(avatarXlSource()).toContain('<Avatar size="xl">');
    expect(avatarTwoXlSource()).toContain('<Avatar size="2xl">');
  });

  it('o preset padrão sai sem prop nenhuma', () => {
    // Escrevê-lo ensinaria que a prop é obrigatória.
    const output = avatarMdSource();
    expect(output).toContain('<Avatar>');
    expect(output).not.toContain('size=');
  });

  it('nenhum preset traz diâmetro à mão: ele sai da prop', () => {
    for (const fn of [avatarSmSource, avatarMdSource, avatarTwoXlSource]) {
      expect(fn()).not.toContain('nds-size-');
      expect(fn()).not.toContain('width');
    }
  });
});

describe('transforms das stories de estado', () => {
  it('a marcação do carregado não declara estado nenhum', () => {
    const output = avatarCarregadoSource();
    expect(output).toContain('<AvatarImage src=');
    expect(output).toContain('<AvatarFallback>MR</AvatarFallback>');
    // Quem escolhe entre foto e reserva é o componente.
    expect(output).not.toContain('v-if');
    expect(output).not.toContain('delay-ms');
  });

  it('a espera com atraso põe o prazo no conteúdo de RESERVA, não na imagem', () => {
    const output = avatarLoadingSource();
    expect(output).toContain('<AvatarFallback :delay-ms="600">MR</AvatarFallback>');
    expect(output).not.toContain('<AvatarImage :delay-ms');
    // O src quebrado da story existe para forçar o desfecho; ninguém escreve um.
    expect(output).not.toContain('example.invalid');
  });

  it('sem imagem, a reserva assume o papel e o rótulo do avatar', () => {
    const output = avatarNoImageSource();
    expect(output).toContain(`import { Avatar, AvatarFallback } from '@/components/ui/avatar'`);
    expect(output).not.toContain('AvatarImage');
    expect(output).toContain('<AvatarFallback role="img" aria-label="Usuário genérico">');
    // Escondê-la deixaria o avatar sem nome acessível nenhum.
    expect(output).not.toContain('aria-hidden="true">');
    expect(output).toContain('      <svg\n        aria-hidden="true"');
  });
});

describe('transforms das stories de composição', () => {
  it('a composição com foto segura as iniciais pelo prazo', () => {
    expect(avatarWithImageSource()).toContain('<AvatarFallback :delay-ms="600">MR</AvatarFallback>');
  });

  it('só iniciais dispensa imagem, import e espera', () => {
    const output = avatarWithIniciaisSource();
    expect(output).not.toContain('AvatarImage');
    expect(output).not.toContain('delay-ms');
    expect(output).toContain('<AvatarFallback>JP</AvatarFallback>');
  });

  it('o ícone é o mesmo caso de sem-imagem, e sai idêntico', () => {
    expect(avatarWithIconSource()).toBe(avatarNoImageSource());
  });

  it('no grupo, quem nomeia é o conjunto — cada foto vai com alt vazio', () => {
    const output = avatarGroupSource();
    expect(output).toContain('<AvatarGroup role="group" aria-label="Participantes">');
    expect(output.match(/<Avatar>/g)).toHaveLength(3);
    // Um nome por avatar faria o leitor de tela recitar a lista inteira.
    expect(output.match(/alt=""/g)).toHaveLength(3);
    expect(output).toContain('<AvatarGroupCount aria-hidden="true">+3</AvatarGroupCount>');
    const iniciais = [...output.matchAll(/<AvatarFallback>([^<]+)</g)].map((m) => m[1]);
    expect(new Set(iniciais).size).toBe(3);
  });

  it('o selo de situação carrega o próprio rótulo, e é o último filho', () => {
    const output = avatarWithStatusSource();
    expect(output).toContain('<AvatarBadge role="img" aria-label="Online" />');
    // Cor sozinha não diz nada a quem não a vê.
    expect(output.indexOf('<AvatarBadge')).toBeGreaterThan(output.indexOf('<AvatarFallback'));
  });
});
