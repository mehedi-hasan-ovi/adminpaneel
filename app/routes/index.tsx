import { ActionFunction, json, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import PageBlocks from "~/modules/pageBlocks/components/blocks/PageBlocks";
import { useSearchParams } from "@remix-run/react";
import { getCurrentPage } from "~/modules/pageBlocks/services/pagesService";
import { PageLoaderData } from "~/modules/pageBlocks/dtos/PageBlockData";
import { PageBlockService } from "~/modules/pageBlocks/services/blocksService";
import ErrorBanner from "~/components/ui/banners/ErrorBanner";
import { useTranslation } from "react-i18next";
import { useTypedLoaderData } from "remix-typedjson";
import { createMetrics } from "~/modules/metrics/utils/MetricTracker";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
export { serverTimingHeaders as headers };

export const meta: V2_MetaFunction = ({ data }) => data?.metaTags;

export let loader: LoaderFunction = async ({ request, params }) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "index");
  const page = await time(getCurrentPage({ request, params, slug: "/" }), "getCurrentPage.index");
  return json(page, { headers: getServerTimingHeader() });
};

export const action: ActionFunction = async ({ request, params }) => PageBlockService.action({ request, params });

export default function () {
  const { t } = useTranslation();
  const data = useTypedLoaderData<PageLoaderData>();
  const [searchParams] = useSearchParams();
  const [blocks, setBlocks] = useState(data.blocks);

  useEffect(() => {
    try {
      // @ts-ignore
      $crisp.push(["do", "chat:show"]);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div>
      {data.error ? (
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
          <ErrorBanner title={t("shared.error")} text={data.error} />
        </div>
      ) : (
        <div>
          <PageBlocks
            items={blocks}
            onChange={setBlocks}
            editor={searchParams.get("editMode") === "true" ? { add: true, edit: true, remove: true, move: true, download: true, ai: true } : undefined}
          />
        </div>
      )}
    </div>
  );
}
