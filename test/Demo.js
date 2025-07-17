import { Web3 } from 'web3';

const web3 = new Web3("http://192.168.3.40:8545");

web3.eth.getNodeInfo()
.then((info)=>
    console.log(info)
);