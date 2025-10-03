import PostThumbnail, { type PostThumbnailProps } from "@/components/post/PostThumbnail";

export type ThumbnailGridItem = Omit<PostThumbnailProps, "className"> & {
  readonly className?: string;
};

type ThumbnailGridProps = {
  readonly items: readonly ThumbnailGridItem[];
  readonly className?: string;
};

export function ThumbnailGrid({ items, className = "" }: ThumbnailGridProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={`grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(17rem,1fr))] ${className}`}
    >
      {items.map((item) => (
        <PostThumbnail key={item.slug} {...item} />
      ))}
    </div>
  );
}

export default ThumbnailGrid;
