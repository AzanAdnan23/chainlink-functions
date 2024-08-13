const ethers = await import("npm:ethers@6.10.0");

const RPC_URL = secrets.rpc_url;
const PRIVATE_KEY = secrets.privateKey;
const CONTRACT_ADDRESS = "0x6d3bdeBE1dD53D067B5c6B04eA938A83154FCCD7";

if (!PRIVATE_KEY) {
  throw Error("PRIVATE_KEY environment variable not set (source)");
}
if (!CONTRACT_ADDRESS) {
  throw Error("Contract Address was not provided");
}
if (!RPC_URL) {
  throw Error("RPC URL was not provided.");
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
async function rpcCall(method, params = []) {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    method: method,
    params: params,
    id: 1,
  });
  const response = await fetch(RPC_URL, { method: "POST", body: body });
  return (await response.json()).result;
}
const functionSelector = "0xd09de08a";
const chainId = await rpcCall("eth_chainId");
const gasPrice = await rpcCall("eth_gasPrice");
const nonce = await rpcCall("eth_getTransactionCount", [
  signer.address,
  "latest",
]);
const transactionObject = {
  from: signer.address,
  to: CONTRACT_ADDRESS,
  gasPrice: gasPrice,
  nonce: nonce,
  chainId: chainId,
  data: functionSelector,
};
transactionObject.gasLimit = await rpcCall("eth_estimateGas", [
  transactionObject,
]);
const signedTx = await signer.signTransaction(transactionObject);
await rpcCall("eth_sendRawTransaction", [signedTx]);

return Functions.encodeString("sucess");
