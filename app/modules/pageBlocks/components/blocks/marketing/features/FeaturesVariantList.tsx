import { useTranslation } from "react-i18next";
import { FeaturesBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/features/FeaturesBlockUtils";
import CheckIcon from "~/components/ui/icons/CheckIcon";
import { Fragment } from "react";
import GridBlockUtils from "../../shared/grid/GridBlockUtils";
import RightArrowIcon from "~/components/ui/icons/RightArrowIcon";
import { Link } from "@remix-run/react";
import clsx from "clsx";

export default function FeaturesList({ item }: { item: FeaturesBlockDto }) {
  const { t } = useTranslation();
  return (
    <section className="body-font text-gray-600 dark:text-gray-400">
      <div className="container mx-auto space-y-8 px-5 py-24 sm:space-y-12">
        <div className="space-y-5 text-center sm:mx-auto sm:max-w-xl sm:space-y-4 lg:max-w-5xl">
          <div className="space-y-1">
            {item.topText && <h2 className="text-sm font-semibold uppercase leading-8 text-gray-500">{t(item.topText)}</h2>}
            <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t(item.headline)}</h2>
          </div>
          <p className="mx-auto max-w-2xl text-center text-xl text-gray-500">{t(item.subheadline)}</p>
        </div>
        <div className={clsx(GridBlockUtils.getClasses(item.grid), "mx-auto")}>
          {item.items.map((feature, idx) => {
            return (
              <div key={idx} className="flex">
                <div className="mb-4 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-theme-100 text-theme-500 dark:bg-theme-800">
                  {feature.img ? (
                    <>
                      {feature.img.startsWith("<svg") ? (
                        <div dangerouslySetInnerHTML={{ __html: feature.img.replace("<svg", `<svg class='${" h-6 w-6 text-theme-500"}'`) ?? "" }} />
                      ) : feature.img.startsWith("http") ? (
                        <img className=" h-6 w-6" src={feature.img} alt={feature.name} />
                      ) : (
                        feature.img
                      )}
                    </>
                  ) : (
                    <CheckIcon className=" h-6 w-6 text-theme-500" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-grow pl-6">
                  <p className="title-font mb-2 text-lg font-medium text-gray-900 dark:text-white">{t(feature.name)}</p>
                  <p className="text-base leading-relaxed">{t(feature.description)}</p>
                  {feature.link?.href && (
                    <Fragment>
                      {feature.link.href.startsWith("http") ? (
                        <a href={feature.link?.href} target={feature.link.target} className="mt-3 inline-flex items-center text-theme-500">
                          {t(feature.link.text)}
                          <RightArrowIcon className="ml-1 h-4 w-4" />
                        </a>
                      ) : (
                        <Link to={feature.link?.href} target={feature.link.target} className="mt-3 inline-flex items-center text-theme-500">
                          {t(feature.link.text)}
                          <RightArrowIcon className="ml-1 h-4 w-4" />
                        </Link>
                      )}
                    </Fragment>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
