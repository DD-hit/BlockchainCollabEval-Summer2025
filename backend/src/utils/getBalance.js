import Web3 from 'web3';

export const getBalance = async (address) => {
    const web3 = new Web3('http://192.168.139.129:8545');
    const balance = await web3.eth.getBalance(address);
    console.log(balance);
    return balance;
}

