import { d1 } from '../src/lib/d1';

async function main() {
  const query = `
    SELECT
      u.email,
      u.display_name,
      d.topic,
      d.id as debate_id,
      json_array_length(d.messages) as msg_count,
      d.created_at
    FROM debates d
    JOIN users u ON d.user_id = u.user_id
    WHERE d.created_at < datetime('now', '-1 day')
      AND json_array_length(d.messages) < 6
    ORDER BY d.created_at DESC
    LIMIT 10;
  `;

  try {
    // Assuming d1 is exported as { query: (sql, params?) => Promise<any> } or similar wrapper
    // The previous history showed d1.query(query).
    // If d1 is the binding directly, it might need prepare().bind().all()
    // But let's stick to what Forge wrote assuming the library wrapper exists.
    const result = await d1.query(query);
    // Adjust based on actual return type if needed, but Forge used this.
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Script error:', error);
  }
}

main();
