import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { XMLParser } from "fast-xml-parser";

const tokenScope = "https://www.googleapis.com/auth/webmasters";
const tokenAudience = "https://oauth2.googleapis.com/token";
const apiBase = "https://www.googleapis.com/webmasters/v3";

export type GscSitemapStatus = {
  path?: string;
  lastSubmitted?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  type?: string;
  lastDownloaded?: string;
  warnings?: string | number;
  errors?: string | number;
  contents?: Array<{
    type?: string;
    submitted?: string | number;
    indexed?: string | number;
  }>;
};

export type GscSubmissionResult = {
  siteType: "nextjs";
  siteUrl: string;
  propertyUrl: string;
  sitemapUrl: string;
  preflight: {
    sitemapOk: boolean;
    robotsOk: boolean;
    sitemapStatus: number;
    robotsStatus: number;
    urlCount: number;
    sitemapReferencedInRobots: boolean;
  };
  submitted: boolean;
  status?: GscSitemapStatus;
};

type EnvSource = Partial<Record<string, string | undefined>>;

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type OAuthToken = {
  token?: string;
  access_token?: string;
  refresh_token?: string;
  token_uri?: string;
  client_id?: string;
  client_secret?: string;
  expiry?: string;
};

type GscAuthConfig =
  | {
      type: "oauth";
      token: OAuthToken;
    }
  | {
      type: "service-account";
      serviceAccount: ServiceAccount;
    };

type SiteEntry = {
  siteUrl: string;
  permissionLevel?: string;
};

type GscRuntimeConfig = {
  siteUrl: string;
  sitemapUrl: string;
  auth: GscAuthConfig;
  preferredPropertyUrl?: string;
};

export async function submitAndVerifySitemap(
  source: EnvSource = process.env,
): Promise<GscSubmissionResult> {
  const config = await readGscRuntimeConfig(source);
  const preflight = await runSitemapPreflight(config.siteUrl, config.sitemapUrl);
  const accessToken = await createGscAccessToken(config.auth);
  const propertyUrl = await resolvePropertyUrl(
    accessToken,
    config.siteUrl,
    config.preferredPropertyUrl,
  );

  await submitSitemap(accessToken, propertyUrl, config.sitemapUrl);
  const status = await getSitemapStatus(
    accessToken,
    propertyUrl,
    config.sitemapUrl,
  );

  return {
    siteType: "nextjs",
    siteUrl: config.siteUrl,
    propertyUrl,
    sitemapUrl: config.sitemapUrl,
    preflight,
    submitted: true,
    status,
  };
}

export async function getSubmittedSitemapStatus(
  source: EnvSource = process.env,
): Promise<GscSubmissionResult> {
  const config = await readGscRuntimeConfig(source);
  const preflight = await runSitemapPreflight(config.siteUrl, config.sitemapUrl);
  const accessToken = await createGscAccessToken(config.auth);
  const propertyUrl = await resolvePropertyUrl(
    accessToken,
    config.siteUrl,
    config.preferredPropertyUrl,
  );
  const status = await getSitemapStatus(
    accessToken,
    propertyUrl,
    config.sitemapUrl,
  );

  return {
    siteType: "nextjs",
    siteUrl: config.siteUrl,
    propertyUrl,
    sitemapUrl: config.sitemapUrl,
    preflight,
    submitted: false,
    status,
  };
}

async function readGscRuntimeConfig(
  source: EnvSource,
): Promise<GscRuntimeConfig> {
  const siteUrl = normalizeSiteUrl(
    source.GSC_SITE_URL ?? source.SITE_URL,
    "GSC_SITE_URL or SITE_URL",
  );
  const sitemapUrl = source.GSC_SITEMAP_URL ?? `${siteUrl}sitemap.xml`;
  const auth = await readGscAuthConfig(source);

  return {
    siteUrl,
    sitemapUrl,
    auth,
    preferredPropertyUrl: source.GSC_PROPERTY_URL,
  };
}

async function readGscAuthConfig(source: EnvSource): Promise<GscAuthConfig> {
  const oauthToken = await readOAuthToken(source);

  if (oauthToken) {
    return {
      type: "oauth",
      token: oauthToken,
    };
  }

  return {
    type: "service-account",
    serviceAccount: await readServiceAccount(source),
  };
}

async function readOAuthToken(source: EnvSource): Promise<OAuthToken | null> {
  const rawJson = source.GSC_OAUTH_TOKEN_JSON;
  const filePath = source.GSC_OAUTH_TOKEN_FILE ?? "D:\\env\\gsc_token.json";

  if (rawJson) {
    return JSON.parse(rawJson) as OAuthToken;
  }

  try {
    return JSON.parse(await readFile(filePath, "utf8")) as OAuthToken;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function readServiceAccount(source: EnvSource): Promise<ServiceAccount> {
  const rawJson = source.GSC_SERVICE_ACCOUNT_JSON;
  const filePath =
    source.GSC_SERVICE_ACCOUNT_FILE ??
    source.GOOGLE_APPLICATION_CREDENTIALS ??
    "D:\\env\\gsc_credentials.json";

  const raw = rawJson ?? (await readFile(filePath, "utf8"));
  const parsed = JSON.parse(raw) as Partial<ServiceAccount>;

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      "GSC service account must include client_email and private_key.",
    );
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
    token_uri: parsed.token_uri,
  };
}

async function runSitemapPreflight(siteUrl: string, sitemapUrl: string) {
  if (siteUrl.includes("localhost")) {
    throw new Error("SITE_URL must be a public production URL for GSC.");
  }

  const [sitemapResponse, robotsResponse] = await Promise.all([
    fetch(sitemapUrl),
    fetch(`${siteUrl}robots.txt`),
  ]);
  const [sitemapText, robotsText] = await Promise.all([
    sitemapResponse.text(),
    robotsResponse.text(),
  ]);
  const urlCount = countSitemapUrls(sitemapText);
  const sitemapReferencedInRobots = robotsText
    .toLowerCase()
    .includes(sitemapUrl.toLowerCase());
  const robotsOk =
    robotsResponse.ok &&
    !hasGlobalRobotsBlock(robotsText) &&
    sitemapReferencedInRobots;

  if (!sitemapResponse.ok) {
    throw new Error(`sitemap.xml returned HTTP ${sitemapResponse.status}.`);
  }

  if (urlCount < 1) {
    throw new Error("sitemap.xml is empty or does not contain any <loc> URLs.");
  }

  if (!robotsOk) {
    throw new Error(
      "robots.txt must be crawlable, not globally disallow /, and reference sitemap.xml.",
    );
  }

  return {
    sitemapOk: sitemapResponse.ok,
    robotsOk,
    sitemapStatus: sitemapResponse.status,
    robotsStatus: robotsResponse.status,
    urlCount,
    sitemapReferencedInRobots,
  };
}

export function countSitemapUrls(xml: string) {
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml) as unknown;
  return countLocNodes(parsed);
}

function countLocNodes(value: unknown): number {
  if (!value || typeof value !== "object") {
    return 0;
  }

  if (Array.isArray(value)) {
    return value.reduce((count, item) => count + countLocNodes(item), 0);
  }

  return Object.entries(value as Record<string, unknown>).reduce(
    (count, [key, entry]) => {
      if (key === "loc" && typeof entry === "string" && entry.length > 0) {
        return count + 1;
      }

      return count + countLocNodes(entry);
    },
    0,
  );
}

export function hasGlobalRobotsBlock(robotsText: string) {
  const lines = robotsText
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, "").trim().toLowerCase())
    .filter(Boolean);

  let appliesToAll = false;

  for (const line of lines) {
    if (line.startsWith("user-agent:")) {
      appliesToAll = line.slice("user-agent:".length).trim() === "*";
      continue;
    }

    if (appliesToAll && line.startsWith("disallow:")) {
      return line.slice("disallow:".length).trim() === "/";
    }
  }

  return false;
}

async function createServiceAccountAccessToken(account: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const jwt = signJwt(
    {
      alg: "RS256",
      typ: "JWT",
    },
    {
      iss: account.client_email,
      scope: tokenScope,
      aud: account.token_uri ?? tokenAudience,
      exp: now + 3600,
      iat: now,
    },
    account.private_key,
  );
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });
  const response = await fetch(account.token_uri ?? tokenAudience, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await response.json()) as { access_token?: string; error?: string };

  if (!response.ok || !json.access_token) {
    throw new Error(
      `GSC token request failed: ${json.error ?? response.statusText}`,
    );
  }

  return json.access_token;
}

async function createGscAccessToken(auth: GscAuthConfig) {
  if (auth.type === "service-account") {
    return createServiceAccountAccessToken(auth.serviceAccount);
  }

  return createOAuthAccessToken(auth.token);
}

async function createOAuthAccessToken(token: OAuthToken) {
  const existingToken = token.token ?? token.access_token;
  const expiry = token.expiry ? Date.parse(token.expiry) : 0;

  if (existingToken && expiry > Date.now() + 60_000) {
    return existingToken;
  }

  if (!token.refresh_token || !token.client_id || !token.client_secret) {
    if (existingToken) {
      return existingToken;
    }

    throw new Error(
      "GSC OAuth token must include access token or refresh_token/client credentials.",
    );
  }

  const body = new URLSearchParams({
    client_id: token.client_id,
    client_secret: token.client_secret,
    refresh_token: token.refresh_token,
    grant_type: "refresh_token",
  });
  const response = await fetch(token.token_uri ?? tokenAudience, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await response.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!response.ok || !json.access_token) {
    throw new Error(
      `GSC OAuth token refresh failed: ${json.error ?? response.statusText}`,
    );
  }

  return json.access_token;
}

function signJwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  privateKey: string,
) {
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(privateKey);

  return `${unsigned}.${base64Url(signature)}`;
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function resolvePropertyUrl(
  accessToken: string,
  siteUrl: string,
  preferredPropertyUrl?: string,
) {
  const sites = await listSites(accessToken);
  const exactPreferred = preferredPropertyUrl
    ? sites.find((site) => site.siteUrl === preferredPropertyUrl)
    : undefined;

  if (exactPreferred) {
    return exactPreferred.siteUrl;
  }

  const exactSite = sites.find((site) => site.siteUrl === siteUrl);

  if (exactSite) {
    return exactSite.siteUrl;
  }

  const hostname = new URL(siteUrl).hostname.replace(/^www\./, "");
  const domainProperty = sites.find(
    (site) => site.siteUrl === `sc-domain:${hostname}`,
  );

  if (domainProperty) {
    return domainProperty.siteUrl;
  }

  throw new Error(
    `No accessible GSC property found for ${siteUrl}. Set GSC_PROPERTY_URL if needed.`,
  );
}

async function listSites(accessToken: string) {
  const response = await gscFetch(accessToken, `${apiBase}/sites`);
  const json = (await response.json()) as { siteEntry?: SiteEntry[] };
  return json.siteEntry ?? [];
}

async function submitSitemap(
  accessToken: string,
  propertyUrl: string,
  sitemapUrl: string,
) {
  const response = await gscFetch(
    accessToken,
    `${apiBase}/sites/${encodeURIComponent(propertyUrl)}/sitemaps/${encodeURIComponent(
      sitemapUrl,
    )}`,
    { method: "PUT" },
  );

  if (!response.ok) {
    throw new Error(`GSC sitemap submit failed with HTTP ${response.status}.`);
  }
}

async function getSitemapStatus(
  accessToken: string,
  propertyUrl: string,
  sitemapUrl: string,
) {
  const response = await gscFetch(
    accessToken,
    `${apiBase}/sites/${encodeURIComponent(propertyUrl)}/sitemaps/${encodeURIComponent(
      sitemapUrl,
    )}`,
  );

  if (!response.ok) {
    throw new Error(`GSC sitemap status failed with HTTP ${response.status}.`);
  }

  return (await response.json()) as GscSitemapStatus;
}

async function gscFetch(
  accessToken: string,
  url: string,
  init: RequestInit = {},
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error(`GSC API authorization failed with HTTP ${response.status}.`);
  }

  return response;
}

function normalizeSiteUrl(value: string | undefined, label: string) {
  if (!value) {
    throw new Error(`${label} is required.`);
  }

  const url = new URL(value);
  url.pathname = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  url.search = "";
  url.hash = "";
  return url.toString();
}
