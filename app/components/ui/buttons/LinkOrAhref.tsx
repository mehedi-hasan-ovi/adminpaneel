import { Link } from "@remix-run/react";
import { Fragment, ReactNode } from "react";

interface Props {
  to: string | undefined;
  children: ReactNode;
  className?: string;
  target?: undefined | "_blank" | string;
  role?: string;
  rel?: string;
  onClick?: () => void;
  reloadDocument?: boolean;
  autoFocus?: boolean;
}
export default function LinkOrAhref({ to, target, children, className, role, rel, onClick, reloadDocument, autoFocus }: Props) {
  return (
    <Fragment>
      {to == undefined ? (
        <button type="button" onClick={onClick} className={className} role={role} autoFocus={autoFocus}>
          {children}
        </button>
      ) : to.startsWith("http") ? (
        <a onClick={onClick} href={to} target={target} className={className} role={role} rel={rel} autoFocus={autoFocus}>
          {children}
        </a>
      ) : (
        <Link reloadDocument={reloadDocument} onClick={onClick} to={to} target={target} className={className} role={role} autoFocus={autoFocus}>
          {children}
        </Link>
      )}
    </Fragment>
  );
}
