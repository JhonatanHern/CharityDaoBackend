const ethers = require("ethers");

module.exports = new ethers.JsonRpcProvider(process.env.RPC_URL);
