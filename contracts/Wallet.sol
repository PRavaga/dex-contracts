// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Wallet is Ownable {

    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }

    bytes32[] public tokenList;
    mapping(bytes32 => Token) public tokenMapping;
    mapping(address => mapping(bytes32 => uint256)) public balances;

    modifier tokenExists(bytes32 _ticker) {
        require(tokenMapping[_ticker].tokenAddress != address(0), "ticker does not exist");
        _;        
    }

    function addToken(bytes32 _ticker, address _tokenAddress)  external onlyOwner {
        tokenMapping[_ticker] = Token(_ticker, _tokenAddress);
        tokenList.push(_ticker);
    }

    function deposit(uint256 _amount, bytes32 _ticker) tokenExists(_ticker) external {
        IERC20(tokenMapping[_ticker].tokenAddress).transferFrom(msg.sender, address(this), _amount);
        balances[msg.sender][_ticker] += _amount;

    }

    function withdraw(uint256 _amount, bytes32 _ticker) tokenExists(_ticker) external {
        require(balances[msg.sender][_ticker] >= _amount, "balance too low");
        balances[msg.sender][_ticker] -= _amount;
        IERC20(tokenMapping[_ticker].tokenAddress).transfer(msg.sender, _amount);
    }
}
