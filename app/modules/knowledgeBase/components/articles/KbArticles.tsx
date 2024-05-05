import { Link } from "@remix-run/react";
import RightIcon from "~/components/ui/icons/RightIcon";
import clsx from "clsx";
import ColorHoverUtils from "~/utils/shared/colors/ColorHoverUtils";
import type { KnowledgeBaseDto } from "../../dtos/KnowledgeBaseDto";

export default function KbArticles({
  kb,
  items,
}: {
  kb: KnowledgeBaseDto;
  items: {
    order: number;
    title: string;
    description: string;
    href: string;
    sectionId: string | null;
  }[];
}) {
  return (
    <div className="rounded-md border border-gray-300 bg-white py-3">
      {items.map((item) => {
        return (
          <div key={item.title} className={clsx("group", ColorHoverUtils.getBorder500(kb.color))}>
            <Link to={item.href}>
              <div className="flex items-center justify-between space-x-2 px-6 py-3 hover:bg-gray-50">
                <div className="">
                  <div className={clsx("text-gray-600 group-hover:text-gray-900")}>{item.title}</div>
                </div>
                <RightIcon className={clsx("h-5 w-5 flex-shrink-0 text-gray-300 group-hover:text-gray-600")} />
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
