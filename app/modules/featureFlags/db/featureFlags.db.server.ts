import { db } from "~/utils/db.server";
import { FeatureFlagsFilterType } from "../dtos/FeatureFlagsFilterTypes";
import { AnalyticsEvent, FeatureFlag, FeatureFlagFilter, Prisma } from "@prisma/client";

export type FeatureFlagWithDetails = FeatureFlag & {
  filters: FeatureFlagFilter[];
};

export type FeatureFlagWithEvents = FeatureFlagWithDetails & {
  events: AnalyticsEvent[];
};

export async function getFeatureFlag(where: { name?: string; id?: string; description?: string; enabled?: boolean | undefined }) {
  return db.featureFlag.findFirst({
    where,
    include: {
      filters: true,
    },
  });
}

export async function getFeatureFlags(where: { enabled: boolean | undefined; forcedFlags?: string[] }): Promise<FeatureFlagWithDetails[]> {
  return db.featureFlag.findMany({
    where: {
      OR: [{ enabled: where.enabled }, { name: { in: where.forcedFlags ?? [] } }],
    },
    include: {
      filters: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getFeatureFlagsWithEvents(where: { enabled: boolean | undefined }): Promise<FeatureFlagWithEvents[]> {
  return db.featureFlag.findMany({
    where: {
      enabled: where.enabled,
    },
    include: {
      filters: true,
      events: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createFeatureFlag(data: {
  name: string;
  description: string;
  enabled: boolean;
  filters: { type: FeatureFlagsFilterType; value: string | null }[];
}) {
  return await db.featureFlag.create({
    data: {
      name: data.name,
      description: data.description,
      enabled: data.enabled,
      filters: { create: data.filters },
    },
  });
}

export async function updateFeatureFlag(
  id: string,
  {
    name,
    description,
    enabled,
    filters,
  }: {
    name?: string;
    description?: string;
    enabled?: boolean;
    filters?: { type: FeatureFlagsFilterType; value: string | null }[];
  }
) {
  const update: Prisma.FeatureFlagUpdateInput = {
    name,
    description,
    enabled,
  };
  if (filters) {
    update.filters = {
      deleteMany: {},
      create: filters,
    };
  }
  return await db.featureFlag.update({
    where: { id },
    data: update,
  });
}

export async function deleteFeatureFlag(id: string) {
  return await db.featureFlag.delete({
    where: { id },
  });
}
