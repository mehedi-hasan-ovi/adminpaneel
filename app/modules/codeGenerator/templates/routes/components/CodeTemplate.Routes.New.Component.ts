import CodeGeneratorHelper from "~/modules/codeGenerator/utils/CodeGeneratorHelper";
import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";

function generate({ entity, moduleLocation }: { entity: EntityWithDetails; moduleLocation: string }): string {
  const { capitalized } = CodeGeneratorHelper.getNames(entity);
  return `import { V2_MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { ${capitalized}RoutesNewApi } from "~/${moduleLocation}/routes/api/${capitalized}Routes.New.Api";
import ${capitalized}RoutesNewView from "~/${moduleLocation}/routes/views/${capitalized}Routes.New.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => ${capitalized}RoutesNewApi.loader(args);
export const action: ActionFunction = (args) => ${capitalized}RoutesNewApi.action(args);

export default () => <${capitalized}RoutesNewView />;

export function ErrorBoundary() {
  return <ServerError />;
}
`;
}

export default {
  generate,
};
