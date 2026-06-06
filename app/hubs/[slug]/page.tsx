import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Disclosure } from "@/components/disclosure";
import { readEnv } from "@/lib/config/env";
import {
  getOptionalDatabase,
  loadPublicPagesSafe,
} from "@/lib/content/db-pages";
import { getHub, getHubPages, hubs } from "@/lib/content/site-pages";
import { createDatabase } from "@/lib/db/client";
import {
  canExposePublicContentForDb,
  canUseFixturePublicFallback,
} from "@/lib/gates/public-launch";

type PageProps = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const db = getOptionalDatabase(createDatabase);

  if (!(await canExposePublicContentForDb(db))) {
    return [];
  }

  return hubs.map((hub) => ({ slug: hub.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const hub = getHub(params.slug);

  if (!hub) {
    return {};
  }

  return {
    title: hub.title,
    description: hub.description,
    alternates: {
      canonical: `${readEnv().SITE_URL}/hubs/${hub.slug}`,
    },
  };
}

export default async function HubPage({ params }: PageProps) {
  const db = getOptionalDatabase(createDatabase);

  if (!(await canExposePublicContentForDb(db))) {
    notFound();
  }

  const hub = getHub(params.slug);

  if (!hub) {
    notFound();
  }

  const publicPages = await loadPublicPagesSafe(db);
  const dbPages = publicPages.filter((page) => page.category === hub.category);
  const pages =
    dbPages.length > 0 || !canUseFixturePublicFallback()
      ? dbPages
      : getHubPages(params.slug);

  return (
    <main>
      <p className="eyebrow">{hub.category}</p>
      <h1>{hub.title}</h1>
      <p>{hub.description}</p>
      <section className="card-grid">
        {pages.map((page) => (
          <a className="card" href={`/items/${page.slug}`} key={page.slug}>
            <span>{page.itemCode}</span>
            <h3>{page.title}</h3>
            <p>{page.summary}</p>
          </a>
        ))}
      </section>
      <Disclosure />
    </main>
  );
}
