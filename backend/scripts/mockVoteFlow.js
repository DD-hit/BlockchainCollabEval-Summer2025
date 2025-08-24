// Mock end-to-end on-chain voting flow with 3 users
// Run: node backend/scripts/mockVoteFlow.js

import { pool } from '../config/database.js';
import { AccountService } from '../src/services/accountService.js';
import { GitHubContribOnchainService } from '../src/services/githubContribOnchainService.js';
import Web3 from 'web3';
import { WEB3_PROVIDER } from '../src/config/config.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function ensureUser(username, password) {
  const [rows] = await pool.execute('SELECT username, address FROM user WHERE username=?', [username]);
  if (rows.length > 0) {
    return { username, address: rows[0].address, password };
  }
  const info = await AccountService.createAccount(username, password);
  return { username, address: info.address, password };
}

async function main() {
  // 1) Prepare users (3 members) - fresh usernames to avoid password mismatch
  const suffix = Math.floor(Date.now() / 1000);
  const users = [
    { username: `mock1_${suffix}`, password: 'P@ssw0rd1!' },
    { username: `mock2_${suffix}`, password: 'P@ssw0rd2!' },
    { username: `mock3_${suffix}`, password: 'P@ssw0rd3!' },
  ];
  const members = [];
  for (const u of users) {
    const m = await ensureUser(u.username, u.password);
    members.push(m);
  }

  // Admin = first mock user
  const admin = members[0];
  const adminKey = await AccountService.getPrivateKey(admin.username, admin.password);
  const adminAddress = adminKey.address;

  // Fund accounts if needed (using dev faucet from AccountService.login)
  const web3 = new Web3(WEB3_PROVIDER);
  const faucetAddress = '0x8d8827677E88986F56D5cef372A259Fd7574ac45';
  const faucetPk = '0x42b622069b0edddd24dbd6fb6d9ae670e250bc4946d5d52e4c465b1dba73dc51';
  const fundIfLow = async (to) => {
    const balanceWei = await web3.eth.getBalance(to);
    if (BigInt(balanceWei) > BigInt(web3.utils.toWei('0.5', 'ether'))) return; // enough
    const nonce = await web3.eth.getTransactionCount(faucetAddress, 'pending');
    const gasPrice = await web3.eth.getGasPrice();
    const tx = {
      from: faucetAddress,
      to,
      value: web3.utils.toWei('5', 'ether'),
      gas: 21000,
      gasPrice,
      nonce
    };
    const signed = await web3.eth.accounts.signTransaction(tx, faucetPk);
    await web3.eth.sendSignedTransaction(signed.rawTransaction);
  };
  // fund admin and others
  for (const m of members) {
    await fundIfLow(m.address);
  }

  // 2) Deploy contract
  console.log('Deploying contract...');
  const contractAddress = await GitHubContribOnchainService.deployContract(adminAddress, adminKey.privateKey);
  console.log('Contract:', contractAddress);

  // 3) Base scores (0..100) and details for 3 users
  const addrs = members.map(m => m.address);
  const code = [80, 60, 65];
  const pr = [40, 30, 35];
  const review = [20, 15, 25];
  const issue = [10, 10, 10];
  const baseVal = [60, 50, 55];
  const baseNorm = baseVal.slice();

  // set raters, targets and base details
  await GitHubContribOnchainService.setRaters(contractAddress, adminAddress, adminKey.privateKey, addrs);
  await GitHubContribOnchainService.setTargets(contractAddress, adminAddress, adminKey.privateKey, addrs);
  await GitHubContribOnchainService.setBaseDetails(
    contractAddress,
    adminAddress,
    adminKey.privateKey,
    addrs,
    code,
    pr,
    review,
    issue,
    baseVal,
    baseNorm
  );

  // 4) Each member submits votes (budget=100, cannot vote self)
  // 重要：>=3人时，单人上限=50；因此每人按 50/50 投票
  const votesPlan = [
    { voter: users[0].username, to: [members[1].address, members[2].address], pts: [50, 50] },
    { voter: users[1].username, to: [members[0].address, members[2].address], pts: [50, 50] },
    { voter: users[2].username, to: [members[0].address, members[1].address], pts: [50, 50] },
  ];

  for (const v of votesPlan) {
    const key = await AccountService.getPrivateKey(v.voter, users.find(u => u.username === v.voter).password);
    console.log('Submit votes by', v.voter);
    await GitHubContribOnchainService.submitVotes(contractAddress, key.address, key.privateKey, v.to, v.pts);
    await sleep(500);
  }

  // 5) Finalize and read scores
  console.log('Finalizing...');
  await GitHubContribOnchainService.finalize(contractAddress, adminAddress, adminKey.privateKey);
  const scores = await GitHubContribOnchainService.getFinalScores(contractAddress, addrs);
  console.log('Scores:', scores);

  // 6) Write to DB as a new round for repoId
  const repoId = 'DD-hit/zhongyi_web'; // change to your repo
  const nowMs = Date.now();
  const startMs = nowMs - 3 * 86400000;
  const [ins] = await pool.execute(
    `INSERT INTO contrib_rounds (repoId, initiator, start_ts_ms, end_ts_ms, status) VALUES (?, ?, ?, ?, 'finalized')`,
    [repoId, admin.username, startMs, nowMs]
  );
  const roundId = ins.insertId;

  // base details -> contrib_base_scores
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    await pool.execute(
      `INSERT INTO contrib_base_scores (round_id, username, github_login, address, code_score, pr_score, review_score, issue_score, base_score, raw_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, JSON_OBJECT('mock', true))
       ON DUPLICATE KEY UPDATE code_score=VALUES(code_score), pr_score=VALUES(pr_score), review_score=VALUES(review_score), issue_score=VALUES(issue_score), base_score=VALUES(base_score)`,
      [roundId, m.username, m.username, m.address, code[i], pr[i], review[i], issue[i], baseVal[i]]
    );
  }

  // final scores -> contrib_final_scores
  for (const s of scores) {
    const [u] = await pool.execute('SELECT username FROM user WHERE address=? LIMIT 1', [s.address]);
    const username = u.length > 0 ? u[0].username : null;
    if (!username) continue;
    await pool.execute(
      `INSERT INTO contrib_final_scores (round_id, username, base_score, peer_score, final_score)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE base_score=VALUES(base_score), peer_score=VALUES(peer_score), final_score=VALUES(final_score)`,
      [roundId, username, Number(s.base?.base) || 0, Number(s.peerNorm) || 0, Number(s.finalScore) || 0]
    );
  }

  console.log('\nMock voting done. Round:', roundId, 'Contract:', contractAddress);
  process.exit(0);
}

main().catch(err => {
  console.error('Mock flow failed:', err);
  process.exit(1);
});


