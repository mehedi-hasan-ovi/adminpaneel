import { useTranslation } from "react-i18next";
import { FeatureDto, FeaturesBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/features/FeaturesBlockUtils";
import CheckIcon from "~/components/ui/icons/CheckIcon";
import { Link } from "@remix-run/react";
import { Fragment } from "react";
import GridBlockUtils from "../../shared/grid/GridBlockUtils";

export default function FeaturesVariantCards({ item }: { item: FeaturesBlockDto }) {
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
        <div className={GridBlockUtils.getClasses(item.grid)}>
          {item.items.map((feature, idx) => {
            return (
              <Fragment key={idx}>
                {feature.link ? (
                  <>
                    {feature.link.href.startsWith("http") ? (
                      <a
                        href={feature.link.href}
                        target={feature.link.target}
                        className="flex h-full flex-col rounded-lg border-2 border-dashed border-theme-200 bg-gray-100 p-8 hover:border-dotted hover:border-theme-500 hover:bg-theme-100 dark:border-theme-700 dark:bg-gray-800 dark:hover:bg-theme-800"
                      >
                        <FeatureCard feature={feature} />
                      </a>
                    ) : (
                      <Link
                        to={feature.link.href}
                        target={feature.link.target}
                        className="flex h-full flex-col rounded-lg border-2 border-dashed border-theme-200 bg-gray-100 p-8 hover:border-dotted hover:border-theme-500 hover:bg-theme-100 dark:border-theme-700 dark:bg-gray-800 dark:hover:bg-theme-800"
                      >
                        <FeatureCard feature={feature} />
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="flex h-full flex-col rounded-lg bg-gray-100 p-8 dark:bg-gray-800">
                    <FeatureCard feature={feature} />
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: FeatureDto }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="mb-3 flex items-center justify-between space-x-2">
        <div className="flex items-center">
          <div className="mr-3 inline-flex flex-shrink-0 items-center justify-center text-theme-500">
            {feature.img ? (
              <>
                {feature.img.startsWith("<svg") ? (
                  <div dangerouslySetInnerHTML={{ __html: feature.img.replace("<svg", `<svg class='${" h-6 w-6"}'`) ?? "" }} />
                ) : feature.img.startsWith("http") ? (
                  <img className=" h-6 w-6" src={feature.img} alt={feature.name} />
                ) : (
                  feature.img
                )}
              </>
            ) : (
              <CheckIcon className=" h-6 w-6" aria-hidden="true" />
            )}
          </div>
          <h2 className="title-font text-lg font-medium text-gray-900 dark:text-white">{t(feature.name)}</h2>
        </div>
      </div>
      <div className="flex-grow">
        <p className="text-base leading-relaxed">{t(feature.description)}</p>
        {/* {feature.link?.href && (
          <a href={feature.link?.href} target={feature.link.target} className="mt-3 inline-flex items-center text-gray-500">
            {t(feature.link.text)}
            <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="ml-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
          </a>
        )} */}
      </div>
    </>
  );
}
