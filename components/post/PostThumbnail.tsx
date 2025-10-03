'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

type ThumbnailImage = {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly priority?: boolean;
};

export type PostThumbnailProps = {
  readonly title: string;
  readonly excerpt: string;
  readonly slug: string;
  readonly publishedAt?: string | null;
  readonly updatedAt?: string | null;
  readonly tags?: readonly string[] | null;
  readonly thumbnail: ThumbnailImage;
  readonly locale?: string;
  readonly className?: string;
};

const MAX_VISIBLE_TAGS = 3;

const ISO_DATE_LENGTH = 10;

function normaliseDateInput(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDisplayDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function sanitisePathSlashes(path: string) {
  return path.replace(/\/+/g, '/');
}

function buildPostHref(slug: string) {
  if (/^https?:\/\//.test(slug)) {
    return slug;
  }

  const trimmed = slug.trim();

  if (!trimmed) {
    return '/';
  }

  if (trimmed.startsWith('/')) {
    return sanitisePathSlashes(trimmed);
  }

  if (trimmed.startsWith('posts/')) {
    return sanitisePathSlashes(`/${trimmed}`);
  }

  return sanitisePathSlashes(`/posts/${trimmed}`);
}

function buildShareLink(slug: string) {
  if (/^https?:\/\//.test(slug)) {
    return slug;
  }

  return buildPostHref(slug);
}

export function PostThumbnail({
  title,
  excerpt,
  slug,
  publishedAt,
  updatedAt,
  tags,
  thumbnail,
  locale = 'en-US',
  className = '',
}: PostThumbnailProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const publishedDate = useMemo(() => normaliseDateInput(publishedAt), [publishedAt]);
  const updatedDate = useMemo(() => normaliseDateInput(updatedAt), [updatedAt]);

  const { displayDate, displayLabel } = useMemo(() => {
    if (publishedDate && updatedDate) {
      if (updatedDate > publishedDate) {
        return { displayDate: updatedDate, displayLabel: 'Updated' } as const;
      }
      return { displayDate: publishedDate, displayLabel: 'Published' } as const;
    }

    if (updatedDate) {
      return { displayDate: updatedDate, displayLabel: 'Updated' } as const;
    }

    if (publishedDate) {
      return { displayDate: publishedDate, displayLabel: 'Published' } as const;
    }

    return { displayDate: null, displayLabel: null } as const;
  }, [publishedDate, updatedDate]);

  const isoDate = displayDate ? displayDate.toISOString().slice(0, ISO_DATE_LENGTH) : undefined;
  const dateLabel = displayDate ? `${displayLabel} ${formatDisplayDate(displayDate, locale)}` : null;

  const visibleTags = useMemo(() => tags?.filter(Boolean).slice(0, MAX_VISIBLE_TAGS) ?? [], [tags]);

  const postHref = useMemo(() => buildPostHref(slug), [slug]);
  const shareLink = useMemo(() => buildShareLink(slug), [slug]);

  const handleCopySlug = async () => {
    if (!shareLink) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = shareLink;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopyState('copied');
    } catch (error) {
      console.error('Unable to copy slug link', error);
      setCopyState('failed');
    } finally {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
      resetTimer.current = setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  return (
    <article
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-xl transition duration-200 ${className}`}
    >
      <div className="relative h-56 w-full overflow-hidden sm:h-64">
        <Image
          src={thumbnail.src}
          alt={thumbnail.alt}
          width={thumbnail.width}
          height={thumbnail.height}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          priority={thumbnail.priority}
          sizes="(min-width: 640px) 640px, 100vw"
        />
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
        <header className="flex flex-col gap-3">
          {dateLabel && isoDate ? (
            <time
              dateTime={isoDate}
              className="text-xs font-medium uppercase tracking-[0.3em] text-zinc-700 dark:text-zinc-300"
            >
              {dateLabel}
            </time>
          ) : null}

          <h2 className="text-2xl font-semibold text-zinc-900 transition-colors duration-200 group-hover:text-zinc-700 dark:text-zinc-50 dark:group-hover:text-zinc-100">
            <Link href={postHref} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-200">
              {title}
            </Link>
          </h2>
        </header>

        <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200">{excerpt}</p>

        {visibleTags.length ? (
          <ul className="flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-zinc-600 transition-colors duration-200 dark:border-zinc-600 dark:text-zinc-300"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-700">
          <button
            type="button"
            onClick={handleCopySlug}
            className="flex items-center gap-2 rounded-full border border-zinc-300 px-3 py-2 font-medium text-zinc-700 transition duration-200 hover:border-zinc-500 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-100"
          >
            <span className="truncate text-left font-mono text-xs sm:text-sm">{shareLink}</span>
          </button>

          <span
            aria-live="polite"
            className="text-xs font-medium text-zinc-600 transition-opacity duration-200 dark:text-zinc-300"
          >
            {copyState === 'copied' && 'Link copied!'}
            {copyState === 'failed' && 'Copy failed'}
          </span>
        </div>
      </div>
    </article>
  );
}

export default PostThumbnail;
