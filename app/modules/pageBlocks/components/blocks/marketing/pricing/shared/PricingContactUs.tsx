import { useTranslation } from "react-i18next";
import { PricingContactUsDto } from "../PricingBlockUtils";
import { Link } from "@remix-run/react";

export default function PricingContactUs({ item }: { item: PricingContactUsDto }) {
  const { t } = useTranslation();
  return (
    <div className="relative lg:mx-4">
      <div>
        <div className="mx-auto overflow-hidden rounded-lg border border-transparent shadow-xl dark:border-gray-700 lg:flex">
          <div className="flex-1 bg-slate-800 px-6 py-8 dark:bg-theme-800 lg:p-12">
            <h3 className="text-2xl font-extrabold text-white sm:text-3xl">{t(item.title)}</h3>
            <p className="mt-6 text-base text-white">{t(item.description)}</p>
            <div className="mt-8">
              <div className="flex items-center">
                <h4 className="flex-shrink-0 pr-4 text-sm font-semibold uppercase tracking-wider text-white">{t("pricing.whatsIncluded")}</h4>
                <div className="flex-1 border-t border-gray-700 dark:border-gray-300"></div>
              </div>
              <ul role="list" className="mt-8 space-y-5 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5 lg:space-y-0">
                {item.features.map((feature, idxFeature) => {
                  return (
                    <li key={idxFeature} className="flex items-start lg:col-span-1">
                      <div className="flex-shrink-0">
                        {/* Heroicon name: solid/check-circle */}
                        <svg className="h-5 w-5 text-theme-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <p className="ml-3 text-sm text-gray-50">
                        <span>{t(feature)}</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <div className="px-6 py-8 text-center lg:flex lg:flex-shrink-0 lg:flex-col lg:justify-center lg:p-12">
            <div className="mt-4 flex items-center justify-center text-5xl font-extrabold text-gray-900 dark:text-white">
              <span>{t("pricing.contactUs")}</span>
            </div>
            <p className="mt-4 text-sm">
              <span className="font-medium text-gray-500">{t("pricing.customPlanDescription")}</span>
            </p>
            <div className="mt-6">
              <div className="mx-auto max-w-md rounded-md shadow">
                <Link
                  to="/contact"
                  className="flex items-center justify-center rounded-md border border-transparent bg-slate-800 px-5 py-3 text-base font-medium text-white hover:bg-slate-900 dark:hover:bg-theme-900"
                >
                  {t("pricing.contact")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
