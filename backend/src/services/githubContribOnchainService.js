import Web3 from 'web3';
import { WEB3_PROVIDER } from '../config/config.js';
import { GitHubContributionABI, GitHubContributionBytecode } from '../utils/contracts.js';

export class GitHubContribOnchainService {
    static getWeb3() {
        return new Web3(WEB3_PROVIDER);
    }

    static ensureAbi() {
        if (!GitHubContributionABI || !GitHubContributionBytecode) {
            const e = new Error('缺少 GitHubContribution 合约 ABI/Bytecode，请先编译生成 .abi/.bin');
            e.code = 'ABI_MISSING';
            throw e;
        }
    }

    static async deployContract(adminAddress, adminPrivateKey) {
        this.ensureAbi();
        const web3 = this.getWeb3();
        const account = web3.eth.accounts.privateKeyToAccount(adminPrivateKey);
        if (account.address.toLowerCase() !== adminAddress.toLowerCase()) {
            throw new Error('admin 地址与私钥不匹配');
        }
        const contract = new web3.eth.Contract(GitHubContributionABI);
        const deployTx = contract.deploy({ data: GitHubContributionBytecode, arguments: [adminAddress] });
        const data = deployTx.encodeABI();
        const gas = await deployTx.estimateGas({ from: adminAddress });
        const gasPrice = await web3.eth.getGasPrice();
        const nonce = await web3.eth.getTransactionCount(adminAddress, 'pending');
        const chainId = await web3.eth.getChainId();

        const signed = await web3.eth.accounts.signTransaction({
            from: adminAddress,
            data,
            gas,
            gasPrice,
            nonce,
            chainId
        }, adminPrivateKey);
        const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        // 合约地址在receipt.contractAddress
        return receipt.contractAddress;
    }

    static getContract(address) {
        this.ensureAbi();
        const web3 = this.getWeb3();
        return new web3.eth.Contract(GitHubContributionABI, address);
    }

    static async setRaters(contractAddress, adminAddress, adminPrivateKey, raters) {
        const web3 = this.getWeb3();
        const account = web3.eth.accounts.privateKeyToAccount(adminPrivateKey);
        if (account.address.toLowerCase() !== adminAddress.toLowerCase()) throw new Error('admin 地址与私钥不匹配');
        const c = this.getContract(contractAddress);
        const tx = c.methods.setRaters(raters);
        const data = tx.encodeABI();
        const gas = await tx.estimateGas({ from: adminAddress });
        const gasPrice = await web3.eth.getGasPrice();
        const nonce = await web3.eth.getTransactionCount(adminAddress, 'pending');
        const chainId = await web3.eth.getChainId();
        const signed = await web3.eth.accounts.signTransaction({
            to: contractAddress,
            data,
            gas,
            gasPrice,
            nonce,
            chainId
        }, adminPrivateKey);
        return await web3.eth.sendSignedTransaction(signed.rawTransaction);
    }

    static async setTargets(contractAddress, adminAddress, adminPrivateKey, targets) {
        const web3 = this.getWeb3();
        const account = web3.eth.accounts.privateKeyToAccount(adminPrivateKey);
        if (account.address.toLowerCase() !== adminAddress.toLowerCase()) throw new Error('admin 地址与私钥不匹配');
        const c = this.getContract(contractAddress);
        const tx = c.methods.setTargets(targets);
        const data = tx.encodeABI();
        const gas = await tx.estimateGas({ from: adminAddress });
        const gasPrice = await web3.eth.getGasPrice();
        const nonce = await web3.eth.getTransactionCount(adminAddress, 'pending');
        const chainId = await web3.eth.getChainId();
        const signed = await web3.eth.accounts.signTransaction({
            to: contractAddress,
            data,
            gas,
            gasPrice,
            nonce,
            chainId
        }, adminPrivateKey);
        return await web3.eth.sendSignedTransaction(signed.rawTransaction);
    }

    static async setBaseDetails(contractAddress, adminAddress, adminPrivateKey, users, code, pr, review, issue, baseVal, baseNormVal) {
        const web3 = this.getWeb3();
        const account = web3.eth.accounts.privateKeyToAccount(adminPrivateKey);
        if (account.address.toLowerCase() !== adminAddress.toLowerCase()) throw new Error('admin 地址与私钥不匹配');
        const c = this.getContract(contractAddress);
        const tx = c.methods.setBaseDetails(users, code, pr, review, issue, baseVal, baseNormVal);
        const data = tx.encodeABI();
        const gas = await tx.estimateGas({ from: adminAddress });
        const gasPrice = await web3.eth.getGasPrice();
        const nonce = await web3.eth.getTransactionCount(adminAddress, 'pending');
        const chainId = await web3.eth.getChainId();
        const signed = await web3.eth.accounts.signTransaction({
            to: contractAddress,
            data,
            gas,
            gasPrice,
            nonce,
            chainId
        }, adminPrivateKey);
        return await web3.eth.sendSignedTransaction(signed.rawTransaction);
    }

    static async submitVotes(contractAddress, voterAddress, voterPrivateKey, to, pts) {
        const web3 = this.getWeb3();
        const account = web3.eth.accounts.privateKeyToAccount(voterPrivateKey);
        if (account.address.toLowerCase() !== voterAddress.toLowerCase()) throw new Error('投票地址与私钥不匹配');
        const c = this.getContract(contractAddress);
        const tx = c.methods.submitVotes(to, pts);
        const data = tx.encodeABI();
        const gas = await tx.estimateGas({ from: voterAddress });
        const gasPrice = await web3.eth.getGasPrice();
        const nonce = await web3.eth.getTransactionCount(voterAddress, 'pending');
        const chainId = await web3.eth.getChainId();
        const signed = await web3.eth.accounts.signTransaction({
            to: contractAddress,
            data,
            gas,
            gasPrice,
            nonce,
            chainId
        }, voterPrivateKey);
        return await web3.eth.sendSignedTransaction(signed.rawTransaction);
    }

    static async finalize(contractAddress, adminAddress, adminPrivateKey) {
        const web3 = this.getWeb3();
        const account = web3.eth.accounts.privateKeyToAccount(adminPrivateKey);
        if (account.address.toLowerCase() !== adminAddress.toLowerCase()) throw new Error('admin 地址与私钥不匹配');
        const c = this.getContract(contractAddress);
        const tx = c.methods.finalize();
        const data = tx.encodeABI();
        const gas = await tx.estimateGas({ from: adminAddress });
        const gasPrice = await web3.eth.getGasPrice();
        const nonce = await web3.eth.getTransactionCount(adminAddress, 'pending');
        const chainId = await web3.eth.getChainId();
        const signed = await web3.eth.accounts.signTransaction({
            to: contractAddress,
            data,
            gas,
            gasPrice,
            nonce,
            chainId
        }, adminPrivateKey);
        return await web3.eth.sendSignedTransaction(signed.rawTransaction);
    }

    static async getProgress(contractAddress) {
        const c = this.getContract(contractAddress);
        const total = await c.methods.totalRaters().call();
        const voted = await c.methods.votedCount().call();
        const finalized = await c.methods.finalized().call();
        return { total: Number(total), voted: Number(voted), finalized: !!finalized };
    }

    static async getFinalScores(contractAddress, users) {
        const c = this.getContract(contractAddress);
        const result = [];
        for (const addr of users) {
            const finalScore = await c.methods.finalScoreOf(addr).call();
            const peer = await c.methods.finalPeerOf(addr).call();
            // baseDetails 是 public struct 映射，solc 会生成 getter
            const bd = await c.methods.baseDetails(addr).call();
            result.push({
                address: addr,
                finalScore: Number(finalScore),
                peerNorm: Number(peer),
                base: {
                    code: Number(bd.code), pr: Number(bd.pr), review: Number(bd.review), issue: Number(bd.issue), base: Number(bd.base)
                }
            });
        }
        return result;
    }
}


