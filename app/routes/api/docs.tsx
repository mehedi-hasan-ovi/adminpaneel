import { V2_MetaFunction, json } from "@remix-run/node";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";

type LoaderData = {
  metatags: MetaTagsDto;
};
export let loader = async () => {
  const data: LoaderData = {
    metatags: [
      { title: `API Documentation | ${process.env.APP_NAME}` },
      // { name: "keywords", content: category.keywords },
      { name: "og:title", content: `API Documentation | ${process.env.APP_NAME}` },
      {
        tagName: "link",
        rel: "canonical",
        href: `${process.env.SERVER_URL}/api/docs`,
      },
    ],
  };
  return json(data);
};

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;

export default function Docs() {
  return <iframe src="/swagger.html" title="API Documentation" style={{ width: "100%", height: "100vh", border: "none" }} />;
}
