const fs = require("fs");
const path = require("path");
const {
  SubscriptionManager,
  simulateScript,
  ResponseListener,
  ReturnType,
  decodeResult,
  FulfillmentCode,
} = require("@chainlink/functions-toolkit");

const ethers = require("ethers");
require("@chainlink/env-enc").config();

const functionsConsumerAbi = require("../../abi/functionsClient.json");

const consumerAddress = "0x3aaD85bc08EC0C161F7f1DAecE6f5A32ddC36d34"; // REPLACE this with your Functions consumer address
const subscriptionId = 337; // REPLACE this with your subscription ID

//const storageAbi = require("../../abi/storage.json");

const makeRequestSepolia = async () => {
  // hardcoded for Ethereum Sepolia
  const routerAddress = "0xC22a79eBA640940ABB6dF0f7982cc119578E11De";
  const linkTokenAddress = "0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904";
  const donId = "fun-polygon-amoy-1";
  const explorerUrl = "https://amoy.polygonscan.com";

  // Initialize functions settings
  const source = fs
    .readFileSync(path.resolve(__dirname, "stellarSource.js"))
    .toString();

  const serverUrl = "https://soroban-rpc.testnet.stellar.gateway.fm";
  const args = [];

  const gasLimit = 300000;

  // Initialize ethers signer and provider to interact with the contracts onchain
  const privateKey =
    "36be50660cebf0eb609ee223ccd668648553c12867f03832dd74655c2ba1b338"; // fetch PRIVATE_KEY
  if (!privateKey)
    throw new Error(
      "private key not provided - check your environment variables"
    );

  const rpcUrl = "https://polygon-amoy.blockpi.network/v1/rpc/public"; // fetch Sepolia RPC URL

  if (!rpcUrl)
    throw new Error(`rpcUrl not provided  - check your environment variables`);

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider); // create ethers signer for signing transactions

  ///////// START SIMULATION ////////////

  console.log("Start simulation...");

  const response = await simulateScript({
    source: source,
    args: args,
    bytesArgs: [], // bytesArgs - arguments can be encoded off-chain to bytes.
    secrets: {}, // no secrets in this example
  });

  console.log("Simulation result", response);
  const errorString = response.errorString;
  if (errorString) {
    console.log(`❌ Error during simulation: `, errorString);
  } else {
    const returnType = ReturnType.bytes; // Adjust based on the actual response type
    const responseBytesHexstring = response.responseBytesHexstring;

    if (responseBytesHexstring) {
      const decodedResponse = decodeResult(responseBytesHexstring, returnType);
      console.log(`✅ Decoded response to ${returnType}: `, decodedResponse);
    }
  }

  // //////// ESTIMATE REQUEST COSTS ////////
  console.log("\nEstimate request costs...");
  // Initialize and return SubscriptionManager
  const subscriptionManager = new SubscriptionManager({
    signer: signer,
    linkTokenAddress: linkTokenAddress,
    functionsRouterAddress: routerAddress,
  });
  await subscriptionManager.initialize();

  // estimate costs in Juels

  const gasPriceWei = await signer.getGasPrice(); // get gasPrice in wei

  const estimatedCostInJuels =
    await subscriptionManager.estimateFunctionsRequestCost({
      donId: donId, // ID of the DON to which the Functions request will be sent
      subscriptionId: subscriptionId, // Subscription ID
      callbackGasLimit: gasLimit, // Total gas used by the consumer contract's callback
      gasPriceWei: BigInt(gasPriceWei), // Gas price in gWei
    });

  console.log(
    `Fulfillment cost estimated to ${ethers.utils.formatEther(
      estimatedCostInJuels
    )} LINK`
  );

  //////// MAKE REQUEST ////////

  console.log("\nMake request...");

  const functionsConsumer = new ethers.Contract(
    consumerAddress,
    functionsConsumerAbi,
    signer
  );

  // Actual transaction call
  const transaction = await functionsConsumer.sendRequest(
    source, // source
    "0x", // user hosted secrets - encryptedSecretsUrls - empty in this example
    0, // don hosted secrets - slot ID - empty in this example
    0, // don hosted secrets - version - empty in this example
    args,
    [], // bytesArgs - arguments can be encoded off-chain to bytes.
    subscriptionId,
    gasLimit,
    ethers.utils.formatBytes32String(donId) // jobId is bytes32 representation of donId
  );

  // Log transaction details
  console.log(
    `\n✅ Functions request sent! Transaction hash ${transaction.hash}. Waiting for a response...`
  );

  console.log(
    `See your request in the explorer ${explorerUrl}/tx/${transaction.hash}`
  );

  const responseListener = new ResponseListener({
    provider: provider,
    functionsRouterAddress: routerAddress,
  }); // Instantiate a ResponseListener object to wait for fulfillment.
  (async () => {
    try {
      const response = await new Promise((resolve, reject) => {
        responseListener
          .listenForResponseFromTransaction(transaction.hash)
          .then((response) => {
            resolve(response); // Resolves once the request has been fulfilled.
          })
          .catch((error) => {
            reject(error); // Indicate that an error occurred while waiting for fulfillment.
          });
      });

      const fulfillmentCode = response.fulfillmentCode;

      if (fulfillmentCode === FulfillmentCode.FULFILLED) {
        console.log(
          `\n✅ Request ${
            response.requestId
          } successfully fulfilled. Cost is ${ethers.utils.formatEther(
            response.totalCostInJuels
          )} LINK.Complete reponse: `,
          response
        );
      } else if (fulfillmentCode === FulfillmentCode.USER_CALLBACK_ERROR) {
        console.log(
          `\n⚠️ Request ${
            response.requestId
          } fulfilled. However, the consumer contract callback failed. Cost is ${ethers.utils.formatEther(
            response.totalCostInJuels
          )} LINK.Complete reponse: `,
          response
        );
      } else {
        console.log(
          `\n❌ Request ${
            response.requestId
          } not fulfilled. Code: ${fulfillmentCode}. Cost is ${ethers.utils.formatEther(
            response.totalCostInJuels
          )} LINK.Complete reponse: `,
          response
        );
      }

      const errorString = response.errorString;
      if (errorString) {
        console.log(`\n❌ Error during the execution: `, errorString);
      } else {
        const responseBytesHexstring = response.responseBytesHexstring;
        if (ethers.utils.arrayify(responseBytesHexstring).length > 0) {
          const decodedResponse = decodeResult(
            response.responseBytesHexstring,
            ReturnType.int256
          );
          console.log(
            `\n✅ Decoded response to ${ReturnType.int256}: `,
            decodedResponse
          );
        }
      }
    } catch (error) {
      console.error("Error listening for response:", error);
    }
  })();
};

makeRequestSepolia().catch((e) => {
  console.error(e);
  process.exit(1);
});
