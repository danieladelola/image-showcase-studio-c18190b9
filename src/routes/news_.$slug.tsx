import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Link2 } from "lucide-react";
import { z } from "zod";

import { PageFrame } from "@/components/site-layout";
import { PostCard } from "@/components/site-pages";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/post-types";
import { newsPostQuery } from "@/lib/posts.queries";

export const Route = createFileRoute("/news_/$slug")({
  validateSearch: (search: Record<string, unknown>) => z.object({ preview: z.boolean().optional().catch(undefined) }).parse(search),
  loaderDeps: ({ search }) => ({ preview: search.preview === true }),
  loader: async ({ context, params, deps }) => {
    const data = await context.queryClient.ensureQueryData(newsPostQuery(params.slug, deps.preview));
    if (!data.post) throw notFound();
    const p = data.post;
    const image = p.coverImage ? (p.coverImage.url.startsWith("http") ? p.coverImage.url : `${data.origin}${p.coverImage.url}`) : null;
    return {
      title: p.seoTitle || p.title,
      description: p.seoDescription || p.excerpt,
      keywords: [p.focusKeyword, ...p.seoKeywords, ...p.tags].filter(Boolean).join(", "),
      image,
      url: `${data.origin}/news/${p.slug}`,
      noindex: data.preview,
      publishedAt: p.publishedAt,
      author: p.authorName,
      headline: p.title,
    };
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} | RUWATA` : "Article | RUWATA" },
      { name: "description", content: loaderData?.description || "A solar article from RUWATA." },
      ...(loaderData?.keywords ? [{ name: "keywords", content: loaderData.keywords }] : []),
      { property: "og:title", content: loaderData?.title ?? "RUWATA article" },
      { property: "og:description", content: loaderData?.description || "A solar article from RUWATA." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/news/${params.slug}` },
      { name: "twitter:card", content: "summary_large_image" },
      ...(loaderData?.image?.startsWith("https://") ? [{ property: "og:image", content: loaderData.image }, { name: "twitter:image", content: loaderData.image }] : []),
      ...(!loaderData || loaderData.noindex ? [{ name: "robots", content: "noindex" }] : []),
    ],
    links: [{ rel: "canonical", href: `/news/${params.slug}` }],
    scripts: loaderData
      ? [{
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: loaderData.headline,
            description: loaderData.description,
            datePublished: loaderData.publishedAt,
            author: loaderData.author ? { "@type": "Person", name: loaderData.author } : { "@type": "Organization", name: "RUWATA" },
            publisher: { "@type": "Organization", name: "RUWATA" },
            ...(loaderData.image ? { image: loaderData.image } : {}),
          }),
        }]
      : [],
  }),
  notFoundComponent: ArticleNotFound,
  errorComponent: () => <p className="p-10 text-center">This article couldn’t load. Please refresh the page.</p>,
  component: ArticlePage,
});

function ArticleNotFound() {
  return (
    <PageFrame>
      <section className="section-space">
        <div className="site-wrap grid justify-items-center gap-4 text-center">
          <h1 className="section-heading">Article not found</h1>
          <p className="text-muted-foreground">This article may have been moved or removed.</p>
          <Button asChild><Link to="/news">Back to News</Link></Button>
        </div>
      </section>
    </PageFrame>
  );
}

const longDate = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric" });

function ArticlePage() {
  const { slug } = Route.useParams();
  const { preview } = Route.useSearch();
  const { data } = useSuspenseQuery(newsPostQuery(slug, preview === true));
  const post = data.post!;
  const url = `${data.origin}/news/${post.slug}`;
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const shares = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${post.title} ${url}`)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(post.title)}&url=${enc(url)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  const Share = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Share</span>
      {shares.map((s) => (
        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="news-chip" aria-label={`Share on ${s.label}`}>{s.label}</a>
      ))}
      <button type="button" onClick={copy} className="news-chip gap-1.5">
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Link2 className="size-4" aria-hidden="true" />} {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );

  return (
    <PageFrame>
      {data.preview && (
        <div className="bg-warning-soft py-2 text-center text-sm font-bold text-warning">Preview — this post isn’t live on your site yet.</div>
      )}
      <article>
        <header className="section-space bg-card pb-10">
          <div className="site-wrap grid max-w-3xl gap-5">
            <Link to="/news" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-brand">
              <ArrowLeft className="size-4" aria-hidden="true" /> All news
            </Link>
            <Link to="/news" search={{ category: post.category }} className="eyebrow eyebrow-plain w-fit">{categoryLabel(post.category)}</Link>
            <h1 className="section-heading">{post.title}</h1>
            {post.excerpt && <p className="text-lead">{post.excerpt}</p>}
            <p className="text-sm font-semibold text-muted-foreground">
              {[post.authorName, post.publishedAt ? longDate.format(new Date(post.publishedAt)) : null, `${post.readingMinutes} min read`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </header>
        {post.coverImage && (
          <div className="site-wrap max-w-5xl">
            <img src={post.coverImage.url} alt={post.coverImage.alt} className="aspect-[16/9] w-full rounded-3xl object-cover" fetchPriority="high" />
          </div>
        )}
        <div className="site-wrap grid max-w-3xl gap-10 py-12">
          <div className="article-body" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
          {post.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Tags">
              {post.tags.map((t) => <li key={t} className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">#{t}</li>)}
            </ul>
          )}
          <div className="border-t border-border pt-6">{Share}</div>
        </div>
      </article>

      {data.related.length > 0 && (
        <section className="section-space bg-card">
          <div className="site-wrap grid gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="section-heading">Keep reading</h2>
              <Link to="/news" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand">All articles <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">{data.related.map((p) => <PostCard key={p.id} post={p} />)}</div>
          </div>
        </section>
      )}
    </PageFrame>
  );
}
