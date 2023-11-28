const fs = require("fs").promises;

const FILENAME = "events.json";

const readFile = async () => {
  // read the events.json file, parse it, and return the data
  let data;
  try {
    data = JSON.parse(await fs.readFile(FILENAME, "utf8"));
  } catch (error) {
    console.log("First file read");
    data = {
      blockNumber: "earliest",
      proposalsCreated: [],
      proposalsVoted: [],
      proposalsExecuted: [],
    };
  }
  return data;
};

const writeFile = async (data) => {
  // write the data to the events.json file
  await fs.writeFile(FILENAME, JSON.stringify(data, null, 2));
};

module.exports = {
  getLastUpdateBlock: async () => {
    const data = await readFile();
    return data.lastDate;
  },
  getEventList: async () => {
    const data = await readFile();
    return data;
  },
  writeEvent: async (eventType, event, eventBlockNumber) => {
    const data = await readFile();
    // write the data to the events.json file
    data[eventType].push(event);
    data.blockNumber = eventBlockNumber;
    await writeFile(data);
  },
  writeFileRaw: async (data) => {
    await writeFile(data);
  },
};
