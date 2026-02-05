import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helper';
import { d1 } from '@/lib/d1';

const ADMIN_USER_IDS = new Set([process.env.ADMIN_USER_ID]);

/**
 * GET /api/admin/analysis
 * Temporary endpoint for debate depth investigation.
 * Returns message count distribution + sample short/long debates.
 */
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId || !ADMIN_USER_IDS.has(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      distributionResult,
      shortDebatesResult,
      longDebatesResult,
      premiumVsFreeResult,
      recentDebatesResult,
    ] = await Promise.all([
      // Message count distribution
      d1.query(
        `SELECT
          json_array_length(messages) as msg_count,
          COUNT(*) as debate_count
        FROM debates
        WHERE messages IS NOT NULL
        GROUP BY msg_count
        ORDER BY msg_count ASC`,
        []
      ),

      // 10 shortest debates (≤4 messages) — most recent first
      d1.query(
        `SELECT id, topic, messages, created_at,
          json_array_length(messages) as msg_count,
          score_data
        FROM debates
        WHERE messages IS NOT NULL
          AND json_array_length(messages) <= 4
        ORDER BY created_at DESC
        LIMIT 10`,
        []
      ),

      // 10 longest debates (10+ messages)
      d1.query(
        `SELECT id, topic, messages, created_at,
          json_array_length(messages) as msg_count,
          score_data
        FROM debates
        WHERE messages IS NOT NULL
          AND json_array_length(messages) >= 10
        ORDER BY json_array_length(messages) DESC
        LIMIT 10`,
        []
      ),

      // Premium vs free message counts
      d1.query(
        `SELECT
          CASE
            WHEN u.subscription_status = 'active' AND u.stripe_plan = 'premium' THEN 'premium'
            ELSE 'free'
          END as user_type,
          AVG(json_array_length(d.messages)) as avg_msgs,
          COUNT(*) as debate_count
        FROM debates d
        LEFT JOIN users u ON d.user_id = u.user_id
        WHERE d.messages IS NOT NULL
        GROUP BY user_type`,
        []
      ),

      // Last 20 debates for recent pattern analysis
      d1.query(
        `SELECT id, topic, messages, created_at,
          json_array_length(messages) as msg_count
        FROM debates
        WHERE messages IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 20`,
        []
      ),
    ]);

    // Process short debates — extract last message role and content preview
    const shortDebates = (shortDebatesResult.result || []).map((d: Record<string, unknown>) => {
      let msgs: Array<{ role: string; content: string }> = [];
      try {
        msgs = typeof d.messages === 'string' ? JSON.parse(d.messages as string) : (d.messages as any[]) || [];
      } catch { msgs = []; }

      const userMsgCount = msgs.filter(m => m.role === 'user').length;
      const aiMsgCount = msgs.filter(m => m.role === 'ai').length;
      const lastMsg = msgs[msgs.length - 1];
      const lastMsgPreview = lastMsg ? `${lastMsg.role}: ${lastMsg.content?.substring(0, 100)}...` : 'empty';

      return {
        id: d.id,
        topic: d.topic,
        msgCount: d.msg_count,
        userMsgs: userMsgCount,
        aiMsgs: aiMsgCount,
        lastMsgRole: lastMsg?.role || 'none',
        lastMsgPreview,
        createdAt: d.created_at,
        hasScoreData: !!d.score_data && d.score_data !== 'null',
      };
    });

    // Process long debates
    const longDebates = (longDebatesResult.result || []).map((d: Record<string, unknown>) => {
      let msgs: Array<{ role: string; content: string }> = [];
      try {
        msgs = typeof d.messages === 'string' ? JSON.parse(d.messages as string) : (d.messages as any[]) || [];
      } catch { msgs = []; }

      const userMsgCount = msgs.filter(m => m.role === 'user').length;
      const aiMsgCount = msgs.filter(m => m.role === 'ai').length;

      return {
        id: d.id,
        topic: d.topic,
        msgCount: d.msg_count,
        userMsgs: userMsgCount,
        aiMsgs: aiMsgCount,
        createdAt: d.created_at,
      };
    });

    // Recent debates pattern
    const recentDebates = (recentDebatesResult.result || []).map((d: Record<string, unknown>) => {
      let msgs: Array<{ role: string; content: string }> = [];
      try {
        msgs = typeof d.messages === 'string' ? JSON.parse(d.messages as string) : (d.messages as any[]) || [];
      } catch { msgs = []; }
      const lastMsg = msgs[msgs.length - 1];
      return {
        id: d.id,
        topic: (d.topic as string)?.substring(0, 50),
        msgCount: d.msg_count,
        lastMsgRole: lastMsg?.role || 'none',
        createdAt: d.created_at,
      };
    });

    return NextResponse.json({
      distribution: distributionResult.result || [],
      shortDebates,
      longDebates,
      premiumVsFree: premiumVsFreeResult.result || [],
      recentDebates,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
