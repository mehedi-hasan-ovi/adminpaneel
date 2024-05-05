import platform from "platform";
import { AnalyticsInfoDto } from "~/application/dtos/marketing/AnalyticsInfoDto";
import { getClientIPAddress } from "../server/IpUtils";

function getUserAgentDetails(userAgent?: string) {
  const deviceType = () => {
    if (!userAgent) {
      return undefined;
    }
    const ua = userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "tablet";
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return "mobile";
    }
    return "desktop";
  };
  return {
    type: deviceType(),
    os: {
      family: platform.os?.family,
      version: platform.os?.version,
    },
    browser: {
      name: platform.name,
      version: platform.version,
    },
  };
}

async function getFromRequest(request: Request, userId: string | null) {
  const searchParams = new URL(request.url).searchParams;

  // console.log({ headers: request.headers });
  const ip = process.env.NODE_ENV === "development" ? "development" : getClientIPAddress(request.headers)?.toString();
  const userAgent = request.headers.get("user-agent") ?? navigator.userAgent;
  const httpReferrer = request.headers.get("referer")?.toString();
  const ref = searchParams.get("ref")?.toString();
  const via = searchParams.get("via")?.toString();
  const source = searchParams.get("source")?.toString();
  const utm_source = searchParams.get("utm_source")?.toString();
  const utm_medium = searchParams.get("utm_medium")?.toString();
  const utm_campaign = searchParams.get("utm_campaign")?.toString();
  const utm_content = searchParams.get("utm_content")?.toString();
  const utm_term = searchParams.get("utm_term")?.toString();
  let mergedSource = "";
  if (ref && ref?.length > 0) {
    mergedSource = ref;
  } else if (source && source?.length > 0) {
    mergedSource = source;
  } else if (utm_source && utm_source?.length > 0) {
    mergedSource = utm_source;
  }
  const analytics: AnalyticsInfoDto = {
    ip,
    userAgent: getUserAgentDetails(userAgent),
    referrer: {
      http: httpReferrer,
      via,
      source: mergedSource,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
    },
    userId: userId && userId.length > 0 ? userId : null,
    // TODO
    // region: {
    //   country: "Use an API with IP",
    //   city: "Use an API with IP",
    // },
  };
  return analytics;
}

// export async function createUniqueVisitorHash(domain: string, ipAddress: string, userAgent: string) {
//   const hash = sha256(domain + ipAddress + userAgent);
//   console.log({ hash });
//   return hash;
// }

export default {
  getUserAgentDetails,
  getFromRequest,
};
