import { Link } from "@remix-run/react";
import clsx from "clsx";

import type { KbCategoryDto } from "~/modules/knowledgeBase/dtos/KbCategoryDto";
import ColorTextUtils from "~/utils/shared/colors/ColorTextUtils";
import { KnowledgeBaseDto } from "../../dtos/KnowledgeBaseDto";
import ColorGroupHoverUtils from "~/utils/shared/colors/ColorGroupHoverUtils";

export default function KbCategoriesList({ kb, items }: { kb: KnowledgeBaseDto; items: KbCategoryDto[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Categories</h2>
      <div className={clsx("grid grid-cols-1 gap-4")}>
        {items.map((item) => {
          return (
            <div key={item.title} className="group rounded-md border border-gray-300 bg-white hover:border-slate-400">
              <Link to={item.href} className="w-full">
                <div className="flex items-center space-x-8 p-6">
                  <div className="flex-shrink-0">
                    {item.icon.startsWith("<svg") ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            item.icon.replace(
                              "<svg",
                              `<svg class='${clsx("h-12 w-12", ColorTextUtils.getText500(kb.color), ColorGroupHoverUtils.getText700(kb.color))}'`
                            ) ?? "",
                        }}
                      />
                    ) : item.icon.includes("http") ? (
                      <img className="h-12 w-12" src={item.icon} alt={item.title} />
                    ) : (
                      <></>
                    )}
                  </div>
                  <div className="flex w-full flex-col">
                    <div className="font-bold group-hover:text-gray-700">{item.title}</div>
                    <div className="mt-1 text-sm text-gray-700">{item.description}</div>
                    <div className="mt-6 flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm">
                          {item.articles.length} <span>{item.articles.length === 1 ? "article" : "articles"}</span>
                        </div>
                        {/* <div className="text-sm text-gray-300">|</div>
                        <div className="text-sm">Written by 10 authors</div> */}
                      </div>
                      {/* <div className="text-sm text-gray-400">{item.version}</div> */}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
