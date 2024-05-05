import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { FaqBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/faq/FaqBlockUtils";

export default function FaqVariantSimple({ item }: { item: FaqBlockDto }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
      <div className="mx-auto divide-y-2 divide-gray-200 text-center dark:divide-gray-700">
        {item.headline && <h2 className="mx-auto mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{t(item.headline)}</h2>}
      </div>
      {item.items.map((item, index) => (
        <details
          key={index}
          className="group rounded-lg border border-gray-100 bg-gray-50 p-6 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:hover:bg-gray-800 [&_summary::-webkit-details-marker]:hidden"
          open={index === 0}
        >
          <summary className="flex cursor-pointer items-center justify-between">
            <div className="select-none font-medium text-gray-900 dark:text-white">{t(item.question)}</div>

            <span className="relative ml-1.5 h-5 w-5 flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 h-5 w-5 opacity-100 group-open:opacity-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 h-5 w-5 opacity-0 group-open:opacity-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </summary>

          <p className="mt-4 leading-relaxed text-gray-700 dark:text-gray-300">{t(item.answer)}</p>
          {item.link && (
            <Link to={item.link.href} className="mt-1 inline-flex items-center font-medium text-theme-600 hover:text-theme-500 dark:text-theme-400">
              {t(item.link.text)}
            </Link>
          )}
        </details>
      ))}
    </div>
  );
}
