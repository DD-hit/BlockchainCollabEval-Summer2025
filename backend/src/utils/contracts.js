// 合约ABI和字节码配置
import fs from 'fs';
import path from 'path';

// 读取合约文件
const abiPath = path.join(process.cwd(), '../../contracts/ContributionScore.abi');
const binPath = path.join(process.cwd(), '../../contracts/ContributionScore.bin');

// 读取ABI
const ContributionScoreFactoryABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

// 读取字节码
const ContributionScoreFactoryBytecode = '0x' + fs.readFileSync(binPath, 'utf8');

export { ContributionScoreFactoryABI, ContributionScoreFactoryBytecode };