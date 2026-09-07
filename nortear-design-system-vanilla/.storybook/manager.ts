// Customização da UI do Storybook (sidebar/topbar) — substitui a marca Storybook
// pela marca Nortear. Roda no manager (iframe externo), não no preview.
import React from 'react';
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';
import brandImage from './brand-logo.svg';
import { createRenderLabel } from '../../docs/shared/primitives/sidebar-i18n';

const nortear = create({
  base: 'light',
  brandTitle: 'Nortear',
  brandUrl: '/',
  brandImage,
  brandTarget: '_self',
});

// A sidebar traduz só a ESTRUTURA — seções, subseções e fundamentos. Nome de
// componente e de story ficam em inglês: são 607 nomes distintos, e o dicionário
// por palavra não economiza nada (as 200 palavras mais comuns cobrem 70% dos
// usos). O idioma vem do mesmo `ds-locale` que as docs pages usam.
addons.setConfig({ theme: nortear, sidebar: { renderLabel: createRenderLabel(React) } });

// Botão "Chromatic" na toolbar — ver ./chromatic-link.ts para o porquê de não
// ser o painel do addon oficial.
import './chromatic-link';


// ─── Chat de documentação ────────────────────────────────────────────────────
//
// Ele NÃO é importado daqui, e a ausência é a informação: o `builder-manager`
// empacota este arquivo com um esbuild de configuração fechada, sem hook de
// alias, e as peças do design system importam `@/lib/*` e `@shared/primitives/*`.
// MEDIDO: 18 erros de resolução ao importá-las aqui. O porquê completo e o que
// foi tentado estão em ../vite.chat-docs.config.ts.
//
// O chat é empacotado pelo mesmo Vite do preview e carregado por
// `<script type="module">` em ./manager-head.html. O código vive em
// ./chat-docs/ — no manager, e não no preview, porque o preview recarrega a
// cada troca de story.
