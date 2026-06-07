import {
  editorialPosts,
  getPublishedEditorialPosts,
} from "@/lib/content/editorial-posts";

const now = new Date();
const publishedCount = getPublishedEditorialPosts(now).length;
const reviewWindow = editorialPosts.slice(0, Math.min(publishedCount + 10, editorialPosts.length));
const blockedFragments = [
  "가격를",
  "비용를",
  "보관를",
  "선택와",
  "제품와",
  "시간가",
  "이동를",
  "손실와",
  "활용를",
  "포장를",
  "undefined",
  "null",
];

const violations: string[] = [];

for (const post of reviewWindow) {
  const text = [
    post.title,
    post.subtitle,
    post.excerpt,
    post.quickAnswer,
    ...post.body,
    ...post.deepDives.flatMap((section) => [section.heading, section.body]),
    ...post.checklist,
    ...post.faq.flatMap((item) => [item.question, item.answer]),
    post.cta,
  ].join(" ");

  for (const fragment of blockedFragments) {
    if (text.includes(fragment)) {
      violations.push(`${post.slug}: blocked fragment "${fragment}"`);
    }
  }

  if (post.qualityScore < 90) {
    violations.push(`${post.slug}: quality score below 90`);
  }

  if (post.body.length < 6) {
    violations.push(`${post.slug}: body has fewer than 6 paragraphs`);
  }

  if (post.deepDives.length < 3) {
    violations.push(`${post.slug}: missing deep dive sections`);
  }

  if (post.internalLinks.length < 2) {
    violations.push(`${post.slug}: fewer than 2 internal links`);
  }

  if (!post.externalSource.href.startsWith("https://")) {
    violations.push(`${post.slug}: external source is not https`);
  }

  if (!post.title.includes(post.mainKeyword)) {
    violations.push(`${post.slug}: title missing main keyword`);
  }

  if (!post.subtitle.includes(post.mainKeyword)) {
    violations.push(`${post.slug}: subtitle missing main keyword`);
  }
}

const report = {
  checkedAt: now.toISOString(),
  totalPosts: editorialPosts.length,
  publishedCount,
  checkedCount: reviewWindow.length,
  nextScheduled: editorialPosts[publishedCount]?.publishAt ?? null,
  violations,
};

console.log(JSON.stringify(report, null, 2));

if (violations.length > 0) {
  process.exitCode = 1;
}
