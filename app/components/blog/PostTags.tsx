import { BlogPostTag, BlogTag } from "@prisma/client";
import { getTailwindColor } from "~/utils/shared/ColorUtils";

interface Props {
  items: (BlogPostTag & { tag: BlogTag })[];
}
export default function PostTags({ items }: Props) {
  return (
    <div className="flex items-center space-x-1 text-xs">
      {items.map((blogTag, idx) => {
        return (
          <div key={idx}>
            <span className={getTailwindColor(blogTag.tag.color)}> #</span>
            {blogTag.tag.name}
          </div>
        );
      })}
    </div>
  );
}
