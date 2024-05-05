import { useLoaderData, useSearchParams } from "@remix-run/react";
import clsx from "clsx";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Colors } from "~/application/enums/shared/Colors";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import CheckIcon from "~/components/ui/icons/CheckIcon";
import GitHubIcon from "~/components/ui/icons/GitHubIcon";
import XIcon from "~/components/ui/icons/XIcon";
import InputSearch from "~/components/ui/input/InputSearch";
import InputSelect from "~/components/ui/input/InputSelect";
import ShowHtmlModalButton from "~/components/ui/json/ShowHtmlModalButton";
import TableSimple from "~/components/ui/tables/TableSimple";
import Tabs from "~/components/ui/tabs/Tabs";
import { getGitHubIssues } from "~/utils/integrations/githubService";
import { getBadgeColor } from "~/utils/shared/ColorUtils";
import DateUtils from "~/utils/shared/DateUtils";

interface LoaderData {
  issues: Awaited<ReturnType<typeof getGitHubIssues>>;
}
export default function GitHubIssues() {
  const { t } = useTranslation();
  const { issues } = useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchInput, setSearchInput] = useState(searchParams.get("query") ?? "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") ?? "newest");

  function filteredItems(issues: Awaited<ReturnType<typeof getGitHubIssues>>) {
    return issues.filter(
      (f) =>
        f.title?.toString().toUpperCase().includes(searchInput.toUpperCase()) ||
        f.body_text?.toString().toUpperCase().includes(searchInput.toUpperCase()) ||
        f.user?.name?.toString().toUpperCase().includes(searchInput.toUpperCase()) ||
        f.user?.email?.toString().toUpperCase().includes(searchInput.toUpperCase()) ||
        f.user?.login?.toString().toUpperCase().includes(searchInput.toUpperCase()) ||
        f.body?.toString().toUpperCase().includes(searchInput.toUpperCase()) ||
        f.state?.toString().toUpperCase().includes(searchInput.toUpperCase()) ||
        f.labels?.find((f: any) => f.name.toUpperCase().includes(searchInput.toUpperCase())) ||
        (isEnterpriseOnly(f) && searchInput.toUpperCase().includes("ENTERPRISE"))
    );
  }
  function isEnterpriseOnly(issue: any) {
    return issue.labels.find((f: any) => f.name.includes("🚀"));
  }
  function getSelectetTabIssues() {
    if (selectedTab === 0) {
      return filteredItems(issues.filter((f) => f.state === "open"));
    } else if (selectedTab === 1) {
      return filteredItems(issues.filter((f) => f.state === "closed"));
    } else {
      return filteredItems(issues);
    }
  }
  return (
    <div className="not-prose space-y-2">
      <div className="flex justify-between space-x-2">
        <InputSearch className="flex-grow" value={searchInput} setValue={(e) => setSearchInput(e)} />
        <div className="flex items-center space-x-2">
          <InputSelect
            className="md:w-44"
            value={sortBy}
            setValue={(e) => setSortBy(e?.toString() ?? "")}
            options={[
              { name: "Sort: Newest", value: "newest" },
              { name: "Sort: Oldest", value: "oldest" },
              { name: "Sort: Top voted", value: "top-voted" },
              { name: "Sort: Most commented", value: "most-commented" },
              { name: "Sort: Recently updated", value: "most-recently-updated" },
              { name: "Sort: Close date", value: "close-date" },
            ]}
          />
          <ButtonPrimary to="https://github.com/AlexandroMtzG/saasrock/issues/new" target="_blank">
            {t("shared.new")}
          </ButtonPrimary>
        </div>
      </div>

      <div className="flex justify-between space-x-2">
        <Tabs
          className="flex-grow"
          asLinks={false}
          onSelected={(index) => {
            setSelectedTab(index);
            if (index === 0) {
              setSortBy("top-voted");
            } else if (index === 1) {
              setSortBy("close-date");
            } else {
              setSortBy("newest");
            }
          }}
          tabs={[
            { name: `Open ${issues.filter((f) => f.state === "open").length}` },
            { name: `Closed ${issues.filter((f) => f.state === "closed").length}` },
            { name: `All ${issues.length}` },
          ]}
        />
        <div></div>
      </div>

      <IssuesList issues={getSelectetTabIssues()} sortBy={sortBy} />
    </div>
  );
}

function IssuesList({ issues, sortBy }: { issues: Awaited<ReturnType<typeof getGitHubIssues>>; sortBy: string }) {
  function getLabels(issue: any) {
    return issue.labels.map((f: any) => f.name).join(", ");
  }
  function sortedItems() {
    if (sortBy === "newest") {
      return issues.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "oldest") {
      return issues.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === "close-date") {
      return issues.sort((x, y) => {
        if (x.closed_at && y.closed_at) {
          return x.closed_at < y.closed_at ? 1 : -1;
        } else if (x.created_at && y.created_at) {
          return x.created_at < y.created_at ? 1 : -1;
        }
        return 1;
      });
    } else if (sortBy === "most-recently-updated") {
      return issues.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else if (sortBy === "least-recently-updated") {
      return issues.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    } else if (sortBy === "top-voted") {
      return issues.sort((a, b) => (b.reactions?.["+1"] ?? 0) - (a.reactions?.["+1"] ?? 0));
    } else if (sortBy === "most-commented") {
      return issues.sort((a, b) => b.comments - a.comments);
    } else {
      return issues;
    }
  }
  return (
    <>
      <TableSimple
        padding="px-1 py-0.5"
        items={sortedItems()}
        headers={[
          {
            name: "#",
            title: "#",
            value: (_, idx) => <div className="text-xs italic text-gray-400">{idx + 1}</div>,
          },
          {
            name: "issue",
            title: "Issue",
            value: (i) => (
              <div className="flex items-center space-x-2">
                <ColorBadge color={i.state === "closed" ? Colors.VIOLET : i.state === "open" ? Colors.GREEN : Colors.GRAY} />
                <a href={i.html_url} target="_blank" rel="noreferrer" className="underline">
                  <div>#{i.number}</div>
                </a>
              </div>
            ),
          },
          {
            name: "title",
            title: "Title",
            value: (i) => (
              <div title={i.title} className="max-w-sm truncate">
                <ShowHtmlModalButton
                  title={i.title}
                  html={i.body}
                  link={{
                    href: i.html_url,
                    text: <GitHubIcon className="h-5 w-5 text-gray-800 group-hover:text-gray-900" />,
                    target: "_blank",
                  }}
                />
              </div>
            ),
            className: "w-full",
          },
          {
            name: "votes",
            title: "Votes",
            value: (i) => (
              <div className="flex justify-center text-sm text-gray-600">
                {i.reactions && <div>{i.reactions?.["+1"] > 0 ? <div>👍 {i.reactions?.["+1"]}</div> : <div className="text-gray-300">-</div>}</div>}
              </div>
            ),
          },
          {
            name: "comments",
            title: "Comments",
            value: (i) => (
              <div className="flex justify-center text-sm text-gray-600">
                <div>{i.comments > 0 ? <div>{i.comments}</div> : <div className="text-gray-300">-</div>}</div>
              </div>
            ),
          },
          {
            name: "core",
            title: "Core",
            value: (i) => (
              <div>{!getLabels(i).includes("🚀") ? <CheckIcon className="h-4 w-4 text-green-500" /> : <XIcon className="h-4 w-4 text-red-500" />}</div>
            ),
          },
          {
            name: "enterprise",
            title: "Enterprise",
            value: (i) => (
              <div>
                <CheckIcon className="h-4 w-4 text-green-500" />
              </div>
            ),
          },
          {
            name: "createdAt",
            title: "Created at",
            value: (item) => <div className="text-xs italic">{DateUtils.dateAgo(item.created_at)}</div>,
          },
          {
            name: "updatedAt",
            title: "Updated at",
            value: (item) => <div className="text-xs italic">{item.updated_at !== item.created_at && DateUtils.dateAgo(item.updated_at)}</div>,
          },
          {
            name: "createdBy",
            title: "Created by",
            value: (item) => <div className="text-xs italic">{item.user && <span>by {item.user.login}</span>}</div>,
          },
        ]}
      />
    </>
  );
}

function ColorBadge({ color }: { color: Colors }) {
  return (
    <span className={clsx(" inline-flex flex-shrink-0 items-center rounded-full p-0.5 text-xs font-medium", getBadgeColor(color))}>
      <svg className="h-1.5 w-1.5" fill="currentColor" viewBox="0 0 8 8">
        <circle cx={4} cy={4} r={3} />
      </svg>
    </span>
  );
}
