import { Menu } from "@headlessui/react";
import { EntityWorkflowState } from "@prisma/client";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import Dropdown from "~/components/ui/dropdowns/Dropdown";
import FlowIcon from "~/components/ui/icons/crm/FlowIcon";

export default function RowSetManualWorkflowState({
  current,
  disabled,
  workflowStates,
  size = "md",
  onClick,
}: {
  current: string | undefined;
  disabled: boolean;
  workflowStates: EntityWorkflowState[];
  size?: "sm" | "md" | "lg";
  onClick: (stateName: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dropdown
      button={
        <>
          <FlowIcon className="h-4 w-4 text-gray-500" />
          <svg xmlns="http://www.w3.org/2000/svg" className="-mr-1 ml-1 h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </>
      }
      btnClassName={clsx(
        "inline-flex items-center w-full justify-center rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-gray-100",
        size === "sm" && "px-2 py-1.5",
        size === "md" && "px-2 py-2"
      )}
      options={
        <div className="z-50">
          {workflowStates
            .filter((f) => f.name !== current)
            .map((state) => {
              return (
                <Menu.Item key={state.id} disabled={disabled}>
                  {({ active }) => (
                    <button
                      disabled={disabled}
                      type="button"
                      onClick={() => onClick(state.name)}
                      className={clsx(
                        "flex w-full items-center space-x-2 text-left",
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                        "block px-4 py-2 text-sm"
                      )}
                    >
                      <div>
                        <span className="text-xs font-bold">[SuperAdmin]</span> Set {t(state.title)}
                      </div>
                    </button>
                  )}
                </Menu.Item>
              );
            })}
        </div>
      }
    />
  );
}
