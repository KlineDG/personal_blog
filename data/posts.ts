export type Post = {
  title: string;
  date: string;
  isoDate: string;
  excerpt: string;
  readingTime?: string;
  category?: string;
  tags?: string[];
};

export const featuredPost: Post = {
  title: "Building a mindful writing practice",
  date: "June 2, 2024",
  isoDate: "2024-06-02",
  excerpt:
    "How small, consistent rituals can turn writing from a task into a grounding daily habit.",
  tags: ["Mindful", "Systems"],
};

export const posts: Post[] = [
  {
    title: "Designing a personal knowledge garden",
    date: "May 28, 2024",
    isoDate: "2024-05-28",
    excerpt:
      "Notes on the tools and structures I'm using to grow a digital space that actually helps ideas mature.",
    readingTime: "6 min read",
    category: "Design",
  },
  {
    title: "Setting up frictionless blogging with Next.js",
    date: "May 15, 2024",
    isoDate: "2024-05-15",
    excerpt:
      "From content modelling to deployment pipelines, here are the tweaks that made publishing fast again.",
    readingTime: "8 min read",
    category: "Engineering",
  },
  {
    title: "What I'm learning from a month of analog sketching",
    date: "May 2, 2024",
    isoDate: "2024-05-02",
    excerpt:
      "Mixing ink, paper, and digital post-processing taught me more about observation than any plugin ever has.",
    readingTime: "5 min read",
    category: "Practice",
  },
];
