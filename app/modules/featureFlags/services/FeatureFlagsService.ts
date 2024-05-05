import { AppConfiguration } from "~/utils/db/appConfiguration.db.server";
import { FeatureFlagWithDetails, getFeatureFlag, getFeatureFlags } from "../db/featureFlags.db.server";
import FeatureFlagsFiltersService from "./FeatureFlagsFiltersService";
import { Params } from "@remix-run/react";
import { FeatureFlagsFilterType } from "../dtos/FeatureFlagsFilterTypes";

async function getCurrentFeatureFlags({ request, params, userAnalyticsId }: { request: Request; params: Params; userAnalyticsId?: string }): Promise<string[]> {
  let forcedFlags: string[] = [];
  // To force a flag to be enabled
  if (process.env.NODE_ENV === "development") {
    const searchParams = new URL(request.url).searchParams;
    forcedFlags = searchParams.getAll("debugFlag");
  }

  const allFlags = await getFeatureFlags({ enabled: true, forcedFlags });

  const matchedFlagsPromises = allFlags.map(async (flag) => {
    if (await didAllFiltersMatched({ flag, request, params, userAnalyticsId })) {
      return flag;
    }
  });

  const matchedFlags = (await Promise.all(matchedFlagsPromises)).filter(Boolean);

  return matchedFlags.filter((f) => f !== null).map((flag) => flag!.name ?? "");
}

async function hasFeatureFlag({
  request,
  params,
  flagName,
}: {
  request: Request;
  params: Params;
  appConfiguration: AppConfiguration;
  flagName: FeatureFlagsFilterType;
}): Promise<boolean> {
  const flag = await getFeatureFlag({ name: flagName, enabled: true });
  if (!flag) {
    return false;
  }

  return await didAllFiltersMatched({ flag, request, params });
}

async function didAllFiltersMatched({
  flag,
  request,
  params,
  userAnalyticsId,
}: {
  flag: FeatureFlagWithDetails;
  request: Request;
  params: Params;
  userAnalyticsId?: string;
}) {
  // To force a flag to be enabled
  if (process.env.NODE_ENV === "development") {
    const searchParams = new URL(request.url).searchParams;
    const debugFlags = searchParams.getAll("debugFlag");
    if (debugFlags.includes(flag.name)) {
      return true;
    }
  }

  const matchedFiltersPromises = flag.filters.map(async (filter) => {
    const filterMatches = await FeatureFlagsFiltersService.matches({ request, params, userAnalyticsId, filter });
    // eslint-disable-next-line no-console
    console.log("[FilterFlagsService] Filter matches", { filter: filter.type, value: filter.value, matches: filterMatches });
    return filterMatches;
  });

  const matchedFiltersResults = await Promise.all(matchedFiltersPromises);
  return matchedFiltersResults.every((result) => result);
}

export default {
  getCurrentFeatureFlags,
  hasFeatureFlag,
};
