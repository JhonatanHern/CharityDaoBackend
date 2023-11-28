// index.js
const express = require("express");
const app = express();
require("dotenv").config();

const { syncEvents } = require("./lib/syncEvents.js");
const { getEventList } = require("./lib/storage.js");

const SYNC_INTERVAL = 15000;

app.get("/serveEvents", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const data = await getEventList();
  res.json(data);
});

app.listen(8080, async () => {
  console.log("Server listening on port 8080");
  await syncEvents();
  console.log("Initial event synchronization complete");
  setInterval(async () => {
    await syncEvents();
    console.log("Event synchronization complete");
  }, SYNC_INTERVAL);
});
