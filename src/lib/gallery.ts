export type GalleryImageTuple = [string, string, string];
export type GalleryTagTuple = [string[], string[], string[]];

export type GalleryNode = {
  uid?: string;
  title: string;
  description: string;
  images: GalleryImageTuple;
  image_tags: GalleryTagTuple;
};

export const normalizeNodeImages = (images: string[] = []): GalleryImageTuple => [
  images[0] || '',
  images[1] || '',
  images[2] || '',
];

export const normalizeNodeTags = (tags: unknown): GalleryTagTuple => {
  const values = Array.isArray(tags) ? tags : [];
  return [0, 1, 2].map(index => {
    const current = values[index];
    if (!Array.isArray(current)) return [];
    return current
      .filter((tag): tag is string => typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(Boolean);
  }) as GalleryTagTuple;
};

export function normalizeNode(node: any, createUid?: () => string): GalleryNode {
  return {
    ...(createUid ? { uid: node?.uid || createUid() } : {}),
    title: node?.title || '',
    description: node?.description || '',
    images: normalizeNodeImages(node?.images || []),
    image_tags: normalizeNodeTags(node?.image_tags),
  };
}

export function createEmptyNode(createUid?: () => string): GalleryNode {
  return {
    ...(createUid ? { uid: createUid() } : {}),
    title: '',
    description: '',
    images: ['', '', ''],
    image_tags: [[], [], []],
  };
}

export function createDefaultNodes(createUid?: () => string): GalleryNode[] {
  return [createEmptyNode(createUid), createEmptyNode(createUid), createEmptyNode(createUid)];
}

export function nodesFromLegacyImages(images: string[] = [], createUid?: () => string, emptyFallback = false): GalleryNode[] {
  if (!images.length) return emptyFallback ? createDefaultNodes(createUid) : [];
  const nodes: GalleryNode[] = [];
  for (let i = 0; i < images.length; i += 3) {
    nodes.push({
      ...(createUid ? { uid: createUid() } : {}),
      title: `Node ${nodes.length + 1}`,
      description: '',
      images: normalizeNodeImages(images.slice(i, i + 3)),
      image_tags: [[], [], []],
    });
  }
  return nodes;
}

export function flattenNodeImages(nodes: GalleryNode[] = []): string[] {
  return nodes.flatMap(node => node.images).filter(Boolean);
}

export function normalizeFeaturedImages(images: string[] = []): GalleryImageTuple {
  const next = images.filter(Boolean);
  while (next.length < 3) next.push('');
  return next.slice(0, 3) as GalleryImageTuple;
}

export function countImagesFromData(galleryNodes: any[] = [], galleryImages: string[] = []) {
  const fromNodes = Array.isArray(galleryNodes)
    ? galleryNodes.flatMap((node: any) => (Array.isArray(node.images) ? node.images.filter(Boolean) : []))
    : [];
  if (fromNodes.length) return fromNodes.length;
  return Array.isArray(galleryImages) ? galleryImages.filter(Boolean).length : 0;
}
