const featuredPost = {
  title: "Building a mindful writing practice",
  date: "June 2, 2024",
  excerpt:
    "How small, consistent rituals can turn writing from a task into a grounding daily habit.",
  tags: ["Mindset", "Process"],
};

const posts = [
  {
    title: "Designing a personal knowledge garden",
    date: "May 28, 2024",
    excerpt:
      "Notes on the tools and structures I'm using to grow a digital space that actually helps ideas mature.",
    readingTime: "6 min read",
  },
  {
    title: "Setting up frictionless blogging with Next.js",
    date: "May 15, 2024",
    excerpt:
      "From content modelling to deployment pipelines, here are the tweaks that made publishing fast again.",
    readingTime: "8 min read",
  },
  {
    title: "What I'm learning from a month of analog sketching",
    date: "May 2, 2024",
    excerpt:
      "Mixing ink, paper, and digital post-processing taught me more about observation than any plugin ever has.",
    readingTime: "5 min read",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0b0f] text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-24 px-6 pb-24 pt-16 sm:px-8 sm:pt-24">
        <header className="space-y-6">
          <div className="space-y-3">
            <span className="text-sm uppercase tracking-[0.45em] text-amber-300">Journal</span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Writing about craft, curiosity, and the slow web.
            </h1>
          </div>
          <p className="max-w-2xl text-lg text-zinc-300">
            I'm documenting the experiments that make my creative work feel more intentional—design systems that
            breathe, the stacks that keep me curious, and the habits that tether ideas to everyday life.
          </p>
        </header>

        <section className="grid gap-10 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-amber-500/5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-amber-300/80">Featured</p>
              <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{featuredPost.title}</h2>
            </div>
            <time className="text-sm text-zinc-400" dateTime="2024-06-02">
              {featuredPost.date}
            </time>
          </div>
          <p className="text-base text-zinc-200 sm:text-lg">{featuredPost.excerpt}</p>
          <div className="flex flex-wrap gap-3">
            {featuredPost.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.3em] text-amber-200"
              >
                {tag}
              </span>
            ))}
          </div>
          <button className="inline-flex w-max items-center gap-2 rounded-full border border-amber-400/60 bg-amber-300/20 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-300/30">
            Continue reading
            <span aria-hidden className="text-lg">→</span>
          </button>
        </section>

        <section className="space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.35em] text-amber-300">Recent posts</h2>
            <a className="text-sm font-medium text-amber-200 transition hover:text-amber-100" href="#archive">
              View archive →
            </a>
          </div>

          <div className="space-y-12">
            {posts.map((post) => (
              <article key={post.title} className="space-y-4 border-b border-white/10 pb-10 last:border-b-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-400">
                  <time dateTime={post.date}>{post.date}</time>
                  <span>{post.readingTime}</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-white transition hover:text-amber-200">
                    <a href="#">{post.title}</a>
                  </h3>
                  <p className="text-base text-zinc-300 sm:text-lg">{post.excerpt}</p>
                </div>
                <a className="inline-flex items-center gap-2 text-sm font-medium text-amber-200 transition hover:text-amber-100" href="#">
                  Read story <span aria-hidden className="text-lg">→</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <footer className="rounded-3xl border border-white/10 bg-white/5 px-8 py-10 text-sm text-zinc-400 backdrop-blur">
          <p>
            Want notes in your inbox? Join the monthly dispatch and get the behind-the-scenes experiments before they
            ship.
          </p>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              className="h-11 flex-1 rounded-full border border-white/15 bg-black/20 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-amber-300 focus:outline-none"
              type="email"
              name="email"
              placeholder="you@example.com"
              aria-label="Email address"
            />
            <button className="h-11 rounded-full bg-amber-300/90 px-6 text-sm font-semibold text-black transition hover:bg-amber-200" type="submit">
              Subscribe
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
