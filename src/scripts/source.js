// Imports
const ethers = await import("npm:ethers@6.10.0");

const abi = JSON.parse(args[0]);
const CONTRACT_ADDRESS = args[1];

const RPC_URL = "----USE_ALCHEMY_ETH_SEPOLIA_RPC_URL-----";

// Set up provider and signer
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet("---USE_YOUR_PRIVATE_KEY----", provider);

async function rpcCall(method, params = []) {
  try {
    const body = JSON.stringify({
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: 1,
    });
    const response = await fetch(RPC_URL, {
      method: "POST",
      body: body,
    });
    return (await response.json()).result;
  } catch (error) {
    console.error("Error executing RPC method:", error);
    throw error;
  }
}

async function getEncodedFunctionData(contract, method, params) {
  const functionABI = contract.interface.getFunction(method);

  // Encode the function call data
  const functionData = contract.interface.encodeFunctionData(
    functionABI,
    params
  );

  return functionData;
}
const method = "increment";
const target_sc = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

// Get chain ID
const chainId = await rpcCall("eth_chainId");
// Get gas price
const gasPrice = await rpcCall("eth_gasPrice");
// Get sender's nonce
const nonce = await rpcCall("eth_getTransactionCount", [
  signer.address,
  "latest",
]);
// Encode Function Data
const encodedFunctionData = await getEncodedFunctionData(target_sc, method, []);

const transactionObject = {
  from: signer.address,
  to: CONTRACT_ADDRESS,
  gasPrice: gasPrice,
  nonce: nonce,
  chainId: chainId,
  data: encodedFunctionData,
};

transactionObject.gasLimit = await rpcCall("eth_estimateGas", [
  transactionObject,
]);
const signedTx = await signer.signTransaction(transactionObject);

// Send raw transaction
const txHash = await rpcCall("eth_sendRawTransaction", [signedTx]);

console.log("Transaction sent. Transaction hash:", txHash);
return Functions.encodeString(txHash);
