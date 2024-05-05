import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FooterBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlockUtils";
import { defaultFooter } from "~/modules/pageBlocks/utils/defaultFooter";
import FooterVariantColumns from "./FooterVariantColumns";
import FooterVariantSimple from "./FooterVariantSimple";

export default function FooterBlock({ item }: { item?: FooterBlockDto }) {
  const { t } = useTranslation();
  const [footer, setFooter] = useState(item);
  useEffect(() => {
    if (!footer) {
      setFooter(defaultFooter({ t }));
    } else {
      setFooter(item);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);
  return (
    <>
      {footer && (
        <>
          {footer.style === "simple" && <FooterVariantSimple item={footer} />}
          {footer.style === "columns" && <FooterVariantColumns item={footer} />}
        </>
      )}
    </>
  );
}
