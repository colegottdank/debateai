import { describe, it, expect, vi } from 'vitest';
import { d1 } from '@/lib/d1';
import { GET } from '@/app/api/stats/route';

// d1 is already mocked globally in setup.ts, but we can re-assert behavior here if needed.
// setup.ts mocks it as: d1: { query: vi.fn()... }

describe('GET /api/stats KPI Logic', () => {
  it('uses json_extract in SQL query to ensure debate is actually scored', async () => {
    const mockQuery = vi.mocked(d1.query);
    // Reset to clear previous calls
    mockQuery.mockClear();
    
    // Mock return values for the Promise.all array of queries
    mockQuery.mockResolvedValue({ success: true, result: [{ total: 0 }] });

    const request = new Request('http://localhost/api/stats');
    request.headers.set('x-forwarded-for', '1.2.3.4');

    await GET(request);

    // Verify the calls to d1.query
    // We expect multiple calls. Find the one for completed debates.
    const calls = mockQuery.mock.calls;
    const completedDebatesCall = calls.find(call => 
      call[0].includes('debates WHERE') && 
      call[0].includes('score_data IS NOT NULL')
    );

    expect(completedDebatesCall).toBeDefined();
    const sql = completedDebatesCall![0];
    
    // Crucial check: must use json_extract and check debateScore property
    // This confirms we are filtering out debates that only have metadata in score_data
    expect(sql).toContain("json_extract(score_data, '$.debateScore') IS NOT NULL");
  });
});
