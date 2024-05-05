import { vi, Mock } from "vitest";

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { AnalyticsOverviewDto } from "~/utils/services/analyticsService";
import { Colors } from "~/application/enums/shared/Colors";
import { useRootData } from "~/utils/data/useRootData";
import AnalyticsOverview from "./AnalyticsOverview";
import { BrowserRouter as Router } from "react-router-dom";
import { useTranslation } from "react-i18next";

vi.mock("~/utils/data/useRootData");
vi.mock("react-i18next");

describe("AnalyticsOverview", () => {
  const overview: AnalyticsOverviewDto = {
    uniqueVisitors: 1000,
    pageViews: 5000,
    events: 100,
    liveVisitors: 10,
    top: {
      sources: [
        { name: "Google", count: 500 },
        { name: "Direct", count: 300 },
        { name: "Unknown", count: 200 },
      ],
      httpReferrers: [
        { name: "https://www.google.com", count: 400 },
        { name: "https://www.facebook.com", count: 100 },
        { name: "Unknown", count: 100 },
      ],
      urls: [
        { name: "/home", count: 2000 },
        { name: "/about", count: 1000 },
        { name: "Unknown", count: 2000 },
      ],
      routes: [
        { name: "/home", count: 2000 },
        { name: "/about", count: 1000 },
        { name: "Unknown", count: 2000 },
      ],
      os: [
        { name: "Windows", count: 4000 },
        { name: "MacOS", count: 1000 },
        { name: "Unknown", count: 1000 },
      ],
      devices: [
        { name: "Desktop", count: 4000 },
        { name: "Mobile", count: 1000 },
        { name: "Unknown", count: 1000 },
      ],
      countries: [
        { name: "United States", count: 2000 },
        { name: "Canada", count: 1000 },
        { name: "Unknown", count: 2000 },
      ],
      via: [
        { name: "Organic", count: 3000 },
        { name: "Paid", count: 1000 },
        { name: "Unknown", count: 1000 },
      ],
      campaign: [
        { name: "Campaign 1", count: 3000 },
        { name: "Campaign 2", count: 1000 },
      ],
      medium: [
        { name: "Medium 1", count: 3000 },
        { name: "Medium 2", count: 1000 },
      ],
      user: [
        {
          name: "john.doe@company.com",
          count: 10,
        },
      ],
    },
  };

  beforeEach(() => {
    (useTranslation as Mock).mockReturnValue({
      t: (v: any) => v,
    });
  });

  it("renders correctly for unauthenticated user", () => {
    (useRootData as any).mockReturnValue({
      authenticated: false,
    });

    render(
      <Router>
        <AnalyticsOverview overview={overview} withUsers={false} />
      </Router>
    );
    const uniqueVisitors = screen.getByText("analytics.uniqueVisitors");
    const pageViews = screen.getByText("analytics.pageViews");
    const events = screen.getByText("analytics.events");
    const liveVisitors = screen.getByText("analytics.liveVisitors");

    expect(uniqueVisitors).toBeInTheDocument();
    expect(pageViews).toBeInTheDocument();
    expect(events).toBeInTheDocument();
    expect(liveVisitors).toBeInTheDocument();
    expect(liveVisitors.parentElement).toHaveStyle(`color: ${Colors.GRAY}`);
  });

  it("renders correctly for authenticated user", () => {
    (useRootData as any).mockReturnValue({
      authenticated: true,
    });

    render(
      <Router>
        <AnalyticsOverview overview={overview} withUsers={false} />
      </Router>
    );
    const uniqueVisitors = screen.getByText("analytics.uniqueVisitors");
    const pageViews = screen.getByText("analytics.pageViews");
    const events = screen.getByText("analytics.events");
    const liveVisitors = screen.getByText("analytics.liveVisitors");

    expect(uniqueVisitors).toBeInTheDocument();
    expect(uniqueVisitors!.parentElement!.parentElement).toHaveAttribute("href");
    expect(pageViews).toBeInTheDocument();
    expect(pageViews!.parentElement!.parentElement).toHaveAttribute("href");
    expect(events).toBeInTheDocument();
    expect(events!.parentElement!.parentElement).toHaveAttribute("href");
    expect(liveVisitors).toBeInTheDocument();
    expect(liveVisitors.parentElement).toHaveStyle(`color: ${Colors.GRAY}`);
  });
});
