import { LoaderFunction, V2_MetaFunction } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { OnboardingSummaryApi } from "~/modules/onboarding/routes/api/OnboardingSummaryApi.server";
import OnboardingOverviewRoute from "~/modules/onboarding/routes/components/OnboardingSummaryRoute";

export const meta: V2_MetaFunction = ({ data }) => data?.meta;
export let loader: LoaderFunction = (args) => OnboardingSummaryApi.loader(args);

export default () => <OnboardingOverviewRoute />;

export function ErrorBoundary() {
  return <ServerError />;
}
