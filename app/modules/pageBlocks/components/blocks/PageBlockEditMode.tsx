import { useLocation, useSearchParams } from "@remix-run/react";
import clsx from "clsx";
import { useState } from "react";
import ChatGptIcon from "~/components/ui/icons/ai/ChatGptIcon";
import ActionResultModal, { ActionResultDto } from "~/components/ui/modals/ActionResultModal";
import Modal from "~/components/ui/modals/Modal";
import ChatGptSetParametersButton from "~/modules/ai/components/ChatGptSetParametersButton";
import { PageBlockDto } from "~/modules/pageBlocks/dtos/PageBlockDto";
import { siteTags } from "../../utils/defaultSeoMetaTags";
import PageBlocksTemplateEditor from "./PageBlocksTemplateEditor";

export default function PageBlockEditMode({ items, onSetBlocks }: { items: PageBlockDto[]; onSetBlocks: (items: PageBlockDto[]) => void; canExit?: boolean }) {
  const location = useLocation();
  // const [searchParams, setSearchParams] = useSearchParams();
  const [settingTemplate, setSettingTemplate] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResultDto>();
  const [searchParams, setSearchParams] = useSearchParams();

  // function isEditMode() {
  //   return searchParams.get("editMode") !== "false";
  // }
  // function toggleEditMode() {
  //   if (searchParams.get("editMode") === "false") {
  //     setSearchParams({ editMode: "true" });
  //   } else {
  //     setSearchParams({ editMode: "false" });
  //   }
  // }

  function onDownload() {
    if (items.length === 0) {
      setActionResult({ error: { title: "Error", description: "No blocks to download" } });
      return;
    }

    const jsonBlocks = JSON.stringify(items, null, "\t");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonBlocks);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `blocks.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    setActionResult({
      success: {
        title: "Blocks Downloaded",
        description: "Paste the blocks at app/modules/pageBlocks/utils/defaultPages/defaultLandingPage.ts 'const blocks: PageBlockDto[] = [...'",
      },
    });
  }

  function onSetTemplate() {
    setSettingTemplate(true);
  }

  function onSelectedBlocks(items: PageBlockDto[]) {
    setSettingTemplate(false);
    onSetBlocks(items);
  }

  return (
    <div>
      {/* {isEditMode() && ( */}
      <div className="bg-gray-900 p-2 text-gray-50 dark:bg-gray-50 dark:text-gray-900">
        <div className="flex justify-center space-x-2">
          <ChatGptSetParametersButton
            className={clsx(
              "flex items-center justify-center space-x-1 rounded-md border border-transparent px-4 py-2 text-xs font-medium shadow-sm sm:text-sm",
              "border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700"
            )}
            value={[
              { name: "Page Slug", value: location.pathname },
              { name: "Website Title", value: siteTags.title },
              { name: "Website Description", value: siteTags.description },
              { name: "Website Keywords", value: siteTags.keywords },
              { name: "Website Image", value: siteTags.image },
              { name: "Page Details", value: "" },
            ]
              .map((p) => `${p.name}: ${p.value}`)
              .join("\n")}
            onGenerate={(info) => {
              searchParams.set("aiGenerateBlocks", encodeURIComponent(info));
              setSearchParams(searchParams);
            }}
          >
            <ChatGptIcon className="h-5 w-5" />
          </ChatGptSetParametersButton>
          <button
            type="button"
            onClick={onDownload}
            className={clsx(
              "flex items-center justify-center space-x-1 rounded-md border border-transparent px-4 py-2 text-xs font-medium shadow-sm sm:text-sm",
              "border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700"
            )}
          >
            <div>
              <span className="hidden sm:block">Download Blocks</span>
              <span className="sm:hidden">Download</span>
            </div>
          </button>
          <button
            type="button"
            className={clsx(
              "flex items-center justify-center space-x-1 rounded-md border border-transparent px-4 py-2 text-xs font-medium shadow-sm sm:text-sm",
              "border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700"
            )}
            onClick={onSetTemplate}
          >
            <div>
              <span className="hidden sm:block">Set Template</span>
              <span className="sm:hidden">Template</span>
            </div>
          </button>
        </div>
      </div>
      {/* )} */}

      <ActionResultModal actionResult={actionResult} />

      <Modal open={settingTemplate} setOpen={setSettingTemplate}>
        <div>
          <PageBlocksTemplateEditor items={items} onSelected={onSelectedBlocks} />
        </div>
      </Modal>
    </div>
  );
}
