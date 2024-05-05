import { useLocation, useMatches } from "@remix-run/react";
import { ReactNode } from "react";
import { useRootData } from "~/utils/data/useRootData";
import { addEvent } from "~/utils/services/analyticsService";
import LinkOrAhref from "./LinkOrAhref";

interface Props {
  to: string | undefined;
  children: ReactNode;
  className?: string;
  target?: undefined | "_blank";
  role?: string;
  rel?: string;
  event: {
    action: string;
    category: string;
    label: string;
    value: string;
  };
  onClick?: () => void;
}
export default function ButtonEvent({ to, target, children, className, role, rel, event, onClick }: Props) {
  let location = useLocation();
  const rootData = useRootData();
  const matches = useMatches();

  async function onClicked() {
    if (onClick) {
      onClick();
    }
    if (!event) {
      return;
    }
    const routeMatch = matches.find((m) => m.pathname == location.pathname);
    await addEvent({
      url: location.pathname,
      route: routeMatch?.id,
      rootData,
      action: event.action,
      category: event.category,
      label: event.label,
      value: event.value,
    });
  }
  return (
    <LinkOrAhref to={to} target={target} className={className} role={role} rel={rel} onClick={onClicked}>
      {children}
    </LinkOrAhref>
  );
}
