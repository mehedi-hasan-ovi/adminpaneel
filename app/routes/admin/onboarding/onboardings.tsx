import { ActionFunction, LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { OnboardingIndexApi } from "~/modules/onboarding/routes/api/onboardings/OnboardingsIndexApi.server";
import OnboardingIndexRoute from "~/modules/onboarding/routes/components/onboardings/OnboardingsIndexRoute";

export const meta: V2_MetaFunction = ({ data }) => data?.meta;
export let loader: LoaderFunction = (args) => OnboardingIndexApi.loader(args);
export const action: ActionFunction = (args) => OnboardingIndexApi.action(args);

export default () => <OnboardingIndexRoute />;

export function ErrorBoundary() {
  return <ServerError />;
}
