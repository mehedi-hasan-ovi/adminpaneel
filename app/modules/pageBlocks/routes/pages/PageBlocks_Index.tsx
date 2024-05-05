import { LoaderFunction, redirect, ActionFunction, json } from "@remix-run/node";
import { PageBlockDto } from "~/modules/pageBlocks/dtos/PageBlockDto";
import { i18nHelper } from "~/locale/i18n.utils";
import { deletePageBlocks, createPageBlock } from "~/modules/pageBlocks/db/pageBlocks.db.server";
import { deletePage, getPage } from "../../db/pages.db.server";
import { PageConfiguration } from "../../dtos/PageConfiguration";
import { getPageConfiguration } from "../../services/pagesService";
import { Page } from "@prisma/client";

export namespace PageBlocks_Index {
  export type LoaderData = {
    page: PageConfiguration;
  };
  export let loader: LoaderFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const item = await getPage(params.id!);
    if (!item) {
      return redirect("/admin/pages");
    }
    const page = await getPageConfiguration({ request, t, page: item, slug: item.slug });
    const data: LoaderData = {
      page,
    };
    return json(data);
  };

  export type ActionData = {
    success: string;
    error: string;
    page?: PageConfiguration;
    aiGeneratedBlocks?: PageBlockDto[];
  };

  async function handleSaveAction(form: FormData, item: Page): Promise<Response> {
    const blocks = form.get("blocks");
    try {
      const parsed = JSON.parse(blocks?.toString() ?? "[]") as PageBlockDto[];
      await deletePageBlocks(item.id);
      await Promise.all(
        parsed.map(async (block, idx) => {
          const keys = Object.keys(block);
          if (keys.length === 0) {
            throw new Error("Invalid block type: " + JSON.stringify(block));
          }
          const type = keys[0];
          return await createPageBlock({
            pageId: item.id,
            order: idx + 1,
            type,
            value: JSON.stringify(block),
          });
        })
      );
      return json({
        success: "Page blocks saved successfully",
      });
    } catch (e: any) {
      return json({ error: e.message }, { status: 400 });
    }
  }

  async function handleResetAction(item: Page, params: any, request: any, t: any): Promise<Response> {
    await deletePageBlocks(params.route!);
    return json({
      success: "Page blocks reset successfully",
      page: await getPageConfiguration({ request, t, slug: item.slug }),
    });
  }

  async function handleDeleteAction(item: Page): Promise<Response> {
    await deletePageBlocks(item.id);
    await deletePage(item.id);
    return redirect("/admin/pages");
  }

  export const action: ActionFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const form = await request.formData();
    const action = form.get("action")?.toString();

    const item = await getPage(params.id!);
    if (!item) {
      return redirect("/admin/pages");
    }
    // const page = await getPageConfiguration({ request, t, page: item, slug: item.slug });

    switch (action) {
      case "save":
        return handleSaveAction(form, item);
      case "reset":
        return handleResetAction(item, params, request, t);
      case "delete":
        return handleDeleteAction(item);
      default:
        return json({ error: t("shared.invalidForm") });
    }
  };
}
