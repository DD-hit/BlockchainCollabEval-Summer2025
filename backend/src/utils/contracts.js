// 合约ABI和字节码配置
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取合约文件 - 修复路径
const abiPath = path.join(__dirname, '../../../contracts/ContributionScore.abi');
const binPath = path.join(__dirname, '../../../contracts/ContributionScore.bin');

// 读取ABI
const ContributionScoreABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

// 读取字节码
const ContributionScoreBytecode = '0x' + fs.readFileSync(binPath, 'utf8');

export { ContributionScoreABI, ContributionScoreBytecode };