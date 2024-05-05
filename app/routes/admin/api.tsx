import { json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import IncreaseIcon from "~/components/ui/icons/crm/IncreaseIcon";
import IncreaseIconFilled from "~/components/ui/icons/crm/IncreaseIconFilled";
import ActivityHistoryIcon from "~/components/ui/icons/entities/ActivityHistoryIcon";
import ActivityHistoryIconFilled from "~/components/ui/icons/entities/ActivityHistoryIconFilled";
import KeyIcon from "~/components/ui/icons/entities/KeyIcon";
import KeyIconFilled from "~/components/ui/icons/entities/KeyIconFilled";
import RestApiIcon from "~/components/ui/icons/entities/RestApiIcon";
import RestApiIconFilled from "~/components/ui/icons/entities/RestApiIconFilled";
import IndexPageLayout from "~/components/ui/layouts/IndexPageLayout";
import SidebarIconsLayout from "~/components/ui/layouts/SidebarIconsLayout";

type LoaderData = {
  title: string;
};

export let loader: LoaderFunction = async ({ request }) => {
  const data: LoaderData = {
    title: `API | ${process.env.APP_NAME}`,
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
          name: "Overview",
          href: "/admin/api",
          icon: <IncreaseIcon className="h-5 w-5" />,
          iconSelected: <IncreaseIconFilled className="h-5 w-5" />,
          exact: true,
        },
        {
          name: "Docs",
          href: "/admin/api/docs",
          icon: <RestApiIcon className="h-5 w-5" />,
          iconSelected: <RestApiIconFilled className="h-5 w-5" />,
        },
        {
          name: t("models.apiKey.plural"),
          href: "/admin/api/keys",
          icon: <KeyIcon className="h-5 w-5" />,
          iconSelected: <KeyIconFilled className="h-5 w-5" />,
        },
        {
          name: t("models.log.plural"),
          href: "/admin/api/logs",
          icon: <ActivityHistoryIcon className="h-5 w-5" />,
          iconSelected: <ActivityHistoryIconFilled className="h-5 w-5" />,
        },
      ]}
    >
      <IndexPageLayout>
        <Outlet />
      </IndexPageLayout>
    </SidebarIconsLayout>
  );
};
