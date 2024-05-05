import { HeaderBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/header/HeaderBlockUtils";

export const defaultHeader: HeaderBlockDto = {
  style: "simple",
  withLogo: true,
  withSignInAndSignUp: true,
  withThemeSwitcher: true,
  withLanguageSwitcher: true,
  links: [
    { path: "/", title: "front.navbar.product" },
    { path: "/pricing", title: "front.navbar.pricing" },
    { path: "/docs", title: "Docs", className: "" },
    {
      title: "front.navbar.about",
      items: [
        { path: "/blog", title: "front.navbar.blog" },
        { path: "/contact", title: "front.navbar.contact" },
        { path: "/newsletter", title: "Newsletter" },
        { path: "/changelog", title: "Changelog" },
      ],
    },
  ],
};
