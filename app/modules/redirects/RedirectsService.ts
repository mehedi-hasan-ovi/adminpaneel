import { redirect } from "@remix-run/node";
import RedirectsUtils from "./RedirectsUtils";

async function findAndRedirect({ request }: { request: Request }) {
  const redirects: { [key: string]: string } = RedirectsUtils.redirects;
  const pathname = new URL(request.url).pathname;
  const searchParams = new URL(request.url).searchParams;
  const redirectPath = Object.keys(redirects).find((path) => {
    const regex = new RegExp(`^${path.replace(/\*/g, ".*")}$`);
    return regex.test(pathname);
  });

  console.log("redirects", {
    pathname,
    redirectPath,
  });
  if (redirectPath) {
    const searchString = searchParams.toString();
    throw redirect(redirects[redirectPath] + (searchString ? `?${searchString}` : ""), { status: 301 });
  }
}

export default {
  findAndRedirect,
};
