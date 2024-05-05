import { LoaderArgs, V2_MetaFunction, json, redirect } from "@remix-run/node";
import { useParams, Outlet } from "@remix-run/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import RectangleGroupIconFilled from "~/components/ui/icons/entities/RectangleGroupIconFilled";
import SidebarIconsLayout, { IconDto } from "~/components/ui/layouts/SidebarIconsLayout";
import { i18nHelper } from "~/locale/i18n.utils";
import UrlUtils from "~/utils/app/UrlUtils";
import { useAppOrAdminData } from "~/utils/data/useAppOrAdminData";
import { getEntityGroupBySlug } from "~/utils/db/entities/entityGroups.db.server";
import { getTenantIdOrNull } from "~/utils/services/urlService";

type LoaderData = {
  title: string;
};
export let loader = async ({ request, params }: LoaderArgs) => {
  const { t } = await i18nHelper(request);
  const tenantId = await getTenantIdOrNull({ request, params });
  const group = await getEntityGroupBySlug(params.group!);
  if (!group) {
    throw redirect(tenantId ? UrlUtils.currentTenantUrl(params, "404") : "/404");
  }
  const data: LoaderData = {
    title: `${t(group.title)} | ${process.env.APP_NAME}`,
  };
  return json(data);
};

export const meta: V2_MetaFunction = ({ data }) => [{ title: data?.title }];

export default () => {
  const { t } = useTranslation();
  const appOrAdminData = useAppOrAdminData();
  const params = useParams();
  const [items, setItems] = useState<IconDto[]>([]);

  useEffect(() => {
    const group = appOrAdminData.entityGroups.find((f) => f.slug === params.group);
    if (!group) {
      return;
    }
    const items: IconDto[] = [
      {
        name: t("shared.all"),
        href: params.tenant ? `/app/${params.tenant}/g/${params.group}` : `/admin/g/${params.group}`,
        exact: true,
        icon: <RectangleGroupIconFilled className="h-5 w-5 text-gray-400" />,
        iconSelected: <RectangleGroupIconFilled className="h-5 w-5 text-gray-500" />,
      },
    ];
    group.entities.forEach(({ entity }) => {
      items.push({
        name: t(entity.titlePlural),
        href: params.tenant ? `/app/${params.tenant}/g/${params.group}/${entity.slug}` : `/admin/g/${params.group}/${entity.slug}`,
        // icon: entity.icon,
        // iconSelected: entity.icon,
        textIcon: entity.icon,
        textIconSelected: entity.icon,
      });
    });
    setItems(items);
  }, [appOrAdminData, params.group, params.tenant, t]);

  return (
    <SidebarIconsLayout label={{ align: "right" }} items={items}>
      <Outlet />
    </SidebarIconsLayout>
  );
};
