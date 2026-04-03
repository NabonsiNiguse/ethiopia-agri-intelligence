import { Router, type IRouter } from "express";
import { db, forumPostsTable, forumRepliesTable } from "@workspace/db";
import { eq, desc, sql, like, or, and } from "drizzle-orm";

const router: IRouter = Router();

// ─── Seed data shown when DB is empty ────────────────────────────────────────
const SEED_POSTS = [
  { id: -1, authorId: 1, authorName: "Abebe Girma", authorRegion: "Oromia", category: "disease", title: "Coffee Berry Disease spreading in Jimma — what to spray?", content: "I noticed dark spots on my coffee berries last week. The spots are sunken and the berries are falling early. My neighbor lost 30% of his crop last year from the same thing. What fungicide should I use and when is the best time to spray?", language: "en", tags: ["coffee", "CBD", "fungicide", "Jimma"], likes: 24, replyCount: 8, expertVerified: true, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: -2, authorId: 2, authorName: "Tigist Bekele", authorRegion: "Amhara", category: "market", title: "Teff prices in Bahir Dar dropped 15% — should I wait to sell?", content: "White teff was 48 ETB/kg last month, now it is 41 ETB/kg at Bahir Dar market. I have 3 quintals stored. The harvest season is ending and I am not sure if prices will recover. Has anyone seen this pattern before?", language: "en", tags: ["teff", "market", "Bahir Dar", "price"], likes: 31, replyCount: 12, expertVerified: false, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: -3, authorId: 3, authorName: "Chaltu Daba", authorRegion: "SNNPR", category: "crop_advisory", title: "Best intercropping for coffee in Sidama — enset or banana?", content: "I have 2 hectares of coffee in Sidama. My father always used enset as shade but my extension officer suggested banana. Which gives better shade, protects from CBD, and also gives income? Any farmers with experience please share.", language: "en", tags: ["coffee", "intercropping", "Sidama", "shade"], likes: 18, replyCount: 6, expertVerified: true, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: -4, authorId: 4, authorName: "Dawit Haile", authorRegion: "Tigray", category: "weather", title: "Drought advisory for Tigray — when to plant sorghum?", content: "We received only 40% of normal rainfall this Kiremt season. My sorghum seedlings are stressed. Should I replant now or wait for the short rains? The soil moisture is very low in my area near Axum.", language: "en", tags: ["sorghum", "drought", "Tigray", "planting"], likes: 15, replyCount: 4, expertVerified: false, createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: -5, authorId: 5, authorName: "Mulu Tesfaye", authorRegion: "SNNPR", category: "success_story", title: "How I increased my sesame yield by 40% using row planting", content: "Three years ago I was broadcasting sesame seed and getting 4 quintals per hectare. My extension officer taught me row planting at 45cm spacing with proper weeding in the first 4 weeks. Last season I got 5.6 quintals per hectare. The key is early weeding — sesame cannot compete with weeds.", language: "en", tags: ["sesame", "yield", "row planting", "success"], likes: 47, replyCount: 15, expertVerified: true, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: -6, authorId: 6, authorName: "Kebede Tadesse", authorRegion: "Amhara", category: "disease", title: "የስንዴ ዝገት በሰሜን ጎንደር — ምን ማድረግ አለብኝ?", content: "በእርሻዬ ላይ የስንዴ ቅጠሎች ላይ ቢጫ ዱቄት አይቻለሁ። ይህ ዝገት ነው ብዬ አስባለሁ። ምን ፈንጊሳይድ ልጠቀም? ጎረቤቶቼም ተጎድተዋል።", language: "am", tags: ["wheat", "rust", "Gondar", "Amharic"], likes: 22, replyCount: 9, expertVerified: true, createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: -7, authorId: 7, authorName: "Fatuma Hassen", authorRegion: "Oromia", category: "market", title: "Dhaabbilee gabaa bunaa Jimmaa — gatiin akkam?", content: "Bunaan koo qulqullina gaarii qaba. Jimmaa ECX irratti gurguruu barbaada. Gatiin ammaa meeqa? Gurgurtaa dura maal qopheessuu qaba?", language: "om", tags: ["coffee", "ECX", "Jimma", "Oromo"], likes: 19, replyCount: 7, expertVerified: false, createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
];

const SEED_REPLIES: Record<number, Array<{ id: number; authorName: string; authorId: number; content: string; language: string; isExpertReply: boolean; likes: number; createdAt: string }>> = {
  [-1]: [
    { id: -101, authorId: 99, authorName: "Dr. Yonas Alemu (Extension Officer)", content: "This is Coffee Berry Disease (CBD) caused by Colletotrichum kahawae. Apply Kocide 2000 (copper fungicide) at 2-3 kg/ha immediately. Spray in the early morning. Remove and destroy all infected berries — do not compost them. Follow up with a second spray 2 weeks later.", language: "en", isExpertReply: true, likes: 18, createdAt: new Date(Date.now() - 1.5 * 86400000).toISOString() },
    { id: -102, authorId: 8, authorName: "Gemechu Wakjira", content: "I had the same problem in Jimma last year. Copper fungicide worked well. Also prune the lower branches to improve air circulation — CBD spreads faster in humid, dense canopy.", language: "en", isExpertReply: false, likes: 7, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  ],
  [-2]: [
    { id: -201, authorId: 99, authorName: "Ato Bekele Mamo (Market Analyst)", content: "Post-harvest price drops are normal for teff in October-November as supply peaks. Historical data shows prices typically recover 8-12% by January when supply tightens. If you have dry storage, holding until January is usually profitable. But if storage quality is a concern, sell now.", language: "en", isExpertReply: true, likes: 24, createdAt: new Date(Date.now() - 0.5 * 86400000).toISOString() },
  ],
  [-5]: [
    { id: -501, authorId: 10, authorName: "Alemu Bekele", content: "Thank you for sharing! I tried this last season and got similar results. The 45cm row spacing also makes weeding much easier with a hand hoe.", language: "en", isExpertReply: false, likes: 12, createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: -502, authorId: 99, authorName: "W/ro Hiwot Tesfaye (Agronomist)", content: "Excellent practice. Row planting also improves air circulation which reduces Phytophthora blight risk. For best results, plant after the first heavy rain when soil temperature is above 20°C.", language: "en", isExpertReply: true, likes: 21, createdAt: new Date(Date.now() - 3.5 * 86400000).toISOString() },
  ],
};

// ─── GET /forum/posts — list with search, filter, pagination ─────────────────
router.get("/forum/posts", async (req, res): Promise<void> => {
  const { category, language, search, crop, region, page = "1" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limit = 15;
  const offset = (pageNum - 1) * limit;

  const posts = await db.select().from(forumPostsTable).orderBy(desc(forumPostsTable.createdAt)).limit(500);

  let filtered = posts
    .filter((p) => !category || category === "all" || p.category === category)
    .filter((p) => !language || p.language === language)
    .filter((p) => !region || p.authorRegion.toLowerCase().includes(region.toLowerCase()))
    .filter((p) => !crop || p.tags.some((t) => t.toLowerCase().includes(crop.toLowerCase())))
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q));
    });

  // If DB empty, use seed data
  if (posts.length === 0) {
    let seedFiltered = SEED_POSTS
      .filter((p) => !category || category === "all" || p.category === category)
      .filter((p) => !language || p.language === language)
      .filter((p) => !region || p.authorRegion.toLowerCase().includes(region.toLowerCase()))
      .filter((p) => !crop || p.tags.some((t) => t.toLowerCase().includes(crop.toLowerCase())))
      .filter((p) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q));
      });

    const total = seedFiltered.length;
    const paginated = seedFiltered.slice(offset, offset + limit);
    res.json({ posts: paginated, total, page: pageNum, pages: Math.ceil(total / limit), synthetic: true });
    return;
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit).map((p) => ({
    ...p,
    tags: p.tags ?? [],
    createdAt: p.createdAt.toISOString(),
  }));

  res.json({ posts: paginated, total, page: pageNum, pages: Math.ceil(total / limit) });
});

// ─── POST /forum/posts — create post ─────────────────────────────────────────
router.post("/forum/posts", async (req, res): Promise<void> => {
  const { authorId, authorName, authorRegion, category, title, content, language, tags } = req.body;
  if (!authorId || !category || !title || !content) {
    res.status(400).json({ error: "authorId, category, title, content required" });
    return;
  }

  const [post] = await db.insert(forumPostsTable).values({
    authorId,
    authorName: authorName ?? "Farmer",
    authorRegion: authorRegion ?? "Oromia",
    category,
    title,
    content,
    language: language ?? "en",
    tags: tags ?? [],
    likes: 0,
    replyCount: 0,
    expertVerified: false,
  }).returning();

  res.status(201).json({ ...post, tags: post.tags ?? [], createdAt: post.createdAt.toISOString() });
});

// ─── GET /forum/posts/:id — single post ──────────────────────────────────────
router.get("/forum/posts/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  // Serve seed post if negative id
  if (id < 0) {
    const seed = SEED_POSTS.find((p) => p.id === id);
    if (!seed) { res.status(404).json({ error: "Post not found" }); return; }
    res.json(seed);
    return;
  }

  const [post] = await db.select().from(forumPostsTable).where(eq(forumPostsTable.id, id));
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  res.json({ ...post, tags: post.tags ?? [], createdAt: post.createdAt.toISOString() });
});

// ─── GET /forum/posts/:id/replies ────────────────────────────────────────────
router.get("/forum/posts/:id/replies", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  // Serve seed replies for seed posts
  if (id < 0) {
    const seedReplies = SEED_REPLIES[id] ?? [];
    res.json({ replies: seedReplies, total: seedReplies.length });
    return;
  }

  const replies = await db.select().from(forumRepliesTable)
    .where(eq(forumRepliesTable.postId, id))
    .orderBy(forumRepliesTable.createdAt);

  const mapped = replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  res.json({ replies: mapped, total: mapped.length });
});

// ─── POST /forum/posts/:id/replies ───────────────────────────────────────────
router.post("/forum/posts/:id/replies", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { authorId, authorName, content, language, isExpertReply } = req.body;
  if (!authorId || !content) { res.status(400).json({ error: "authorId and content required" }); return; }

  // For seed posts, just return a mock reply (no DB write needed)
  if (id < 0) {
    res.status(201).json({
      id: Math.floor(Math.random() * -9000) - 1000,
      postId: id, authorId, authorName: authorName ?? "Farmer",
      content, language: language ?? "en",
      isExpertReply: isExpertReply ?? false, likes: 0,
      createdAt: new Date().toISOString(),
    });
    return;
  }

  const [reply] = await db.insert(forumRepliesTable).values({
    postId: id, authorId,
    authorName: authorName ?? "Farmer",
    content, language: language ?? "en",
    isExpertReply: isExpertReply ?? false,
    likes: 0,
  }).returning();

  await db.update(forumPostsTable)
    .set({ replyCount: sql`${forumPostsTable.replyCount} + 1` })
    .where(eq(forumPostsTable.id, id));

  res.status(201).json({ ...reply, createdAt: reply.createdAt.toISOString() });
});

// ─── POST /forum/posts/:id/like ───────────────────────────────────────────────
router.post("/forum/posts/:id/like", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  if (id < 0) {
    const seed = SEED_POSTS.find((p) => p.id === id);
    res.json({ likes: (seed?.likes ?? 0) + 1 });
    return;
  }

  await db.update(forumPostsTable)
    .set({ likes: sql`${forumPostsTable.likes} + 1` })
    .where(eq(forumPostsTable.id, id));

  const [updated] = await db.select({ likes: forumPostsTable.likes }).from(forumPostsTable).where(eq(forumPostsTable.id, id));
  res.json({ likes: updated?.likes ?? 0 });
});

// ─── GET /forum/analytics — admin insights ───────────────────────────────────
router.get("/forum/analytics", async (_req, res): Promise<void> => {
  const posts = await db.select().from(forumPostsTable).limit(500);
  const replies = await db.select().from(forumRepliesTable).limit(1000);

  const allPosts = posts.length > 0 ? posts : SEED_POSTS as any[];

  // Category breakdown
  const categoryCount: Record<string, number> = {};
  for (const p of allPosts) {
    categoryCount[p.category] = (categoryCount[p.category] ?? 0) + 1;
  }

  // Top tags
  const tagCount: Record<string, number> = {};
  for (const p of allPosts) {
    for (const tag of (p.tags ?? [])) {
      tagCount[tag] = (tagCount[tag] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Region activity
  const regionCount: Record<string, number> = {};
  for (const p of allPosts) {
    regionCount[p.authorRegion] = (regionCount[p.authorRegion] ?? 0) + 1;
  }
  const topRegions = Object.entries(regionCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([region, count]) => ({ region, count }));

  // Most active posts
  const topPosts = [...allPosts]
    .sort((a, b) => (b.likes + b.replyCount * 2) - (a.likes + a.replyCount * 2))
    .slice(0, 5)
    .map((p) => ({ id: p.id, title: p.title, likes: p.likes, replyCount: p.replyCount, category: p.category }));

  // Language distribution
  const langCount: Record<string, number> = {};
  for (const p of allPosts) {
    langCount[p.language] = (langCount[p.language] ?? 0) + 1;
  }

  res.json({
    totalPosts: allPosts.length,
    totalReplies: replies.length + Object.values(SEED_REPLIES).flat().length,
    expertVerifiedPosts: allPosts.filter((p: any) => p.expertVerified).length,
    categoryBreakdown: categoryCount,
    topTags,
    topRegions,
    topPosts,
    languageDistribution: langCount,
    synthetic: posts.length === 0,
  });
});

export default router;
