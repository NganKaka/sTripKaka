const CLOUDINARY_HOST = 'res.cloudinary.com';

type Options = {
  width?: number;
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif';
  crop?: 'fill' | 'fit' | 'limit';
};

function isCloudinaryUrl(url: string): boolean {
  return typeof url === 'string' && url.includes(CLOUDINARY_HOST);
}

function buildTransform(opts: Options): string {
  const parts: string[] = [];
  parts.push(`f_${opts.format ?? 'auto'}`);
  parts.push(`q_${opts.quality ?? 'auto'}`);
  if (opts.width) parts.push(`w_${opts.width}`);
  if (opts.crop) parts.push(`c_${opts.crop}`);
  return parts.join(',');
}

export function cldUrl(src: string | undefined | null, opts: Options = {}): string {
  if (!src || !isCloudinaryUrl(src)) return src ?? '';

  const uploadIdx = src.indexOf('/upload/');
  if (uploadIdx === -1) return src;

  const head = src.slice(0, uploadIdx + '/upload/'.length);
  const tail = src.slice(uploadIdx + '/upload/'.length);

  const tailFirstSegment = tail.split('/')[0] ?? '';
  const alreadyTransformed = /[a-z]_[a-zA-Z0-9-]+/.test(tailFirstSegment) && tailFirstSegment.includes(',') === false
    ? false
    : /[a-z]_[a-zA-Z0-9-]+/.test(tailFirstSegment);

  if (alreadyTransformed) return src;

  return `${head}${buildTransform(opts)}/${tail}`;
}

export function cldSrcSet(src: string | undefined | null, widths: number[]): string | undefined {
  if (!src || !isCloudinaryUrl(src)) return undefined;
  return widths.map((w) => `${cldUrl(src, { width: w })} ${w}w`).join(', ');
}
