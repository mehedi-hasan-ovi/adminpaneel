import { Link } from "@remix-run/react";
import clsx from "clsx";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { HeroBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/hero/HeroBlockUtils";

export default function HeroVariantTopImage({ item }: { item: HeroBlockDto }) {
  const { t } = useTranslation();
  return (
    <section className="body-font text-gray-600 dark:text-gray-400">
      <div className="container mx-auto flex flex-col items-center justify-center px-5 py-24">
        <img className="mb-10 w-5/6 rounded object-cover object-center md:w-3/6" alt="hero" src={item.image} />
        <div className="w-full text-center lg:w-2/3">
          <div className="mb-4">
            {item.topText && (
              <span className="block text-sm font-semibold uppercase tracking-wide text-gray-500 sm:text-base lg:text-sm xl:text-base">
                {t(item.topText.text ?? "")}{" "}
                {item.topText.link && (
                  <Link to={item.topText.link.href ?? ""} className="font-semibold text-theme-600 relative">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {t(item.topText.link.text ?? "")} <span aria-hidden="true">&rarr;</span>
                  </Link>
                )}
              </span>
            )}
          </div>
          {item.headline && <h1 className="title-font mb-4 text-3xl font-medium text-gray-900 dark:text-white sm:text-4xl">{t(item.headline)}</h1>}
          {item.description && <p className="mb-8 leading-relaxed text-gray-600 dark:text-gray-400">{t(item.description)}</p>}

          <div className="flex flex-wrap justify-center gap-4">
            {item.cta.map((item, idx) => {
              return (
                <Fragment key={idx}>
                  {item.href.startsWith("http") ? (
                    <a
                      key={idx}
                      href={item.href}
                      target={item.target}
                      className={clsx(
                        "w-full sm:w-auto",
                        item.isPrimary
                          ? "inline-flex justify-center rounded-md border-0 bg-theme-500 py-3 px-4 text-lg text-white shadow-sm hover:bg-theme-600 focus:outline-none"
                          : "inline-flex justify-center rounded-md border-0 bg-gray-100 py-3 px-4 text-lg text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none"
                      )}
                    >
                      {t(item.text)}
                    </a>
                  ) : (
                    <Link
                      key={idx}
                      to={item.href}
                      className={clsx(
                        "w-full sm:w-auto",
                        item.isPrimary
                          ? "inline-flex justify-center rounded-md border-0 bg-theme-500 py-3 px-4 text-lg text-white shadow-sm hover:bg-theme-600 focus:outline-none"
                          : "inline-flex justify-center rounded-md border-0 bg-gray-100 py-3 px-4 text-lg text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none"
                      )}
                    >
                      {t(item.text)}
                    </Link>
                  )}
                </Fragment>
              );
            })}
          </div>
          <div className="mt-8 space-y-3">
            {item.bottomText && (
              <span>
                {t(item.bottomText.text ?? "")}{" "}
                {item.bottomText.link?.href && (
                  <>
                    {item.bottomText.link.href.startsWith("http") ? (
                      <a
                        href={item.bottomText.link.href ?? ""}
                        target={item.bottomText.link.target}
                        className="border-b border-dashed border-accent-500 text-sm italic text-gray-500 hover:border-dotted dark:border-cyan-300"
                      >
                        {t(item.bottomText.link.text ?? "")}
                      </a>
                    ) : (
                      <Link
                        to={item.bottomText.link.href ?? ""}
                        className="border-b border-dashed border-accent-500 text-sm italic text-gray-500 hover:border-dotted dark:border-cyan-300"
                      >
                        {t(item.bottomText.link.text ?? "")}
                      </Link>
                    )}
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
