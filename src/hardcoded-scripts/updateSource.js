const fs = require("fs");
const path = require("path");

const ethers = require("ethers");
require("@chainlink/env-enc").config();

const updateSource = async () => {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey)
    throw new Error(
      "private key not provided - check your environment variables (request)"
    );

  const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;

  if (!rpcUrl)
    throw new Error(
      "rpcUrl not provided  - check your environment variables (request)"
    );

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const wallet = new ethers.Wallet(privateKey, provider);
  const signer = wallet.connect(provider); // create ethers signer for signing transactions

  const hardcodedStorageAbi = require("../../abi/HardcodeStorage.json");

  const contractAddress = "0x6d3bdeBE1dD53D067B5c6B04eA938A83154FCCD7";

  const source = fs
    .readFileSync(path.resolve(__dirname, "source.js"))
    .toString();

  const hardcodedStoradeContract = new ethers.Contract(
    contractAddress,
    hardcodedStorageAbi,
    signer
  );

  console.log(" Updating Source... ");

  const transaction = await hardcodedStoradeContract.updateSource(source);

  console.log(
    `\n✅ Functions request sent! Transaction hash ${transaction.hash}`
  );
};

updateSource().catch((e) => {
  console.error(e);
  process.exit(1);
});
