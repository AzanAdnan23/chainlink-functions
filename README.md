# Chainlink Functions Examples

This project is an example of a command-line interface (CLI) that uses the [functions-toolkit](https://github.com/smartcontractkit/functions-toolkit) to interact with Chainlink Functions.

## Installation

To set up the project, follow these steps:

1. Clone the repository.
   ```bash
   git clone https://github.com/AzanAdnan23/chainlink-functions.gits
   ```
2. Change directory.
   ```bash
   cd chainlink-functions
   ```
3. Install the required dependencies.

   ```bash
   npm install
   ```

4. We use [@chainlink/env-enc](https://www.npmjs.com/package/@chainlink/env-enc) package to encrypt environment variables at rest. Set the password to encrypt and decrypt the environment varilable file `.env.enc`:

   1. Set an encryption password for your environment variables.

   ```
      npx env-enc set-pw
   ```

   2. Run npx env-enc set to configure a .env.enc file with the basic variables that you need to send your requests to the Sepolia network.

   3. ETHEREUM_SEPOLIA_RPC_URL: Set a URL for the Sepolia testnet. You can sign up for a personal endpoint from Alchemy, Infura, or another node provider service.

   4. PRIVATE_KEY: Find the private key for your testnet wallet. If you use MetaMask, follow the instructions to Export a Private Key. Note: Your private key is needed to sign any transactions you make such as making requests.

   ```
   npx env-enc set
   ```

   Set the following variables:

   - PRIVATE_KEY
   - ETHEREUM_SEPOLIA_RPC_URL

5. Install Deno so you can compile and simulate your Functions source code on your local machine.

## Run

Start your server using the deno command:

```

deno run --allow-net server.ts

```

## To run the example:

1. Open the file request.js
2. Replace the consumer contract address and the subscription ID with your own values.

```
const consumerAddress = "0x8dFf78B7EE3128D00E90611FBeD20A71397064D9" // REPLACE this with your Functions consumer address
const subscriptionId = 3 // REPLACE this with your subscription ID

```

3. Make a request:

```
node src/scripts/reques.js
```
