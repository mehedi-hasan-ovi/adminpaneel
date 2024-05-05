import CodeGeneratorHelper from "~/modules/codeGenerator/utils/CodeGeneratorHelper";
import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";

function generate({ entity, moduleLocation }: { entity: EntityWithDetails; moduleLocation: string }): string {
  const { capitalized } = CodeGeneratorHelper.getNames(entity);
  return `import { V2_MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { ${capitalized}RoutesEditApi } from "~/${moduleLocation}/routes/api/${capitalized}Routes.Edit.Api";
import ${capitalized}RoutesEditView from "~/${moduleLocation}/routes/views/${capitalized}Routes.Edit.View";

export const meta: V2_MetaFunction = ({ data }) => data?.metadata;
export let loader: LoaderFunction = (args) => ${capitalized}RoutesEditApi.loader(args);
export const action: ActionFunction = (args) => ${capitalized}RoutesEditApi.action(args);

export default () => <${capitalized}RoutesEditView />;

export function ErrorBoundary() {
  return <ServerError />;
}
`;
}

export default {
  generate,
};
