import { FeaturesBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/features/FeaturesBlockUtils";
import FeaturesVariantCards from "./FeaturesVariantCards";
import FeaturesVariantList from "./FeaturesVariantList";

export default function FeaturesBlock({ item }: { item: FeaturesBlockDto }) {
  return (
    <>
      {item.style === "cards" && <FeaturesVariantCards item={item} />}
      {item.style === "list" && <FeaturesVariantList item={item} />}
    </>
  );
}
