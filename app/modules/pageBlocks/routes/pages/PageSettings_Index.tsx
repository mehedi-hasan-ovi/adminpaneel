import { LoaderFunction, redirect, ActionFunction, json } from "@remix-run/node";
import { i18nHelper } from "~/locale/i18n.utils";
import { deleteMetaTags } from "~/modules/pageBlocks/db/pageMetaTags.db.server";
import { deletePage, getPage, PageWithDetails, updatePage } from "~/modules/pageBlocks/db/pages.db.server";
import { PageConfiguration } from "../../dtos/PageConfiguration";

export namespace PageSettings_Index {
  export type LoaderData = {
    page: PageWithDetails;
  };
  export let loader: LoaderFunction = async ({ request, params }) => {
    const page = await getPage(params.id!);
    if (!page) {
      return redirect(params.tenant ? `/app/${params.tenant}/settings/pages` : "/admin/pages");
    }
    const data: LoaderData = {
      page,
    };
    return json(data);
  };

  export type ActionData = {
    success: string;
    error: string;
    page?: PageConfiguration;
  };

  async function handleUpdate(form: FormData, item: PageWithDetails) {
    const isPublished = form.get("isPublished");
    const isPublic = form.get("isPublic");
    await updatePage(item.id, {
      isPublished: isPublished === "true" || isPublished === "on",
      isPublic: isPublic === "true" || isPublic === "on",
    });
    return json({ success: "Page updated successfully" });
  }

  async function handleDelete(item: PageWithDetails, tenant?: string) {
    if (item.blocks.length > 0) {
      return json({ error: "Page has custom blocks, please delete them first" }, { status: 400 });
    }
    if (item.metaTags.length > 0) {
      return json({ error: "Page has meta tags, please delete them first" }, { status: 400 });
    }
    await deleteMetaTags(item.id);
    await deletePage(item.id);
    return redirect(tenant ? `/app/${tenant}/settings/pages` : "/admin/pages");
  }

  export const action: ActionFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const form = await request.formData();
    const action = form.get("action")?.toString();
    const item = await getPage(params.id!);

    if (!item) {
      return redirect(params.tenant ? `/app/${params.tenant}/settings/pages` : "/admin/pages");
    }

    switch (action) {
      case "update":
        return await handleUpdate(form, item);
      case "delete":
        return await handleDelete(item, params.tenant);
      default:
        return json({ error: t("shared.invalidForm") });
    }
  };
}
