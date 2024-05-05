import { useTypedLoaderData } from "remix-typedjson";
import { KbRoutesIndexApi } from "../api/KbRoutes.Index.Api";
import KbHeader from "../../components/KbHeader";
import KbFeaturedArticles from "../../components/KbFeaturedArticles";
import KbCategories from "../../components/categories/KbCategories";

export default function KbRoutesIndex() {
  const data = useTypedLoaderData<KbRoutesIndexApi.LoaderData>();

  return (
    <div className="min-h-screen">
      <KbHeader kb={data.kb} withTitleAndDescription={true} />
      <div className="mx-auto max-w-5xl px-8 py-6">
        <div className="space-y-8">
          {data.featured.length > 0 && <KbFeaturedArticles kb={data.kb} items={data.featured} />}
          <KbCategories kb={data.kb} items={data.categories} />
        </div>
      </div>
    </div>
  );
}
