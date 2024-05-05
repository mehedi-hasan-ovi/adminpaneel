import { Link } from "@remix-run/react";
import { Fragment } from "react";
import { TFunction } from "react-i18next";
import { RowDto } from "~/modules/rows/repositories/RowDto";
import { EntitiesApi } from "~/utils/api/EntitiesApi";
import { EntityWithDetails } from "~/utils/db/entities/entities.db.server";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import EntityHelper from "~/utils/helpers/EntityHelper";
import RowHelper from "~/utils/helpers/RowHelper";

export default function RowRelationshipRow({
  entity,
  item,
  onRelatedRowClick,
  routes,
  t,
}: {
  entity: EntityWithDetails;
  item: RowDto;
  onRelatedRowClick?: () => void;
  routes?: EntitiesApi.Routes;
  t: TFunction;
}) {
  return (
    <Fragment>
      {onRelatedRowClick !== undefined ? (
        <button type="button" onClick={onRelatedRowClick} className="hover text-left text-sm hover:underline">
          {RowHelper.getTextDescription({ entity: entity, item, t })}
        </button>
      ) : !routes || !EntityHelper.getRoutes({ routes, entity: entity, item })?.overview ? (
        <div className="hover text-left text-sm hover:underline">{RowHelper.getTextDescription({ entity: entity, item, t })}</div>
      ) : (
        <Link
          onClick={(e) => e.stopPropagation()}
          to={EntityHelper.getRoutes({ routes, entity: entity, item })?.overview ?? ""}
          className="hover text-left text-sm hover:underline"
        >
          {RowHelper.getTextDescription({ entity: entity, item, t })}
        </Link>
      )}
    </Fragment>
  );
}
