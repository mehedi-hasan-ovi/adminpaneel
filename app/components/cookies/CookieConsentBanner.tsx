import { Link, useLocation, useSearchParams, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { allCookieCategories } from "~/application/cookies/ApplicationCookies";
import { CookieCategory } from "~/application/cookies/CookieCategory";
import { useRootData } from "~/utils/data/useRootData";
import CookieHelper from "~/utils/helpers/CookieHelper";
import OpenModal from "../ui/modals/OpenModal";
import CookieConsentSettings from "./CookieConsentSettings";

export default function CookieConsentBanner() {
  const { t } = useTranslation();
  const submit = useSubmit();
  let location = useLocation();
  const { userSession } = useRootData();
  const [searchParams] = useSearchParams();
  const [showCookieSettingsModal, setShowCookieSettingsModal] = useState(false);

  function setCookies(selectedCookies: CookieCategory[]) {
    const form = CookieHelper.getUpdateCookieConsentForm({ selectedCookies, location, searchParams });
    submit(form, { method: "post", action: "/" });
  }

  return (
    <>
      {CookieHelper.requiresCookieConsent(userSession, searchParams) && (
        <div className="relative">
          <div className="fixed inset-x-0 bottom-0 z-10 pb-2 sm:pb-5">
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="rounded-lg bg-theme-600 p-2 shadow-lg sm:p-3">
                <div className="flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
                  <div className="flex items-start space-x-2">
                    <div className="rounded-full bg-theme-700 p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-theme-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        <span className="md:hidden"> {t("cookies.titleSmall")} </span>
                        <span className="hidden md:inline"> {t("cookies.title")} </span>
                      </p>
                      <p className="text-sm font-light text-gray-100">
                        <span className="md:hidden">
                          {t("cookies.descriptionSmall")}{" "}
                          <Link to="/privacy-policy" className="underline">
                            {t("shared.learnMore")}
                          </Link>
                          .{" "}
                        </span>
                        <span className="hidden md:inline">
                          {" "}
                          {t("cookies.description")}{" "}
                          <Link to="/privacy-policy" className="underline">
                            {t("shared.learnMore")}
                          </Link>{" "}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="w-full border-t border-theme-300 sm:hidden"></div>
                  <div className="flex w-full flex-shrink-0 flex-col space-y-2 sm:mt-0 sm:w-auto sm:flex-row sm:space-x-2 sm:space-y-0">
                    <button
                      type="button"
                      onClick={() => setShowCookieSettingsModal(true)}
                      className="flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-theme-50 underline hover:text-gray-100 focus:outline-none sm:order-first"
                    >
                      {" "}
                      {t("cookies.settings")}{" "}
                    </button>
                    <button
                      onClick={() => setCookies(allCookieCategories)}
                      className="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium text-theme-600 shadow-sm hover:bg-theme-50 focus:outline-none"
                    >
                      {" "}
                      {t("cookies.accept")}{" "}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {showCookieSettingsModal && (
            <OpenModal onClose={() => setShowCookieSettingsModal(false)}>
              <CookieConsentSettings />
            </OpenModal>
          )}
        </div>
      )}
    </>
  );
}
