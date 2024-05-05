import { Tenant, Event, EventWebhookAttempt } from "@prisma/client";
import { FiltersDto } from "~/application/dtos/data/FiltersDto";
import { PaginationResultDto } from "~/application/dtos/data/PaginationResultDto";
import { db } from "~/utils/db.server";
import RowFiltersHelper from "~/utils/helpers/RowFiltersHelper";

export type EventWithAttempts = Event & {
  tenant: Tenant | null;
  attempts: {
    id: string;
    startedAt: Date | null;
    finishedAt: Date | null;
    endpoint: string;
    success: boolean | null;
    status: number | null;
    message: string | null;
  }[];
};

export type EventWithDetails = Event & {
  tenant: Tenant | null;
  attempts: EventWebhookAttempt[];
};

export async function getEvents(
  pagination: { current: { page: number; pageSize: number }; filters: FiltersDto },
  tenantId?: string | null
): Promise<{
  items: EventWithAttempts[];
  pagination: PaginationResultDto;
}> {
  const whereFilters = RowFiltersHelper.getFiltersCondition(pagination.filters);
  const items = await db.event.findMany({
    take: pagination.current.pageSize,
    skip: pagination.current.pageSize * (pagination.current.page - 1),
    where: {
      AND: [whereFilters, { tenantId }],
    },
    include: {
      tenant: true,
      attempts: {
        select: {
          id: true,
          startedAt: true,
          finishedAt: true,
          endpoint: true,
          success: true,
          status: true,
          message: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const totalItems = await db.event.count({
    where: {
      tenantId,
      ...whereFilters,
    },
  });
  const totalPages = Math.ceil(totalItems / pagination.current.pageSize);

  return {
    items,
    pagination: {
      totalItems,
      totalPages,
      page: pagination.current.page,
      pageSize: pagination.current.pageSize,
      sortedBy: undefined,
      query: undefined,
    },
  };
}

export async function getEvent(id: string): Promise<EventWithDetails | null> {
  return await db.event.findUnique({
    where: {
      id,
    },
    include: {
      tenant: true,
      attempts: true,
    },
  });
}

export async function createEvent(data: { tenantId: string | null; name: string; data: string }) {
  return await db.event.create({
    data,
  });
}
