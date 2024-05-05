import clsx from "clsx";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import LinkOrAhref from "~/components/ui/buttons/LinkOrAhref";
import ExternalLinkEmptyIcon from "~/components/ui/icons/ExternalLinkEmptyIcon";
import { BannerBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/banner/BannerBlockUtils";

export default function BannerVariantTop({ item }: { item: BannerBlockDto }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);

  return (
    <span>
      {item && open && (
        <div className="border-b-2 border-theme-500 bg-slate-900">
          <div className="mx-auto max-w-7xl px-3 py-1.5 sm:px-6 sm:py-3 lg:px-8">
            <div className="flex w-full items-center space-x-3 lg:w-auto lg:justify-end">
              <div className={clsx("flex flex-grow", item.cta ? "justify-start" : "justify-center")}>
                <div className="flex items-baseline space-x-1 text-sm font-medium text-white sm:text-base">{t(item.text)}</div>
              </div>
              {item.cta && (
                <div className="order-2 mt-0 flex w-auto flex-shrink-0 space-x-2">
                  {item.cta.map((cta) => {
                    return (
                      <LinkOrAhref
                        key={cta.text}
                        to={cta.href}
                        target={cta.target}
                        className={clsx(
                          "flex items-center justify-center space-x-1 rounded-md border border-transparent px-4 py-2 text-xs font-medium shadow-sm sm:text-sm",
                          cta.isPrimary ? "bg-theme-400 text-theme-900 hover:bg-theme-500" : "border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700"
                        )}
                      >
                        <span>{t(cta.text)}</span>
                        {cta.target === "_blank" && <ExternalLinkEmptyIcon className="hidden h-4 w-4 md:block" />}
                      </LinkOrAhref>
                    );
                  })}
                </div>
              )}
              <div className="order-3 ml-2 hidden flex-shrink-0 sm:flex">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="-mr-1 flex rounded-md p-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-400 sm:-mr-2"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6 text-slate-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
