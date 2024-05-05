import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BannerBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/banner/BannerBlockUtils";
import MegaphoneIcon from "~/components/ui/icons/emails/MegaphoneIcon";
import XIcon from "~/components/ui/icons/XIcon";
import LinkOrAhref from "~/components/ui/buttons/LinkOrAhref";
import clsx from "clsx";
import ExternalLinkEmptyIcon from "~/components/ui/icons/ExternalLinkEmptyIcon";

export default function BannerVariantBottom({ item }: { item: BannerBlockDto }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  return (
    <>
      {item && open && (
        <div className="fixed inset-x-0 bottom-0 z-30 pb-2 sm:pb-5">
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="rounded-lg bg-theme-600 p-2 shadow-lg sm:p-3">
              <div className="flex flex-wrap items-center justify-between">
                <div className="flex w-0 flex-1 items-center">
                  <span className="flex rounded-lg bg-theme-800 p-2">
                    <MegaphoneIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                  <p className="ml-3 truncate font-medium text-white">{t(item.text)}</p>
                </div>
                <div className="order-3 mt-2 w-full flex-shrink-0 sm:order-2 sm:mt-0 sm:w-auto">
                  {item.cta.map((cta) => {
                    return (
                      <LinkOrAhref
                        key={cta.href}
                        to={cta.href}
                        target={cta.target}
                        className={clsx(
                          "flex items-center justify-center space-x-1 rounded-md border border-transparent px-4 py-2 text-xs font-medium shadow-sm sm:text-sm",
                          cta.isPrimary ? "bg-theme-400 text-theme-900 hover:bg-theme-500" : "border-gray-700 text-gray-100 hover:bg-gray-800"
                        )}
                      >
                        <span>{t(cta.text)}</span>
                        {cta.target === "_blank" && <ExternalLinkEmptyIcon className="hidden h-4 w-4 md:block" />}
                      </LinkOrAhref>
                    );
                  })}
                </div>
                <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
                  <button
                    onClick={() => setOpen(false)}
                    type="button"
                    className="-mr-1 flex rounded-md p-2 hover:bg-theme-500 focus:outline-none focus:ring-2 focus:ring-white"
                  >
                    <span className="sr-only">{t("shared.close")}</span>
                    <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
