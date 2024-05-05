import { useLocation, useSearchParams, useSubmit } from "@remix-run/react";
import { useEffect } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { allCookieCategories } from "~/application/cookies/ApplicationCookies";
import { CookieCategory } from "~/application/cookies/CookieCategory";
import { useRootData } from "~/utils/data/useRootData";
import CookieHelper from "~/utils/helpers/CookieHelper";
import CookiesList from "./CookiesList";

interface Props {
  onUpdated?: () => void;
}
export default function CookieConsentSettings({ onUpdated }: Props) {
  const { t } = useTranslation();
  let { userSession } = useRootData();
  const submit = useSubmit();
  let location = useLocation();
  const [searchParams] = useSearchParams();

  const [selectedCookies, setSelectedCookies] = useState<CookieCategory[]>([]);

  useEffect(() => {
    const initial: CookieCategory[] = [];
    allCookieCategories.forEach((cookie) => {
      if (userSession.cookies.find((f) => f.allowed && f.category === CookieCategory[cookie])) {
        initial.push(cookie);
      }
    });
    setSelectedCookies(initial);
  }, [userSession.cookies]);

  function setCookies(selectedCookies: CookieCategory[]) {
    const form = CookieHelper.getUpdateCookieConsentForm({ selectedCookies, location, searchParams });
    submit(form, { method: "post", action: "/" });
    if (onUpdated) {
      onUpdated();
    }
  }

  function toggle(category: CookieCategory) {
    if (selectedCookies.includes(category)) {
      setSelectedCookies(selectedCookies.filter((f) => f !== category));
    } else {
      setSelectedCookies([...selectedCookies, category]);
    }
  }
  function deny() {
    setCookies([CookieCategory.REQUIRED]);
  }
  function allowSelected() {
    setCookies(selectedCookies);
  }
  function allowAll() {
    setCookies(allCookieCategories);
  }

  return (
    <div className="space-y-3">
      <div className="font-extrabold">Cookies</div>

      <CookiesList selectedCookies={selectedCookies} toggle={toggle} />

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={deny}
          className="inline-flex items-center justify-center truncate rounded-md border border-gray-300 bg-white px-6 py-3 text-center text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:ring-offset-2"
        >
          {t("shared.deny")}
        </button>
        <button
          type="button"
          onClick={allowSelected}
          className="inline-flex items-center justify-center truncate rounded-md border border-gray-300 bg-white px-6 py-3 text-center text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:ring-offset-2"
        >
          {t("shared.allowSelected")}
        </button>
        <button
          type="button"
          onClick={allowAll}
          className="inline-flex items-center justify-center truncate rounded-md border border-transparent bg-theme-600 px-6 py-3 text-center text-base font-medium text-white shadow-sm hover:bg-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:ring-offset-2"
        >
          {t("shared.allowAll")}
        </button>
      </div>
    </div>
  );
}
