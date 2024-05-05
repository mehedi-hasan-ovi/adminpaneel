import DateUtils from "../shared/DateUtils";

export const PeriodFilters = [
  { value: "last-year", name: "app.shared.periods.LAST_YEAR" },
  { value: "last-3-months", name: "app.shared.periods.LAST_3_MONTHS" },
  { value: "last-30-days", name: "app.shared.periods.LAST_30_DAYS" },
  { value: "last-7-days", name: "app.shared.periods.LAST_7_DAYS" },
  { value: "last-24-hours", name: "app.shared.periods.LAST_24_HOURS" },
] as const;
export type PeriodFilter = (typeof PeriodFilters)[number]["value"];
export const defaultPeriodFilter = "last-30-days";

function getGreaterThanOrEqualsFromRequest({ request }: { request: Request }) {
  const searchParams = new URL(request.url).searchParams;
  const countFilter = searchParams.get("period") ?? defaultPeriodFilter;
  if (countFilter === "last-year") {
    return DateUtils.daysFromDate(new Date(), 365 * -1);
  } else if (countFilter === "last-3-months") {
    return DateUtils.daysFromDate(new Date(), 90 * -1);
  } else if (countFilter === "last-30-days") {
    return DateUtils.daysFromDate(new Date(), 30 * -1);
  } else if (countFilter === "last-7-days") {
    return DateUtils.daysFromDate(new Date(), 7 * -1);
  } else if (countFilter === "last-24-hours") {
    return DateUtils.daysFromDate(new Date(), 1 * -1);
  }
  return undefined;
}

export default {
  getGreaterThanOrEqualsFromRequest,
};
