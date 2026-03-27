import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Subtech Ajo Solution',
    short_name: 'Subtech Ajo',
    description: 'Save together, grow together. Digital Ajo savings platform.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#0F172A',
    icons: [
      {
        src: '/favicon.svg',
        sizes: '64x64',
        type: 'image/svg+xml',
      },
      {
        src: '/subtech-ajo-solution-mark.svg',
        sizes: '128x128',
        type: 'image/svg+xml',
      },
      {
        src: '/subtech-ajo-solution-mark-mono-dark.svg',
        sizes: '128x128',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
