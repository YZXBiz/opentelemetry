import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guideSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Part I: Foundations',
      collapsed: false,
      items: [
        'chapter-1-state-of-observability',
        'chapter-2-why-opentelemetry',
        'chapter-3-opentelemetry-overview',
        'chapter-4-architecture',
      ],
    },
    {
      type: 'category',
      label: 'Part II: Implementation',
      collapsed: false,
      items: [
        'chapter-5-instrumenting-applications',
        'chapter-6-instrumenting-libraries',
        'chapter-7-observing-infrastructure',
      ],
    },
    {
      type: 'category',
      label: 'Part III: Operations',
      collapsed: false,
      items: [
        'chapter-8-designing-pipelines',
        'chapter-9-rolling-out-observability',
      ],
    },
  ],
};

export default sidebars;
