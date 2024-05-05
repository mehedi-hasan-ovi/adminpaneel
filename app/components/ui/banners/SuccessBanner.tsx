import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@remix-run/react";
import CheckIcon from "../icons/CheckIcon";

interface Props {
  title?: string;
  text?: ReactNode | string;
  redirect?: string;
  children?: ReactNode;
}

export default function SuccessBanner({ title, text = "", redirect, children }: Props) {
  const { t } = useTranslation();
  return (
    <div className="not-prose rounded-md border border-teal-300 bg-teal-50">
      <div className="rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckIcon className="h-5 w-5 text-teal-400" />
          </div>

          <div className="ml-3 w-full">
            {title && <h3 className="text-sm font-medium leading-5 text-teal-900">{t(title)}</h3>}
            <div className="mt-2 text-sm leading-5 text-teal-800">
              <div>
                {text}{" "}
                {redirect && (
                  <Link className="mt-2 text-teal-900 underline" to={redirect}>
                    {t("shared.goTo")} {redirect}
                  </Link>
                )}
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
