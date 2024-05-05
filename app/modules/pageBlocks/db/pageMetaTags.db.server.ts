import { db } from "~/utils/db.server";

export async function getMetaTags(pageId: string | null) {
  return await db.pageMetaTag
    .findMany({
      where: { pageId },
      orderBy: { order: "asc" },
    })
    .catch(() => {
      return [];
    });
}

export async function createMetaTags(data: { pageId: string | null; name: string; value: string; order: number }[]) {
  return await db.pageMetaTag.createMany({ data });
}

export async function createMetaTag(data: { pageId: string | null; name: string; value: string; order: number }) {
  return await db.pageMetaTag.create({
    data,
  });
}

export async function updateMetaTag(id: string, data: { value: string; order: number }) {
  return await db.pageMetaTag.update({
    where: { id },
    data,
  });
}

export async function deleteMetaTags(pageId: string | null) {
  return await db.pageMetaTag.deleteMany({ where: { pageId } });
}
