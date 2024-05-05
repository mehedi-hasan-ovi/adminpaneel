import { createInstance } from "i18next";
import { renderToString } from "react-dom/server";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { routes as otherRoutes } from "./other-routes.server";

export default async function handleRequest(request: Request, responseStatusCode: number, responseHeaders: Headers, remixContext: EntryContext) {
  // Here you also need to initialize i18next using initReactI18next, you should
  // use the same configuration as in your client side.
  // create an instance so every request will have a copy and don't re-use the
  // i18n object
  for (const handler of otherRoutes) {
    // eslint-disable-next-line no-await-in-loop
    const otherRouteResponse = await handler(request, remixContext);
    if (otherRouteResponse) return otherRouteResponse;
  }

  let i18n = createInstance();
  await i18n.use(initReactI18next).init({
    supportedLngs: ["es", "en"],
    defaultNS: "translations",
    react: { useSuspense: false },
  });

  // Then you can render your app wrapped in the RemixI18NextProvider as in the
  // entry.client file
  let markup = renderToString(
    <I18nextProvider i18n={i18n}>
      <RemixServer context={remixContext} url={request.url} />
    </I18nextProvider>
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
