import { json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import ServerError from "~/components/ui/errors/ServerError";
import TagsIcon from "~/components/ui/icons/crud/TagsIcon";
import TagsIconFilled from "~/components/ui/icons/crud/TagsIconFilled";
import BlockIcon from "~/components/ui/icons/pages/BlockIcon";
import BlockIconFilled from "~/components/ui/icons/pages/BlockIconFilled";
import SidebarIconsLayout from "~/components/ui/layouts/SidebarIconsLayout";
import { i18nHelper } from "~/locale/i18n.utils";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";

type LoaderData = {
  title: string;
};

export let loader: LoaderFunction = async ({ request }) => {
  const { t } = await i18nHelper(request);
  await verifyUserHasPermission(request, "admin.pages.view");
  const data: LoaderData = {
    title: `${t("pages.title")} | ${process.env.APP_NAME}`,
  };
  return json(data);
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default () => {
  const { t } = useTranslation();
  return (
    <SidebarIconsLayout
      label={{ align: "right" }}
      items={[
        {
          name: t("pages.title"),
          href: `/admin/pages`,
          exact: true,
          icon: <BlockIcon className="h-5 w-5" />,
          iconSelected: <BlockIconFilled className="h-5 w-5" />,
        },
        {
          name: "SEO",
          href: `/admin/pages/seo`,
          exact: true,
          icon: <TagsIcon className="h-5 w-5" />,
          iconSelected: <TagsIconFilled className="h-5 w-5" />,
        },
        {
          name: "AB Testing",
          href: `/admin/pages/ab`,
          exact: true,
          icon: "🚧",
          iconSelected: "🚧",
        },
      ]}
    >
      <Outlet />
    </SidebarIconsLayout>
  );
};

export function ErrorBoundary() {
  return <ServerError />;
}
