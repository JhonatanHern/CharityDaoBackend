const fetchIPFSData = async (hash) => {
  const url = `https://${process.env.PINATA_GATEWAY_ID}.mypinata.cloud/ipfs/${hash}`;
  // console.log("Fetching data from: ", url);
  const res = await fetch(url);
  const data = await res.json();
  // console.log("Data fetched: ", data);
  return data;
};

module.exports = { fetchIPFSData };
