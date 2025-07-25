// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.6.0;
contract SimpleStorage {
      uint num;
        //store function
      function setNum(uint _num) public {
          num = _num;
      }
      
      // retrieve function returns the value of storedData
      function getNum() public view returns (uint) {
          return num;
    }
  }