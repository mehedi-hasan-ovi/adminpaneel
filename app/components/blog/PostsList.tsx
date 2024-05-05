import clsx from "clsx";
import { Link } from "@remix-run/react";
import { BlogPostWithDetails } from "~/modules/blog/db/blog.db.server";
import DateUtils from "~/utils/shared/DateUtils";

interface Props {
  blogPath: string;
  items: BlogPostWithDetails[];
  withCoverImage: boolean;
  withAuthorName: boolean;
  withAuthorAvatar: boolean;
  withDate: boolean;
}

export default function PostsList({ blogPath, items, withCoverImage, withAuthorName = true, withAuthorAvatar = true, withDate = true }: Props) {
  return (
    <section className="body-font text-gray-600 dark:text-gray-400">
      <div className="container mx-auto px-5 py-24">
        <div
          className={clsx(
            "grid gap-5",
            items.length === 1 && "max-w-md lg:grid-cols-1",
            items.length === 2 && "max-w-4xl lg:grid-cols-2",
            items.length > 2 && "md:grid-cols-2 lg:max-w-none lg:grid-cols-3"
          )}
        >
          {items.map((item) => {
            return (
              <Link to={blogPath + "/" + item.slug} key={item.title}>
                <div className="h-full overflow-hidden rounded-lg border-2 border-gray-200 border-opacity-60 dark:border-gray-700 dark:bg-gray-800">
                  {withCoverImage && item.image && <img className="w-full object-cover object-center md:h-36 lg:h-48" src={item.image} alt={item.title} />}
                  <div className="p-6">
                    <div className="title-font flex items-center justify-between truncate text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-gray-600">
                      <div>{item.category?.name}</div>
                      {withDate && <div>{DateUtils.dateAgo(item.createdAt)}</div>}
                    </div>
                    <h2 className="title-font mb-3 text-lg font-medium text-gray-900 dark:text-white">{item.title}</h2>
                    <p className="mb-3 leading-relaxed">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        {/* {withAuthorName && item.author && (
                          <div className="flex items-center space-x-2">
                            {withAuthorAvatar && item.author.image && (
                              <img className="h-6 w-6 rounded-full" src={item.author.image} alt={item.author.firstName} />
                            )}
                            <div className="text-sm text-gray-500">
                              {item.author.firstName} {item.author.lastName}
                            </div>
                          </div>
                        )} */}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
