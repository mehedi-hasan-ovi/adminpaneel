import { PricingBlockDto } from "./PricingBlockUtils";
import PricingVariantSimple from "./PricingVariantSimple";

export default function PricingBlock({ item }: { item: PricingBlockDto }) {
  return <>{item.style === "simple" && <PricingVariantSimple item={item} />}</>;
}
