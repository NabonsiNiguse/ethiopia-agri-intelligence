import { Router, type IRouter } from "express";
import { db, forumPostsTable, forumRepliesTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/forum/posts", async (req, res): Promise<void> => {
  const { category, language, page = "1" } = req.query as Record<string, string>;
  const pageNum = parseInt(page, 10);
  const limit = 20;
  const offset = (pageNum - 1) * limit;

  const posts = await db.select().from(forumPostsTable).orderBy(desc(forumPostsTable.createdAt)).limit(200);

  const filtered = posts
    .filter((p) => !category || p.category === category)
    .filter((p) => !language || p.language === language);

  const paginated = filtered.slice(offset, offset + limit).map((p) => ({
    ...p,
    tags: p.tags ?? [],
    createdAt: p.createdAt.toISOString(),
  }));

  res.json({ posts: paginated, total: filtered.length, page: pageNum });
});

router.post("/forum/posts", async (req, res): Promise<void> => {
  const { authorId, category, title, content, language, tags } = req.body;
  if (!authorId || !category || !title || !content) {
    res.status(400).json({ error: "authorId, category, title, content required" });
    return;
  }

  const [post] = await db.insert(forumPostsTable).values({
    authorId, authorName: req.body.authorName ?? "Farmer",
    authorRegion: req.body.authorRegion ?? "Oromia",
    category, title, content,
    language: language ?? "en",
    tags: tags ?? [],
    likes: 0, replyCount: 0, expertVerified: false,
  }).returning();

  res.status(201).json({ ...post, tags: post.tags ?? [], createdAt: post.createdAt.toISOString() });
});

router.get("/forum/posts/:id/replies", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const replies = await db.select().from(forumRepliesTable)
    .where(eq(forumRepliesTable.postId, id))
    .orderBy(forumRepliesTable.createdAt);

  const mapped = replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  res.json({ replies: mapped, total: mapped.length });
});

router.post("/forum/posts/:id/replies", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { authorId, content, language } = req.body;
  if (!authorId || !content) { res.status(400).json({ error: "authorId and content required" }); return; }

  const [reply] = await db.insert(forumRepliesTable).values({
    postId: id, authorId,
    authorName: req.body.authorName ?? "Farmer",
    content, language: language ?? "en",
    isExpertReply: false, likes: 0,
  }).returning();

  await db.update(forumPostsTable)
    .set({ replyCount: sql`${forumPostsTable.replyCount} + 1` })
    .where(eq(forumPostsTable.id, id));

  res.status(201).json({ ...reply, createdAt: reply.createdAt.toISOString() });
});

export default router;
