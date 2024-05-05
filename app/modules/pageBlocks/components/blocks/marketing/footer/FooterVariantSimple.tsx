import { Link } from "@remix-run/react";
import { FooterBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlockUtils";
import SocialsVariantSimple from "../../shared/socials/SocialsVariantSimple";
import { useTranslation } from "react-i18next";

export default function FooterVariantSimple({ item }: { item: FooterBlockDto }) {
  const { t } = useTranslation();
  return (
    <div>
      <footer>
        <div className="mx-auto max-w-7xl overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
          {item.sections.map((section) => {
            return (
              <nav key={section.name} className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
                {section.items.map((link) => {
                  return (
                    <div key={link.href} className="px-5 py-2">
                      <Link to={link.href} className="text-base text-gray-500 hover:text-gray-900 dark:hover:text-white">
                        {t(link.name)}
                      </Link>
                    </div>
                  );
                })}
              </nav>
            );
          })}
          <div className="mt-4 flex justify-center space-x-6">
            <SocialsVariantSimple item={item.socials} />
          </div>
        </div>
      </footer>
    </div>
  );
}
