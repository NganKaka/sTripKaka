import { useEffect } from 'react';

const DEFAULT_SITE_URL = 'https://stripkaka.example.com';
const DEFAULT_OG_IMAGE = '/og-default.jpg';

const SITE_URL = (import.meta.env.VITE_SITE_URL?.trim() || DEFAULT_SITE_URL).replace(/\/+$/, '');

type SeoProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function setJsonLd(payload: SeoProps['jsonLd']) {
  const id = 'seo-jsonld';
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  if (!payload) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.text = JSON.stringify(payload);
  document.head.appendChild(script);
}

export default function Seo({ title, description, path, image, type = 'website', jsonLd }: SeoProps) {
  useEffect(() => {
    const url = path ? `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}` : SITE_URL;
    const ogImage = image || `${SITE_URL}${DEFAULT_OG_IMAGE}`;

    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setLink('canonical', url);

    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:type"]', 'property', 'og:type', type);
    setMeta('meta[property="og:image"]', 'property', 'og:image', ogImage);

    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    setJsonLd(jsonLd);
  }, [title, description, path, image, type, jsonLd]);

  return null;
}

export { SITE_URL };
