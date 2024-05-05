import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/node";
import { i18nHelper } from "~/locale/i18n.utils";
import { deleteMetaTags, getMetaTags } from "~/modules/pageBlocks/db/pageMetaTags.db.server";
import { getPage, PageWithDetails } from "~/modules/pageBlocks/db/pages.db.server";
import { setPageMetaTags } from "../../services/pagesMetaTagsService";

export namespace PageMetaTags_Index {
  export type LoaderData = {
    title: string;
    page: PageWithDetails | null;
    metaTags: { name: string; content: string; order: number }[];
  };
  export let loader: LoaderFunction = async ({ request, params }) => {
    let page: PageWithDetails | null = null;
    if (params.id) {
      page = await getPage(params.id);
    } else if (params.tenant) {
      return redirect(`/app/${params.tenant}/settings/pages`);
    }
    const metaTags = await getMetaTags(page?.id ?? null);
    const data: LoaderData = {
      title: `SEO | ${process.env.APP_NAME}`,
      metaTags: metaTags.map((tag, idx) => {
        return { name: tag.name, content: tag.value, order: tag.order ?? idx + 1 };
      }),
      page,
    };
    return json(data);
  };

  export type ActionData = {
    success: string;
    error: string;
    metaTags?: { name: string; content: string; order: number }[];
  };

  async function handleReset(page: PageWithDetails | null) {
    await deleteMetaTags(page?.id ?? null);
    return json({ success: "Meta tags reset successfully", metaTags: [] });
  }

  async function handleUpdate(page: PageWithDetails | null, form: FormData) {
    const metaTags = form.getAll("metaTags[]").map((f: FormDataEntryValue) => {
      return JSON.parse(f.toString());
    });
    try {
      await setPageMetaTags(page?.id ?? null, metaTags);
      return json({ success: "Meta tags updated successfully", metaTags });
    } catch (e: any) {
      return json({ error: e.message }, { status: 400 });
    }
  }

  function handleError(t: (key: string) => string) {
    return json({ error: t("shared.invalidForm") }, { status: 400 });
  }

  export const action: ActionFunction = async ({ request, params }) => {
    const { t } = await i18nHelper(request);
    const form = await request.formData();
    const action = form.get("action");
    let page: PageWithDetails | null = null;
    if (params.id) {
      page = await getPage(params.id);
    }

    switch (action) {
      case "reset":
        return handleReset(page);
      case "update":
        return handleUpdate(page, form);
      default:
        return handleError(t);
    }
  };
}
