import clsx from "clsx";
import { marked } from "marked";
import { ReactNode, useState } from "react";
import ButtonSecondary from "../buttons/ButtonSecondary";
import Modal from "../modals/Modal";

export default function ShowHtmlModalButton({
  html,
  title,
  link,
}: {
  html: string | undefined | null;
  title: string;
  link?: {
    href: string;
    target?: undefined | "_blank";
    text: ReactNode;
  };
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex space-x-2">
        <button type="button" disabled={!html} onClick={() => setOpen(true)} className={clsx(html && "hover:underline")}>
          {title}
        </button>
      </div>

      <Modal className="sm:max-w-md" open={open} setOpen={setOpen}>
        <div>
          <div className="flex items-center justify-between space-x-2">
            <div className="text-lg font-medium text-gray-800">{title ?? "Details"}</div>
            {link && (
              <ButtonSecondary className="group" to={link.href} target={link.target}>
                {link.text}
              </ButtonSecondary>
            )}
          </div>
          <div className="prose mt-2 border-t border-gray-200 pt-2">
            <div
              dangerouslySetInnerHTML={{
                __html: marked(html ?? ""),
              }}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
