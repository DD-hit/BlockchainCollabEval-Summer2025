// 合约ABI和字节码配置
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取合约文件 - 修复路径（旧评分合约）
const abiPath = path.join(__dirname, '../../../contracts/ContributionScore.abi');
const binPath = path.join(__dirname, '../../../contracts/ContributionScore.bin');

// 读取ABI
const ContributionScoreABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

// 读取字节码
const ContributionScoreBytecode = '0x' + fs.readFileSync(binPath, 'utf8');

export { ContributionScoreABI, ContributionScoreBytecode };

// GitHub 贡献度合约（新）
let GitHubContributionABI = null;
let GitHubContributionBytecode = null;
try {
  const ghAbiPath = path.join(__dirname, '../../../contracts/GitHubContribution.abi');
  const ghBinPath = path.join(__dirname, '../../../contracts/GitHubContribution.bin');
  if (fs.existsSync(ghAbiPath) && fs.existsSync(ghBinPath)) {
    GitHubContributionABI = JSON.parse(fs.readFileSync(ghAbiPath, 'utf8'));
    GitHubContributionBytecode = '0x' + fs.readFileSync(ghBinPath, 'utf8');
  }
} catch (e) {
  // 忽略读取失败，调用方应检查是否为空提示编译合约
}

export { GitHubContributionABI, GitHubContributionBytecode };