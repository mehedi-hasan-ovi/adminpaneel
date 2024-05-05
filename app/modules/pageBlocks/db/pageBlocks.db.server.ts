import { db } from "~/utils/db.server";

export async function getPageBlocks(slug: string) {
  return await db.pageBlock.findMany({
    where: {
      page: {
        slug,
      },
    },
    orderBy: [{ order: "asc" }],
  });
}

export async function getPageBlock(id: string) {
  return await db.pageBlock.findUnique({
    where: {
      id,
    },
  });
}

export async function createPageBlock(data: { pageId: string; order: number; type: string; value: string }) {
  return await db.pageBlock.create({
    data,
  });
}

export async function updatePageBlock(id: string, data: { order: number; type: string; value: string }) {
  return await db.pageBlock.update({
    where: {
      id,
    },
    data,
  });
}

export async function deletePageBlock(id: string) {
  return await db.pageBlock.delete({
    where: {
      id,
    },
  });
}

export async function deletePageBlocks(id: string) {
  return await db.pageBlock.deleteMany({
    where: {
      page: {
        id,
      },
    },
  });
}
