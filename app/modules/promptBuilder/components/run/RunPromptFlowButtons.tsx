import { Fragment, useEffect, useState } from "react";
import { PromptFlowWithDetails } from "../../db/promptFlows.db.server";
import ButtonSecondary from "~/components/ui/buttons/ButtonSecondary";
import StarsIconFilled from "~/components/ui/icons/StarsIconFilled";
import SlideOverWideEmpty from "~/components/ui/slideOvers/SlideOverWideEmpty";
import navigation from "~/routes/admin/navigation";
import RunPromptFlowForm from "./RunPromptFlowForm";
import { useTranslation } from "react-i18next";
import { useNavigation, useSubmit } from "@remix-run/react";
import Dropdown from "~/components/ui/dropdowns/Dropdown";
import { Menu } from "@headlessui/react";
import clsx from "clsx";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";

interface Props {
  type: "list" | "edit";
  promptFlows: PromptFlowWithDetails[];
  fromRows?: RowWithDetails[];
  toRows?: RowWithDetails[];
  disabled?: boolean;
  className?: string;
}
export default function RunPromptFlowButtons({ type, promptFlows, fromRows, toRows, disabled, className }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [items, setItems] = useState<PromptFlowWithDetails[]>([]);
  const [isSettingPromptFlowVariables, setIsSettingPromptFlowVariables] = useState<PromptFlowWithDetails | null>(null);

  useEffect(() => {
    if (type === "list") {
      setItems(promptFlows.filter((f) => f.inputEntityId === null));
    } else if (type === "edit") {
      if (fromRows && fromRows.length === 1 && toRows && toRows.length === 1) {
        let items: PromptFlowWithDetails[] = [];
        promptFlows.forEach((promptFlow) => {
          if (promptFlow.inputEntityId === fromRows[0].entityId) {
            items.push(promptFlow);
            return;
          }
          // const output = promptFlow.outputs.find((f) => f.entityId === toRows[0].entityId);
          // if (output) {
          //   items.push(promptFlow);
          //   return;
          // }
        });
        setItems(items);
      }
    }
  }, [type, promptFlows]);

  function onRun(item: PromptFlowWithDetails) {
    if (item.inputVariables.length > 0) {
      setIsSettingPromptFlowVariables(item);
    } else {
      const form = new FormData();
      form.set("action", "run-prompt-flow");
      form.set("promptFlowId", item.id);
      if (fromRows) {
        fromRows.forEach((f) => {
          form.append("fromRows[]", JSON.stringify({ id: f.id }));
        });
      }
      if (toRows) {
        toRows.forEach((f) => {
          form.append("toRows[]", JSON.stringify({ id: f.id }));
        });
      }
      submit(form, {
        method: "post",
      });
    }
  }

  function isLoading(f: PromptFlowWithDetails) {
    return navigation.state === "submitting" && navigation.formData?.get("promptFlowId") === f.id;
  }
  return (
    <div>
      {items.length === 0 ? null : items.length > 1 ? (
        <Dropdown
          right={false}
          disabled={disabled}
          isLoading={navigation.state === "submitting" && navigation.formData?.get("action") === "run-prompt-flow"}
          button={
            <div className={clsx(className)}>
              <StarsIconFilled className="h-4 w-4 text-theme-500" />
            </div>
          }
          options={
            <div>
              {items.map((item) => {
                return (
                  <Menu.Item key={item.id}>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => onRun(item)}
                        className={clsx("w-full text-left", active ? "bg-gray-100 text-gray-900" : "text-gray-700", "block px-4 py-2 text-sm")}
                      >
                        {item.actionTitle}
                      </button>
                    )}
                  </Menu.Item>
                );
              })}
            </div>
          }
        ></Dropdown>
      ) : (
        items.map((item) => {
          return (
            <ButtonSecondary key={item.id} disabled={disabled} isLoading={isLoading(item)} onClick={() => onRun(item)}>
              <div className={className}>
                <StarsIconFilled className="h-4 w-4 text-theme-500" />
              </div>
            </ButtonSecondary>
          );
        })
      )}

      <div className="z-50">
        <SlideOverWideEmpty
          title={isSettingPromptFlowVariables?.actionTitle ?? "Run prompt flow"}
          className="sm:max-w-sm"
          open={!!isSettingPromptFlowVariables}
          onClose={() => setIsSettingPromptFlowVariables(null)}
        >
          {isSettingPromptFlowVariables && <RunPromptFlowForm item={isSettingPromptFlowVariables} fromRows={fromRows} toRows={toRows} />}
        </SlideOverWideEmpty>
      </div>
    </div>
  );
}
