pragma solidity >=0.5.0 <0.6.0;
contract LuckNum{
    uint luckNum = 666;
    struct Guess{
        address player;
        uint num;
    }

    Guess[] public history;

    function guess(uint _num) payable  public {
        Guess memory newGuess;
        newGuess.player = msg.sender;
        newGuess.num = _num;
        history.push(newGuess);
        if(_num == luckNum){
            msg.sender.transfer(msg.value * 2);
        }

    }

    function fallback() external payable { }
}