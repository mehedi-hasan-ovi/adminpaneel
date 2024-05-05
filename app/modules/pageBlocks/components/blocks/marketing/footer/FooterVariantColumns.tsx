import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { FooterBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlockUtils";
import Icon from "~/components/brand/Icon";
import SocialsVariantSimple from "../../shared/socials/SocialsVariantSimple";
import LinkOrAhref from "~/components/ui/buttons/LinkOrAhref";

export default function FooterVariantColumns({ item }: { item: FooterBlockDto }) {
  const { t } = useTranslation();
  return (
    <footer aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Icon className="h-10 w-auto" />
            {item.text && <p className="text-base text-gray-500">{t(item.text)}</p>}
            <div className="flex space-x-6">
              <SocialsVariantSimple item={item.socials} />
            </div>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-8 xl:col-span-2 xl:mt-0">
            {item.sections.map((section, idx) => {
              return (
                <div key={idx} className={clsx(idx > 0 && "mt-0")}>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t(section.name)}</h3>
                  <ul className="mt-4 space-y-4">
                    {section.items.map((item) => (
                      <li key={item.name}>
                        <LinkOrAhref to={item.href} className="text-base text-gray-500 hover:text-gray-900 dark:hover:text-white" rel="noreferrer">
                          {t(item.name)}
                        </LinkOrAhref>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
