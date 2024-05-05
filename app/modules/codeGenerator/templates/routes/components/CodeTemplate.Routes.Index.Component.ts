import CodeGeneratorHelper from "~/modules/codeGenerator/utils/CodeGeneratorHelper";
import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";

function generate({ entity, moduleLocation }: { entity: EntityWithDetails; moduleLocation: string }): string {
  const { capitalized } = CodeGeneratorHelper.getNames(entity);
  return `import { V2_MetaFunction, LoaderFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { ${capitalized}RoutesIndexApi } from "~/${moduleLocation}/routes/api/${capitalized}Routes.Index.Api";
import ${capitalized}RoutesIndexView from "~/${moduleLocation}/routes/views/${capitalized}Routes.Index.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => ${capitalized}RoutesIndexApi.loader(args);

export default () => <${capitalized}RoutesIndexView />;

export function ErrorBoundary() {
  return <ServerError />;
}
`;
}

export default {
  generate,
};
