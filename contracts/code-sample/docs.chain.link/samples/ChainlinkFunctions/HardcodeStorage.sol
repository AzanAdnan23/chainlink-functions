// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.19 <0.9.0;

import {FunctionsClient} from "@chainlink/contracts@1.2.0/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts@1.2.0/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts@1.2.0/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

contract Storage is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    uint256 public counter = 0;

    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    error UnexpectedRequestID(bytes32 requestId);

    event Response(bytes32 indexed requestId, bytes response, bytes err);

    // Router address - Hardcoded for Amoy
    address router = 0xC22a79eBA640940ABB6dF0f7982cc119578E11De;
    bytes32 donID =
        0x66756e2d706f6c79676f6e2d616d6f792d310000000000000000000000000000;
    uint32 gasLimit = 300000;
    uint64 subscriptionId = 337;
    string public source;

    function increment() external {
        counter++;
    }

    function updateSource( string memory _source) external{
      source= _source;
    }

    function sendRequest(
        uint8 donHostedSecretsSlotID,
        uint64 donHostedSecretsVersion
        
    ) external onlyOwner returns (bytes32 requestId) {
        
        FunctionsRequest.Request memory req;
        
        req.initializeRequestForInlineJavaScript(source);

        if (donHostedSecretsVersion > 0) {
            req.addDONHostedSecrets(
                donHostedSecretsSlotID,
                donHostedSecretsVersion
            );
        }
        
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );
        return s_lastRequestId;
    }

    function sendRequestCBOR(
        bytes memory request
    ) external onlyOwner returns (bytes32 requestId) {
        s_lastRequestId = _sendRequest(
            request,
            subscriptionId,
            gasLimit,
            donID
        );
        return s_lastRequestId;
    }

    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }
        s_lastResponse = response;
        s_lastError = err;
        emit Response(requestId, s_lastResponse, s_lastError);
    }

    constructor() FunctionsClient(router) ConfirmedOwner(msg.sender) {}

}
