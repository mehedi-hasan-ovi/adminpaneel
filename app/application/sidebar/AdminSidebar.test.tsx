import {describe, it, expect} from 'vitest'
import { AdminSidebar } from "./AdminSidebar";
import { TFunction } from "react-i18next";

describe("AdminSidebar", () => {
  const t: TFunction = (key: string) => key;

  it("returns an array of sidebar items", () => {
    const sidebar = AdminSidebar(t);

    expect(Array.isArray(sidebar)).toBe(true);

    sidebar.forEach((item) => {
      expect(typeof item.title).toBe("string");
      expect(typeof item.path).toBe("string");

      if (item.items) {
        expect(Array.isArray(item.items)).toBe(true);

        item.items.forEach((subItem) => {
          expect(typeof subItem.title).toBe("string");
          expect(typeof subItem.path).toBe("string");
        });
      }
    });
  });
});
