import { Link } from "@remix-run/react";
import { marked } from "marked";
import { useTranslation } from "react-i18next";
import ThumbsDownIcon from "~/components/ui/icons/ThumbsDownIcon";
import ThumbsDownIconFilled from "~/components/ui/icons/ThumbsDownIconFilled";
import ThumbsUpIcon from "~/components/ui/icons/ThumbsUpIcon";
import ThumbsUpIconFilled from "~/components/ui/icons/ThumbsUpIconFilled";
import { KbArticleDto } from "~/modules/knowledgeBase/dtos/KbArticleDto";
import DateUtils from "~/utils/shared/DateUtils";

export default function KbArticleContent({
  item,
  content,
  actions,
  userState,
}: {
  item: KbArticleDto;
  content: string;
  userState?: {
    hasThumbsUp: boolean;
    hasThumbsDown: boolean;
  };
  actions?: {
    onThumbsUp: () => void;
    onThumbsDown: () => void;
  };
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-8">
          <div className="flex w-full flex-col">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold group-hover:text-gray-700 md:text-3xl">{item.title}</h1>
            </div>
            <p className="mt-2 font-light text-gray-700">{item.description}</p>
            <div className="flex justify-between space-x-2">
              <li className="mt-5 flex items-center space-x-2">
                {item.createdByUser?.avatar && <img src={item.createdByUser.avatar} alt="" className="h-8 w-8 rounded-full" />}
                <div>
                  {item.createdByUser && (
                    <dl className="whitespace-no-wrap text-sm font-medium leading-5">
                      <dt className="sr-only">Author</dt>
                      <dd className="text-gray-900 dark:text-white">
                        <span className="font-normal text-gray-600">{t("shared.by")}</span> {item.createdByUser.firstName} {item.createdByUser.lastName}
                      </dd>
                    </dl>
                  )}
                  <dl className="whitespace-no-wrap text-xs leading-5">{DateUtils.dateAgo(item.createdAt)}</dl>
                </div>
              </li>
              {actions && (
                <div className="flex items-center space-x-2">
                  <button type="button" onClick={actions.onThumbsUp} className="flex items-center space-x-2  text-gray-500 hover:text-gray-800">
                    {userState?.hasThumbsUp ? <ThumbsUpIconFilled className="h-4 w-4" /> : <ThumbsUpIcon className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={actions.onThumbsDown} className="flex items-center space-x-2  text-gray-500 hover:text-gray-800">
                    {userState?.hasThumbsDown ? <ThumbsDownIconFilled className="h-4 w-4" /> : <ThumbsDownIcon className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 pt-6"></div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-9">
          <div className="prose">
            <div dangerouslySetInnerHTML={{ __html: marked(content) }} />
          </div>
        </div>
        {item.relatedArticles.length > 0 && (
          <div className="col-span-3 space-y-3 py-5">
            <div className="text-sm font-medium text-gray-600">Related Articles</div>
            <div className="space-y-2">
              {item.relatedArticles.map((x) => (
                <Link to={x.href} key={x.href} className="flex items-center space-x-2 hover:underline">
                  <div className="text-sm">{x.title}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
