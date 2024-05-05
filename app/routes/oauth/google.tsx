import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import ServerError from "~/components/ui/errors/ServerError";
import { authenticator } from "~/utils/auth/auth.server";

export let loader: LoaderFunction = () => redirect("/login");

export let action: ActionFunction = ({ request }) => {
  return authenticator.authenticate("google", request);
};

export function ErrorBoundary() {
  return <ServerError />;
}
