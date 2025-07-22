import { Web3 } from 'web3';
import fs from 'fs';

const web3 = new Web3('http://192.168.139.129:8545');
const contractAddress = '0xCE49f3614e907C0fE86F6195395bf8F8862ba547';
const contractAbi = JSON.parse(fs.readFileSync('./test/BlockChain/LuckNum.abi', 'utf-8'));
const contract = new web3.eth.Contract(contractAbi, contractAddress);
web3.eth.accounts.wallet.add('0xcdcfb484cf3017bfa27f2ce8d22a58d4ed6d2a3fe327b9f28e2eef39a3cd6ed7');

async function guess(){
    const LuckNum = 666;
    const initialBalance = await web3.utils.fromWei(await web3.eth.getBalance(web3.eth.accounts.wallet[0].address),'ether');
    console.log('初始余额:', initialBalance);
    const value = web3.utils.toWei('10', 'ether');
    const tx = await contract.methods.guess(LuckNum).send({
        from: web3.eth.accounts.wallet[0].address,
        value: value,
        gas: 300000,
        gasPrice: web3.utils.toWei('20', 'gwei')
    });
    console.log('交易哈希:', tx.transactionHash);
    const finalBalance = await web3.utils.fromWei(await web3.eth.getBalance(web3.eth.accounts.wallet[0].address),'ether');
    console.log('最终余额:', finalBalance);
    if(initialBalance < finalBalance){
        console.log('猜对了');
    }else{
        console.log('猜错了');
    }
}

async function getHistory(x){
    const history = await contract.methods.history(x).call();
    console.log(`第${x+1}次猜数: ${history.num}\n玩家: ${history.player}`);
}

getHistory(3);
