import { Colors } from "~/application/enums/shared/Colors";
import { getBlogCategoryById, getAllBlogCategories, createBlogCategory } from "~/modules/blog/db/blogCategories.db.server";

export namespace BlogApi {
  export async function getCategory({ tenantId, idOrName }: { tenantId: string | null; idOrName: { id: string } | { name: string } }) {
    if ("id" in idOrName) {
      return await getBlogCategoryById(idOrName.id);
    } else {
      const categories = await getAllBlogCategories(tenantId);
      const found = categories.find((category) => category.name.toLowerCase().trim() === idOrName.name.toLowerCase().trim());
      return found ?? null;
    }
  }
  export async function createCategory(data: { tenantId: string | null; name: string; color?: number }) {
    return await createBlogCategory({
      tenantId: data.tenantId,
      name: data.name,
      color: data.color ?? Colors.UNDEFINED,
    });
  }
}

function getAuthorNames(name: string) {
  const names = name.split(" ");
  const firstName = names[0];
  if (names.length > 1) {
    // fusion of all other names
    const lastName = names.slice(1).join(" ");
    return { firstName, lastName };
  }
  return { firstName, lastName: "" };
}
