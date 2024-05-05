import { Colors } from "~/application/enums/shared/Colors";
import RenderOption from "../../properties/select/RenderOption";
import { SelectOptionsDisplay } from "~/utils/shared/SelectOptionsUtils";
import { useEffect, useState } from "react";

type ItemDto = { value: string; name: string | null; color: Colors };
export default function RowSelectedOptionCell({ value, options, display = "Value" }: { value: string; options: ItemDto[]; display: SelectOptionsDisplay }) {
  const [selected, setSelected] = useState<ItemDto>();
  useEffect(() => {
    setSelected(options.find((f) => f.value === value));
  }, [value, options]);
  return (
    <>
      <div className="flex items-center space-x-2">
        <RenderOption option={selected} display={display} hasColors={true} />
        {/* {getColor() !== undefined && getColor() !== Colors.UNDEFINED && <ColorBadge color={getColor()} />}
        {getName() ? <div>{t(getName() ?? "")}</div> : <div>{t(value ?? "")}</div>} */}
      </div>
    </>
  );
}
