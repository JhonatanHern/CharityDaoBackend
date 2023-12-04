const ethers = require("ethers");
const { daoABI } = require("./eventsABI");
const storage = require("./storage");
const provider = require("./provider");
const removeDuplicated = require("./removeDuplicated");
const { fetchIPFSData } = require("./fetchIPFSData");

const maxBlocksPerRequest = 1000;

// This function is used to get the block number from which to start
// free providers have a limit of 1000 blocks per request
// so we need to make sure we don't go over that limit
// this function returns: [{start, end}, {start, end}, ...]
const getAllowedBlockNumbers = async (storedDate) => {
  if (process.env.IS_PAID_PROVIDER === "true") {
    // if we are using a paid provider, we can just return the stored date
    // because we don't have a limit
    console.log("Fetching events from the beginning of time");
    return [{ start: storedDate, end: undefined }];
  }
  const currentBlockNumber = await provider.getBlockNumber();
  if (storedDate === "earliest") {
    console.log("Fetching events from less than the last 1000 blocks");
    // there is little reason to go back more than 1000 blocks
    // if this is the first time we are running the script
    return [
      {
        start: currentBlockNumber - maxBlocksPerRequest,
        end: currentBlockNumber,
      },
    ];
  }

  if (currentBlockNumber - storedDate < maxBlocksPerRequest) {
    console.log("Fetching events from less than the last 1000 blocks");
    // ideal case - we are less than 1000 blocks behind
    return [{ start: storedDate, end: currentBlockNumber }];
  }
  // we are more than 1000 blocks behind so we need to make repeated requests
  // 1000 blocks at a time until we get to the current block number
  console.log("Fetching events from more than the last 1000 blocks");
  const allowedBlockNumbers = [];
  let blockCounter = storedDate;

  while (currentBlockNumber > blockCounter + maxBlocksPerRequest) {
    allowedBlockNumbers.push({
      start: blockCounter,
      end: blockCounter + maxBlocksPerRequest,
    });
    blockCounter += maxBlocksPerRequest;
  }

  // Add the stored date as the last block number
  allowedBlockNumbers.push({ start: blockCounter, end: currentBlockNumber });

  return allowedBlockNumbers;
};

const fetchEvents = async (storedDate) => {
  const allowedBlockNumbers = await getAllowedBlockNumbers(storedDate);
  const dao = new ethers.Contract(
    process.env.DAO_CONTRACT_ADDRESS,
    daoABI,
    provider
  );
  const result = [];
  for (const datePair of allowedBlockNumbers) {
    try {
      const currentBlockNumber = await provider.getBlockNumber();
      let events;
      if (datePair.end && currentBlockNumber < datePair.end) {
        console.log(
          `Fetching events from ${datePair.start} to now (${currentBlockNumber})`
        );
        events = await dao.queryFilter("*", datePair.start);
      } else {
        console.log(
          `Fetching events from ${datePair.start} to ${datePair.end}`
        );
        events = await dao.queryFilter("*", datePair.start, datePair.end);
      }
      result.push(...events);
    } catch (error) {
      console.log("Error fetching events: ", error);
    }
  }
  return result;
};

const syncEvents = async () => {
  const storedEvents = await storage.getEventList();
  const currentBlockNumber = await provider.getBlockNumber();

  const dao = new ethers.Contract(
    process.env.DAO_CONTRACT_ADDRESS,
    daoABI,
    provider
  );

  const newEvents = await fetchEvents(storedEvents.blockNumber);

  storedEvents.blockNumber = currentBlockNumber;
  for (const event of newEvents) {
    console.log(
      "Storing Event: ",
      event.fragment.name,
      " with args: ",
      event.args
    );
    const eventData = {
      proposalId: event.args[0] + "",
    };
    if (event.fragment.name === "ProposalCreated") {
      eventData.deadline = event.args[1].toString();
      eventData.minimumVotes = event.args[2].toString();
      eventData.proposedDonationAmount = event.args[3].toString();
      eventData.recipient = event.args[4].toString();

      const dataHash = await dao.dataHashes(eventData.proposalId);
      console.log("Data hash: ", dataHash);
      const storedProposal = storedEvents["proposalsCreated"].find(
        (e) => e.proposalId === eventData.proposalId
      );
      if (storedProposal && storedProposal.metadata) {
        console.log("Metadata already stored");
        eventData.metadata = storedProposal.metadata;
      } else {
        console.log("Fetching metadata from IPFS");
        eventData.metadata = dataHash
          ? await fetchIPFSData(dataHash)
          : undefined;
      }
      console.log("Metadata: ", eventData.metadata);

      storedEvents["proposalsCreated"].push(eventData);
    } else if (event.fragment.name === "ProposalExecuted") {
      storedEvents["proposalsExecuted"].push(eventData);
    } else if (event.fragment.name === "ProposalVoted") {
      eventData.voter = event.args[1].toString();
      eventData.inSupport = event.args[2].toString();
      storedEvents["proposalsVoted"].push(eventData);
    }
  }

  await storage.writeFileRaw(removeDuplicated(storedEvents));
};

module.exports = { syncEvents };
