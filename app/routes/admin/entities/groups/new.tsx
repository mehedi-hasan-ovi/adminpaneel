import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { useTypedLoaderData } from "remix-typedjson";
import { EntityGroupForm } from "~/components/entities/EntityGroupForm";
import { i18nHelper } from "~/locale/i18n.utils";
import { EntityWithDetails, getAllEntities } from "~/utils/db/entities/entities.db.server";
import { createEntityGroup, getAllEntityGroups } from "~/utils/db/entities/entityGroups.db.server";
import { EntityViewWithTenantAndUser, getAllEntityViews } from "~/utils/db/entities/entityViews.db.server";
import { verifyUserHasPermission } from "~/utils/helpers/PermissionsHelper";

type LoaderData = {
  allEntities: EntityWithDetails[];
  systemViews: EntityViewWithTenantAndUser[];
};
export let loader = async ({ request, params }: LoaderArgs) => {
  await verifyUserHasPermission(request, "admin.entities.create");
  const data: LoaderData = {
    allEntities: await getAllEntities({ tenantId: null }),
    systemViews: (await getAllEntityViews({ type: "system" })).items,
  };
  return json(data);
};

export const action = async ({ request, params }: ActionArgs) => {
  const { t } = await i18nHelper(request);
  const form = await request.formData();
  const action = form.get("action")?.toString();

  if (action === "create") {
    await verifyUserHasPermission(request, "admin.entities.create");
    const slug = form.get("slug")?.toString().trim() ?? "";
    const title = form.get("title")?.toString().trim() ?? "";
    const icon = form.get("icon")?.toString().trim() ?? "";
    const collapsible = Boolean(form.get("collapsible"));
    const section = form.get("section")?.toString() ?? null;
    const entities: { entityId: string; allViewId: string | null }[] = form.getAll("entities[]").map((f) => JSON.parse(f.toString()));
    const allGroups = await getAllEntityGroups();
    let maxOrder = 0;
    if (allGroups.length > 0) {
      maxOrder = Math.max(...allGroups.map((f) => f.order ?? 0));
    }
    const existing = allGroups.find((f) => f.slug.trim() === slug.trim());
    if (existing) {
      return json({ error: "Group with this slug already exists" }, { status: 400 });
    }
    await createEntityGroup({
      order: maxOrder + 1,
      slug,
      title,
      icon,
      collapsible,
      section,
      entities,
    });
    return redirect("/admin/entities/groups");
  } else {
    return json({ error: t("shared.invalidForm") }, { status: 400 });
  }
};

export default function () {
  const data = useTypedLoaderData<LoaderData>();

  return (
    <div>
      <EntityGroupForm item={undefined} allEntities={data.allEntities} systemViews={data.systemViews} />
    </div>
  );
}
