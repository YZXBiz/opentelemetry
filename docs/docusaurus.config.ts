import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'OpenTelemetry Guide',
  tagline: 'Master OpenTelemetry for Modern Observability',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // GitHub Pages deployment configuration
  url: 'https://YZXBiz.github.io',
  baseUrl: '/opentelemetry/',
  organizationName: 'YZXBiz',
  projectName: 'opentelemetry',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/', // Docs at root (no /docs prefix)
          editUrl: 'https://github.com/YZXBiz/opentelemetry/tree/master/docs/',
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'OpenTelemetry Guide',
      logo: {
        alt: 'OpenTelemetry Guide Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: 'Guide',
        },
        {
          href: 'https://github.com/YZXBiz/opentelemetry',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Guide',
          items: [
            {label: 'Introduction', to: '/'},
            {label: 'Why OpenTelemetry?', to: '/chapter-2-why-opentelemetry'},
          ],
        },
        {
          title: 'Resources',
          items: [
            {label: 'OpenTelemetry Official', href: 'https://opentelemetry.io'},
            {label: 'CNCF', href: 'https://www.cncf.io'},
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/YZXBiz/opentelemetry',
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} OpenTelemetry Guide. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml', 'json', 'go', 'java', 'python', 'csharp'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
