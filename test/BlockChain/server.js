import express from 'express';
import { Web3 } from 'web3';
import fs from 'fs';

const app = express();
app.use(express.json());

const abi = JSON.parse(fs.readFileSync('./test/BlockChain/SimpleStorage_sol_SimpleStorage.abi', 'utf-8'));
const contractAddress = '0x6723C38fB06Da781EA4B39894CD451263f023F78';

app.post('/sendTx', async (req, res) => {
    const { newNum, privateKey } = req.body;
    if (!newNum || !privateKey) return res.status(400).send('参数缺失');
    try {
        const web3 = new Web3('http://192.168.3.40:8545');
        const account = web3.eth.accounts.wallet.add(privateKey);
        const contract = new web3.eth.Contract(abi, contractAddress);
        const tx = await contract.methods.setNum(Number(newNum)).send({
            from: web3.eth.accounts.wallet[0].address,
            gas: 100000,
            gasPrice: '20000000000',
            type: '0x0'
        });
        const newValue = await contract.methods.getNum().call();
        res.send(`交易成功！哈希: ${tx.transactionHash}\n最新 getNum(): ${newValue}`);
    } catch (err) {
        res.status(500).send('交易失败: ' + err.message);
    }
});

app.use(express.static('./test/BlockChain')); // 让 frontend.html 可直接访问

app.listen(3000, () => {
    console.log('服务已启动：http://localhost:3000/frontend.html');
});
