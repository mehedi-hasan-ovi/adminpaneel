import { EntityWorkflowState } from "@prisma/client";
import { useTranslation } from "react-i18next";
import ColorBadge from "~/components/ui/badges/ColorBadge";

interface Props {
  state: EntityWorkflowState | null;
  withName?: boolean;
}
export default function WorkflowStateBadge({ state, withName }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center space-x-2 text-sm font-medium">
      {state && (
        <>
          <ColorBadge color={state.color} />
          <div>
            {t(state.title)} {withName && <span className="text-xs font-light text-gray-400">({state.name})</span>}
          </div>
        </>
      )}
    </div>
  );
}
