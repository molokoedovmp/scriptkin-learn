import "server-only";

import { getAppPool } from "./db";

export interface SocialQuestProgress {
  questSlug: string;
  title: string;
  emoji: string;
  stepsCount: number;
  currentStep: number;
  completedAt: string | null;
  percent: number;
}

export interface SocialFriend {
  friendshipId: string;
  id: string;
  name: string;
  friendsSince: string;
  lastActiveAt: string | null;
  activityPoints: number;
  progress: SocialQuestProgress[];
}

export interface SocialFriendRequest {
  friendshipId: string;
  userId: string;
  name: string;
  direction: "incoming" | "outgoing";
  createdAt: string;
}

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  tags: string[];
  createdAt: string;
  isOwn: boolean;
}

export interface ActivityDay {
  date: string;
  count: number;
}

export interface SocialDashboardData {
  friends: SocialFriend[];
  requests: SocialFriendRequest[];
  posts: SocialPost[];
  activity: ActivityDay[];
}

export interface PublicUserFriend {
  id: string;
  name: string;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  bio: string | null;
  joinedAt: string;
  isSelf: boolean;
  relationship: "none" | "incoming" | "outgoing" | "friend";
  friendshipId: string | null;
  progress: SocialQuestProgress[];
  posts: SocialPost[];
  friends: PublicUserFriend[];
  activityPoints: number;
}

interface FriendRow {
  friendshipId: string;
  id: string;
  name: string;
  friendsSince: Date | string;
  lastActiveAt: Date | string | null;
  activityPoints: string;
}

interface ProgressRow {
  userId: string;
  questSlug: string;
  title: string;
  emoji: string;
  stepsCount: number;
  currentStep: number;
  completedAt: Date | string | null;
}

interface RequestRow {
  friendshipId: string;
  userId: string;
  name: string;
  direction: "incoming" | "outgoing";
  createdAt: Date | string;
}

interface PostRow {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  tags: string[];
  createdAt: Date | string;
}

function iso(value: Date | string): string {
  return new Date(value).toISOString();
}

export async function getSocialDashboard(
  userId: string
): Promise<SocialDashboardData> {
  const pool = getAppPool();
  const [friendResult, requestResult, postResult, activityResult] =
    await Promise.all([
      pool.query<FriendRow>(
        `SELECT f.id AS "friendshipId",
                other.id,
                other.name,
                f.updated_at AS "friendsSince",
                stats.last_active_at AS "lastActiveAt",
                COALESCE(stats.activity_points, 0)::text AS "activityPoints"
           FROM friendships f
           JOIN users other
             ON other.id = CASE
               WHEN f.requester_id = $1 THEN f.addressee_id
               ELSE f.requester_id
             END
           LEFT JOIN LATERAL (
             SELECT MAX(a.created_at) AS last_active_at,
                    COALESCE(SUM(a.points), 0) AS activity_points
               FROM learning_activity a
              WHERE a.user_id = other.id
           ) stats ON true
          WHERE f.status = 'accepted'
            AND (f.requester_id = $1 OR f.addressee_id = $1)
          ORDER BY stats.last_active_at DESC NULLS LAST, other.name`,
        [userId]
      ),
      pool.query<RequestRow>(
        `SELECT f.id AS "friendshipId",
                other.id AS "userId",
                other.name,
                CASE WHEN f.addressee_id = $1
                     THEN 'incoming' ELSE 'outgoing' END AS direction,
                f.created_at AS "createdAt"
           FROM friendships f
           JOIN users other
             ON other.id = CASE
               WHEN f.requester_id = $1 THEN f.addressee_id
               ELSE f.requester_id
             END
          WHERE f.status = 'pending'
            AND (f.requester_id = $1 OR f.addressee_id = $1)
          ORDER BY f.created_at DESC`,
        [userId]
      ),
      pool.query<PostRow>(
        `SELECT p.id,
                p.user_id AS "authorId",
                u.name AS "authorName",
                p.content,
                p.tags,
                p.created_at AS "createdAt"
           FROM user_posts p
           JOIN users u ON u.id = p.user_id
          WHERE p.user_id = $1
             OR EXISTS (
               SELECT 1
                 FROM friendships f
                WHERE f.status = 'accepted'
                  AND ((f.requester_id = $1 AND f.addressee_id = p.user_id)
                    OR (f.addressee_id = $1 AND f.requester_id = p.user_id))
             )
          ORDER BY p.created_at DESC
          LIMIT 50`,
        [userId]
      ),
      pool.query<ActivityDay>(
        `SELECT created_at::date::text AS date,
                SUM(points)::integer AS count
           FROM learning_activity
          WHERE user_id = $1
            AND created_at >= CURRENT_DATE - INTERVAL '370 days'
          GROUP BY created_at::date
          ORDER BY created_at::date`,
        [userId]
      ),
    ]);

  const friendIds = friendResult.rows.map((friend) => friend.id);
  const progressResult =
    friendIds.length > 0
      ? await pool.query<ProgressRow>(
          `SELECT p.user_id AS "userId",
                  p.quest_slug AS "questSlug",
                  q.title,
                  q.emoji,
                  q.steps_count AS "stepsCount",
                  p.current_step AS "currentStep",
                  p.completed_at AS "completedAt"
             FROM quest_progress p
             JOIN quests q ON q.slug = p.quest_slug
            WHERE p.user_id = ANY($1::uuid[])
            ORDER BY p.updated_at DESC`,
          [friendIds]
        )
      : { rows: [] as ProgressRow[] };

  const progressByUser = new Map<string, SocialQuestProgress[]>();
  for (const row of progressResult.rows) {
    const completed = Boolean(row.completedAt);
    const percent = completed
      ? 100
      : Math.round(
          (Math.max(row.currentStep - 1, 0) / Math.max(row.stepsCount, 1)) * 100
        );
    const entry: SocialQuestProgress = {
      questSlug: row.questSlug,
      title: row.title,
      emoji: row.emoji,
      stepsCount: row.stepsCount,
      currentStep: row.currentStep,
      completedAt: row.completedAt ? iso(row.completedAt) : null,
      percent,
    };
    progressByUser.set(row.userId, [
      ...(progressByUser.get(row.userId) ?? []),
      entry,
    ]);
  }

  return {
    friends: friendResult.rows.map((friend) => ({
      friendshipId: friend.friendshipId,
      id: friend.id,
      name: friend.name,
      friendsSince: iso(friend.friendsSince),
      lastActiveAt: friend.lastActiveAt ? iso(friend.lastActiveAt) : null,
      activityPoints: Number(friend.activityPoints),
      progress: progressByUser.get(friend.id) ?? [],
    })),
    requests: requestResult.rows.map((request) => ({
      ...request,
      createdAt: iso(request.createdAt),
    })),
    posts: postResult.rows.map((post) => ({
      ...post,
      createdAt: iso(post.createdAt),
      isOwn: post.authorId === userId,
    })),
    activity: activityResult.rows,
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getPublicUserProfile(
  viewerId: string,
  profileUserId: string
): Promise<PublicUserProfile | null> {
  if (!UUID_RE.test(profileUserId)) return null;

  const pool = getAppPool();
  const userResult = await pool.query<{
    id: string;
    name: string;
    bio: string | null;
    joinedAt: Date | string;
  }>(
    `SELECT id, name, bio, created_at AS "joinedAt"
       FROM users
      WHERE id = $1`,
    [profileUserId]
  );
  const profileUser = userResult.rows[0];
  if (!profileUser) return null;

  const [progressResult, postsResult, friendsResult, activityResult, relationResult] =
    await Promise.all([
      pool.query<ProgressRow>(
        `SELECT p.user_id AS "userId",
                p.quest_slug AS "questSlug",
                q.title,
                q.emoji,
                q.steps_count AS "stepsCount",
                p.current_step AS "currentStep",
                p.completed_at AS "completedAt"
           FROM quest_progress p
           JOIN quests q ON q.slug = p.quest_slug
          WHERE p.user_id = $1
          ORDER BY p.updated_at DESC`,
        [profileUserId]
      ),
      pool.query<PostRow>(
        `SELECT p.id,
                p.user_id AS "authorId",
                u.name AS "authorName",
                p.content,
                p.tags,
                p.created_at AS "createdAt"
           FROM user_posts p
           JOIN users u ON u.id = p.user_id
          WHERE p.user_id = $1
          ORDER BY p.created_at DESC
          LIMIT 30`,
        [profileUserId]
      ),
      pool.query<PublicUserFriend>(
        `SELECT other.id, other.name
           FROM friendships f
           JOIN users other
             ON other.id = CASE
               WHEN f.requester_id = $1 THEN f.addressee_id
               ELSE f.requester_id
             END
          WHERE f.status = 'accepted'
            AND (f.requester_id = $1 OR f.addressee_id = $1)
          ORDER BY other.name`,
        [profileUserId]
      ),
      pool.query<{ points: string }>(
        `SELECT COALESCE(SUM(points), 0)::text AS points
           FROM learning_activity
          WHERE user_id = $1`,
        [profileUserId]
      ),
      viewerId === profileUserId
        ? Promise.resolve({ rows: [] as Array<{ id: string; requesterId: string; status: string }> })
        : pool.query<{ id: string; requesterId: string; status: string }>(
            `SELECT id, requester_id AS "requesterId", status
               FROM friendships
              WHERE (requester_id = $1 AND addressee_id = $2)
                 OR (requester_id = $2 AND addressee_id = $1)
              LIMIT 1`,
            [viewerId, profileUserId]
          ),
    ]);

  const progress = progressResult.rows.map((row) => {
    const completed = Boolean(row.completedAt);
    return {
      questSlug: row.questSlug,
      title: row.title,
      emoji: row.emoji,
      stepsCount: row.stepsCount,
      currentStep: row.currentStep,
      completedAt: row.completedAt ? iso(row.completedAt) : null,
      percent: completed
        ? 100
        : Math.round(
            (Math.max(row.currentStep - 1, 0) /
              Math.max(row.stepsCount, 1)) *
              100
          ),
    };
  });

  const relation = relationResult.rows[0];
  let relationship: PublicUserProfile["relationship"] = "none";
  if (relation?.status === "accepted") relationship = "friend";
  else if (relation?.status === "pending") {
    relationship = relation.requesterId === viewerId ? "outgoing" : "incoming";
  }

  return {
    id: profileUser.id,
    name: profileUser.name,
    bio: profileUser.bio,
    joinedAt: iso(profileUser.joinedAt),
    isSelf: viewerId === profileUser.id,
    relationship,
    friendshipId: relation?.id ?? null,
    progress,
    posts: postsResult.rows.map((post) => ({
      ...post,
      createdAt: iso(post.createdAt),
      isOwn: post.authorId === viewerId,
    })),
    friends: friendsResult.rows,
    activityPoints: Number(activityResult.rows[0]?.points ?? 0),
  };
}

export interface CommunityData {
  posts: SocialPost[];
  tagCounts: Record<string, number>;
  totalPosts: number;
}

export async function getCommunityPosts(
  viewerId: string | null,
  tag: string | null = null
): Promise<CommunityData> {
  const pool = getAppPool();
  const [postsResult, tagsResult, totalResult] = await Promise.all([
    pool.query<PostRow>(
      `SELECT p.id,
              p.user_id AS "authorId",
              u.name AS "authorName",
              p.content,
              p.tags,
              p.created_at AS "createdAt"
         FROM user_posts p
         JOIN users u ON u.id = p.user_id
        WHERE ($1::text IS NULL OR $1 = ANY(p.tags))
        ORDER BY p.created_at DESC
        LIMIT 100`,
      [tag]
    ),
    pool.query<{ tag: string; count: number }>(
      `SELECT tag, count(*)::integer AS count
         FROM user_posts p,
              unnest(p.tags) AS tag
        GROUP BY tag`
    ),
    pool.query<{ count: string }>(`SELECT count(*)::text AS count FROM user_posts`),
  ]);

  return {
    posts: postsResult.rows.map((post) => ({
      ...post,
      createdAt: iso(post.createdAt),
      isOwn: post.authorId === viewerId,
    })),
    tagCounts: Object.fromEntries(
      tagsResult.rows.map((row) => [row.tag, Number(row.count)])
    ),
    totalPosts: Number(totalResult.rows[0]?.count ?? 0),
  };
}
