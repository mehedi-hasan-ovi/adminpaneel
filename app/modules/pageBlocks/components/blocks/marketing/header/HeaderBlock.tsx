import { useEffect, useState } from "react";
import { HeaderBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/header/HeaderBlockUtils";
import { defaultHeader } from "~/modules/pageBlocks/utils/defaultHeader";
import HeaderVariantSimple from "./HeaderVariantSimple";

export default function HeaderBlock({ item }: { item?: HeaderBlockDto }) {
  const [header, setHeader] = useState(defaultHeader);
  useEffect(() => {
    setHeader(item ?? defaultHeader);
  }, [item]);
  return <>{header && <>{header.style === "simple" && <HeaderVariantSimple item={header} />}</>}</>;
}
