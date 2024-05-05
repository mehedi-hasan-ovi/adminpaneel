import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import clsx from "~/utils/shared/ClassesUtils";
import { useOuterClick } from "~/utils/shared/KeypressUtils";
import { useParams, useSubmit } from "@remix-run/react";
import UserUtils from "~/utils/app/UserUtils";
import UrlUtils from "~/utils/app/UrlUtils";
import { useAppOrAdminData } from "~/utils/data/useAppOrAdminData";
import { getUserHasPermission } from "~/utils/helpers/PermissionsHelper";

interface Props {
  layout: "app" | "admin" | "docs";
}

export default function ProfileButton({ layout }: Props) {
  const params = useParams();
  const data = useAppOrAdminData();
  const { t } = useTranslation();
  const submit = useSubmit();
  const appOrAdminData = useAppOrAdminData();

  const [opened, setOpened] = useState(false);

  function closeDropdownUser() {
    setOpened(false);
  }
  function signOut() {
    submit(null, { method: "post", action: "/logout" });
  }

  const clickOutside = useOuterClick(() => setOpened(false));

  return (
    <div ref={clickOutside} className="relative">
      <div className="inline-flex divide-x divide-gray-300 rounded-sm shadow-none">
        <button
          onClick={() => setOpened(!opened)}
          className={clsx(
            "relative inline-flex items-center rounded-full border border-gray-100 bg-gray-50 font-medium text-gray-500 shadow-inner hover:text-theme-800 focus:z-10 focus:text-theme-900 focus:outline-none focus:ring-2 focus:ring-theme-100 focus:ring-offset-2 focus:ring-offset-theme-50",
            !data.user?.avatar && "p-2 hover:bg-theme-300 focus:bg-theme-400",
            data.user?.avatar && "p-1 hover:bg-gray-200"
          )}
          id="user-menu"
          aria-label="User menu"
          aria-haspopup="true"
        >
          {(() => {
            if (data.user?.avatar) {
              return <img className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800" src={data.user.avatar} alt="Avatar" />;
            } else {
              return (
                <span className="inline-block h-5 w-5 overflow-hidden rounded-full">
                  <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
              );
            }
          })()}
        </button>
      </div>

      <Transition
        as={Fragment}
        show={opened}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div className="absolute right-0 z-40 mt-2 w-64 origin-top-right divide-y divide-gray-200 overflow-hidden rounded-sm bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="shadow-xs rounded-sm bg-white py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
            <div className="group flex items-center truncate px-4 py-2 text-sm text-gray-700 transition duration-150 ease-in-out" role="menuitem">
              <div className="flex flex-col space-y-1 truncate">
                <div className="font-medium">{UserUtils.profileName(data.user)}</div>
                <div className="truncate font-bold">{data.user?.email}</div>
              </div>
            </div>
            <div className="border-t border-gray-200"></div>

            {layout === "app" ? (
              <>
                <Link
                  className="block px-4 py-2 text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100"
                  role="menuitem"
                  onClick={closeDropdownUser}
                  to={UrlUtils.currentTenantUrl(params, `settings/profile`)}
                >
                  {t("app.navbar.profile")}
                </Link>

                {getUserHasPermission(appOrAdminData, "app.settings.members.view") && (
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100"
                    role="menuitem"
                    onClick={closeDropdownUser}
                    to={UrlUtils.currentTenantUrl(params, "settings/members")}
                  >
                    {t("app.navbar.members")}
                  </Link>
                )}

                {getUserHasPermission(appOrAdminData, "app.settings.subscription.view") && (
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100"
                    role="menuitem"
                    onClick={closeDropdownUser}
                    to={UrlUtils.currentTenantUrl(params, `settings/subscription`)}
                  >
                    {t("app.navbar.subscription")}
                  </Link>
                )}

                {getUserHasPermission(appOrAdminData, "app.settings.account.view") && (
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100"
                    role="menuitem"
                    onClick={closeDropdownUser}
                    to={UrlUtils.currentTenantUrl(params, "settings/account")}
                  >
                    {t("app.navbar.tenant")}
                  </Link>
                )}

                {/* {getUserHasPermission(appOrAdminData, "app.settings.roles.view") && (
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100"
                    role="menuitem"
                    onClick={closeDropdownUser}
                    to={UrlUtils.currentTenantUrl(params, "settings/roles-and-permissions")}
                  >
                    {t("models.role.plural")}
                  </Link>
                )} */}

                {/* <Link
                  className="block px-4 py-2 text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100"
                  role="menuitem"
                  onClick={closeDropdownUser}
                  to={UrlUtils.currentTenantUrl(params, "settings/groups")}
                >
                  {t("models.group.plural")}
                </Link> */}

                {getUserHasPermission(appOrAdminData, "app.settings.linkedAccounts.view") && (
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100"
                    role="menuitem"
                    onClick={closeDropdownUser}
                    to={UrlUtils.currentTenantUrl(params, `settings/linked-accounts`)}
                  >
                    {t("models.linkedAccount.plural")}
                  </Link>
                )}

                {getUserHasPermission(appOrAdminData, "app.settings.apiKeys.view") && (
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100"
                    role="menuitem"
                    onClick={closeDropdownUser}
                    to={UrlUtils.currentTenantUrl(params, `settings/api`)}
                  >
                    {t("models.apiKey.plural")}
                  </Link>
                )}

                {getUserHasPermission(appOrAdminData, "app.settings.auditTrails.view") && (
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100"
                    role="menuitem"
                    onClick={closeDropdownUser}
                    to={UrlUtils.currentTenantUrl(params, "settings/audit-trails")}
                  >
                    {t("models.log.plural")}
                  </Link>
                )}

                <div className="mt-1 border-t border-gray-200"></div>
              </>
            ) : (
              <Link
                className="block px-4 py-2 text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100"
                role="menuitem"
                onClick={closeDropdownUser}
                to={`/admin/settings/profile`}
              >
                {t("app.navbar.profile")}
              </Link>
            )}

            <button
              onClick={signOut}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none"
              role="menuitem"
            >
              {t("app.navbar.signOut")}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  );
}
