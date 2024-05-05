import { OnboardingFilter } from "@prisma/client";
import { TFunction } from "react-i18next";
import supportedLocales from "~/locale/supportedLocales";
import { OnboardingFilterDto } from "../dtos/OnboardingFilterDto";
import { OnboardingFilterMetadataDto } from "../dtos/OnboardingFilterMetadataDto";
import { OnboardingMatchingFilterDto } from "../dtos/OnboardingMatchingFilterDto";

function getStepMatches({ t, matches, metadata }: { t: TFunction; matches: OnboardingMatchingFilterDto[]; metadata: OnboardingFilterMetadataDto }) {
  return matches.map((m) => {
    const filter = m.onboardingFilter;
    const value = parseValue({ t, filter, metadata });
    return {
      filter: filter.type,
      value,
    };
  });
}

function parseValue({ t, filter, metadata }: { t: TFunction; filter: OnboardingFilterDto | OnboardingFilter; metadata: OnboardingFilterMetadataDto }) {
  if (filter.type.startsWith("user.is")) {
    const user = metadata.users.find((u) => u.id === filter.value);
    return user?.email;
  } else if (filter.type.startsWith("tenant.is")) {
    const tenant = metadata.tenants.find((t) => t.id === filter.value);
    return tenant?.name;
  } else if (filter.type.startsWith("tenant.subscription.products")) {
    const subscriptionProduct = metadata.subscriptionProducts.find((s) => s.id === filter.value);
    return t(subscriptionProduct?.title ?? "");
  } else if (filter.type.startsWith("user.roles")) {
    const role = metadata.roles.find((r) => r.name === filter.value);
    return role?.name;
  } else if (filter.type.startsWith("tenant.user.entity")) {
    const entity = metadata.entities.find((t) => t.id === filter.value);
    return entity?.name;
  } else if (filter.type.startsWith("user.language")) {
    const language = supportedLocales.find((l) => l.lang === filter.value);
    return language?.lang;
  }
}

export default {
  getStepMatches,
  parseValue,
};
