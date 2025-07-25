import Web3 from 'web3';

const web3 = new Web3('http://192.168.139.129:8545');

const account = web3.eth.accounts.create();
const account2 = web3.eth.accounts.create();
console.log(account);
console.log(account2);


web3.eth.accounts.wallet.add(account.privateKey);
web3.eth.accounts.wallet.add(account2.privateKey);
web3.eth.accounts.wallet.add(account.privateKey);
web3.eth.accounts.wallet.add(account2.privateKey);

console.log(web3.eth.accounts.wallet);