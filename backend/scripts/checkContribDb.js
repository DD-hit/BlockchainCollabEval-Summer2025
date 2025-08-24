// Run with: node backend/scripts/checkContribDb.js
import { pool } from '../config/database.js';

const q = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const main = async () => {
  const out = {};

  out.rounds = await q(
    `SELECT id, repoId, initiator,
            FROM_UNIXTIME(start_ts_ms/1000) AS start_at,
            FROM_UNIXTIME(end_ts_ms/1000)   AS end_at,
            status, created_at
     FROM contrib_rounds ORDER BY id DESC LIMIT 3`
  );

  const last = out.rounds?.[0];
  if (!last) {
    console.log(JSON.stringify({ ok: true, message: 'no rounds', data: out }, null, 2));
    process.exit(0);
  }
  const rid = last.id;

  out.base_summary = await q(
    `SELECT COUNT(*) AS members,
            SUM(base_score) AS base_sum,
            SUM(CASE WHEN base_score>0 THEN 1 ELSE 0 END) AS nonzero_base_cnt
     FROM contrib_base_scores WHERE round_id=?`,
    [rid]
  );

  out.base_missing_addr = await q(
    `SELECT github_login, username FROM contrib_base_scores
     WHERE round_id=? AND (address IS NULL OR address='')`,
    [rid]
  );

  out.base_top10 = await q(
    `SELECT github_login, username, address, code_score, pr_score, review_score, issue_score, base_score
     FROM contrib_base_scores WHERE round_id=?
     ORDER BY base_score DESC, github_login LIMIT 10`,
    [rid]
  );

  out.votes_by_reviewer = await q(
    `SELECT reviewer, COUNT(*) AS votes_cnt, MIN(score) AS min_s, MAX(score) AS max_s
     FROM contrib_peer_votes WHERE round_id=?
     GROUP BY reviewer ORDER BY votes_cnt DESC`,
    [rid]
  );

  out.votes_invalid_targets = await q(
    `SELECT pv.target
     FROM contrib_peer_votes pv
     LEFT JOIN contrib_base_scores b ON b.round_id=? AND b.github_login=pv.target
     WHERE pv.round_id=? AND b.github_login IS NULL
     LIMIT 20`,
    [rid, rid]
  );

  out.not_voted_reviewers = await q(
    `SELECT b.username AS should_review_but_missing
     FROM contrib_base_scores b
     LEFT JOIN (SELECT DISTINCT reviewer FROM contrib_peer_votes WHERE round_id=?) v
       ON v.reviewer=b.username
     WHERE b.round_id=? AND v.reviewer IS NULL`,
    [rid, rid]
  );

  out.tx_recent = await q(
    `SELECT id, type, username, contractAddress, createdAt, description
     FROM transactions
     WHERE type IN ('contrib_round','score')
     ORDER BY id DESC LIMIT 20`
  );

  out.notifications = await q(
    `SELECT id, receiver, createdTime, content
     FROM notifications
     WHERE type='contrib_round' AND JSON_EXTRACT(content,'$.roundId') = CAST(? AS JSON)
     ORDER BY id DESC`,
    [rid]
  );

  console.log(JSON.stringify({ ok: true, rid, data: out }, null, 2));
  process.exit(0);
};

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err?.message || String(err) }, null, 2));
  process.exit(1);
});


