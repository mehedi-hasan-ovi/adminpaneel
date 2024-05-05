import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../modals/Modal";

export default function ShowPayloadModalButton({
  payload,
  title,
  description,
  withCopy = true,
}: {
  payload: string;
  title?: string;
  description?: string;
  withCopy?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  function stringifyDetails() {
    try {
      return JSON.stringify(JSON.parse(payload ?? "{}"), null, "\t");
    } catch (e) {
      return JSON.stringify(payload, null, "\t");
    }
  }
  return (
    <>
      <div className="flex space-x-2">
        {payload !== null && (
          <button type="button" onClick={() => setOpen(true)} className="border-b border-dotted border-gray-400 hover:border-dashed hover:border-theme-400">
            {/* {t("models.log.details")} */}
            {description ?? JSON.stringify(payload)}
          </button>
        )}
      </div>

      <Modal className="sm:max-w-xl" open={open} setOpen={setOpen}>
        <div className="flex justify-between space-x-2">
          <div className="text-lg font-medium text-gray-800">{title ?? "Details"}</div>
          <div>
            {withCopy && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(payload ?? "");
                }}
                className="inline-flex items-center rounded-md border border-transparent bg-theme-100 px-3 py-2 text-sm font-medium leading-4 text-theme-700 hover:bg-theme-200 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:ring-offset-2"
              >
                {t("shared.copy")}
              </button>
            )}
          </div>
        </div>
        <div className="prose mt-2 rounded-lg border-2 border-dashed border-gray-800 bg-gray-800">
          <pre>{stringifyDetails()}</pre>
        </div>
      </Modal>
    </>
  );
}
