import { createComponentDemo } from '@/components/ComponentDemo';

export interface DocsDemonstrationProps {
  title: string;
  demoFactory: () => HTMLElement;
}

export function createDocsDemonstration(props: DocsDemonstrationProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'demonstracao';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;

  const demo = createComponentDemo(props.demoFactory());

  section.append(h2, demo);
  return section;
}
