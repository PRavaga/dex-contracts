// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Wallet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Dex is Wallet {

    enum Side {
        BUY,
        SELL
    }

    struct Order {
        uint id;
        Side side; 
        bytes32 ticker;
        address trader;
        uint price;
        uint amount;
        uint filled;              
    }

    uint nextOrderId = 0;

    mapping(bytes32 => mapping (uint => Order[])) public orderbook;

    function getOrderbook(bytes32 _ticker, Side _side) public view returns(Order[] memory) {
        return orderbook[_ticker][uint(_side)];
    }

    function createOrder(Side _side, bytes32 _ticker, uint _amount, uint _price) public {
        if (_side == Side.BUY) {
            require(balances[msg.sender]['WETH'] >= _amount * _price, "balance too low");
        } else if (_side == Side.SELL ) {
            require(balances[msg.sender][_ticker] >= _amount, "balance too low");
        }
        Order[] storage orders = orderbook[_ticker][uint(_side)];
        orders.push(Order(nextOrderId, _side, _ticker, msg.sender, _price, _amount, 0));


        uint i = orders.length > 0 ? orders.length - 1 : 0;
        if (_side == Side.BUY) {
            while(i > 0) {
                if (orders[i - 1].price > orders[i].price) {
                    break;
                }
                Order memory order = orders[i -1];
                orders[i -1 ] = orders[i];
                orders[i] = order;
                i--;
            }          
        } else if (_side == Side.SELL ) {
            while(i > 0) {
                if (orders[i - 1].price < orders[i].price) {
                    break;
                }
                Order memory order = orders[i - 1];
                orders[i - 1] = orders[i];
                orders[i] = order;
                i--;
            }   
        }
        nextOrderId++;
    }

    function createMArketOrder(Side _side, bytes32 _ticker, uint _amount) public {
        if (_side == Side.SELL) {
            require(balances[msg.sender][_ticker] >= _amount, "unsufficient balance");
        }
                
        uint orderBookSide;
        
        if (_side == Side.BUY) {
            orderBookSide = 1;
        } else {
            orderBookSide = 0;
        }

        Order[] storage orders = orderbook[_ticker][orderBookSide];

        uint totalFilled;

        for (uint i = 0; i < orders.length && totalFilled < _amount; i++) {

            uint leftToFill = orders[i].amount - totalFilled;
            uint availableToFill = orders[i].amount - orders[i].filled;
            uint filled = 0;
            availableToFill > leftToFill ? filled = leftToFill : filled = availableToFill;
            totalFilled += filled;
            orders[i].filled += filled;
            uint cost = filled * orders[i].price;

            if (_side == Side.BUY) {
                require(balances[msg.sender]['ETH'] >= cost, "unsufficient balance");
                
                balances[msg.sender][_ticker] += filled;
                balances[msg.sender]['ETH'] -= cost;

                balances[orders[i].trader][_ticker] -= filled;
                balances[orders[i].trader]['ETH'] += cost;

            } else {
                balances[msg.sender][_ticker] -= filled;
                balances[msg.sender]['ETH'] += cost;

                balances[orders[i].trader][_ticker] += filled;
                balances[orders[i].trader]['ETH'] -= cost;
            }
        }

        while(orders.length > 0 && orders[0].filled == orders[0].amount) {
            for (uint i = 0; i < orders.length; i++) {
                    orders[i] = orders[i + 1];
                    orders.pop();
            }
        }
    }
}