import { Page, PageBlock, PageMetaTag } from "@prisma/client";
import { db } from "~/utils/db.server";

export type PageWithDetails = Page & {
  metaTags: PageMetaTag[];
  blocks: PageBlock[];
};

export async function getPages(): Promise<PageWithDetails[]> {
  return await db.page.findMany({
    include: {
      metaTags: true,
      blocks: {
        orderBy: [{ order: "asc" }],
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });
}

export async function getPage(id: string): Promise<PageWithDetails | null> {
  return await db.page.findUnique({
    where: {
      id,
    },
    include: {
      metaTags: true,
      blocks: {
        orderBy: [{ order: "asc" }],
      },
    },
  });
}

export async function getPageBySlug(slug: string, tenantId: string | null): Promise<PageWithDetails | null> {
  return await db.page
    .findFirstOrThrow({
      where: {
        slug,
      },
      include: {
        metaTags: true,
        blocks: {
          orderBy: [{ order: "asc" }],
        },
      },
    })
    .catch(() => {
      return null;
    });
}

export async function createPage(data: { slug: string; isPublished?: boolean; isPublic?: boolean }) {
  return await db.page.create({
    data,
  });
}

export async function updatePage(id: string, data: { slug?: string; isPublished?: boolean; isPublic?: boolean }) {
  return await db.page.update({
    where: {
      id,
    },
    data,
  });
}

export async function deletePage(id: string) {
  return await db.page.delete({
    where: {
      id,
    },
  });
}

// export async function groupPagesByType() {
//   return await db.page.groupBy({
//     by: ["type"],
//     _count: {
//       _all: true,
//     },
//   });
// }
