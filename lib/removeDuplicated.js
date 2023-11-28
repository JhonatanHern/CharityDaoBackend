function removeDuplicatedByID(arr) {
  return [...new Map(arr.map((item) => [item["proposalId"], item])).values()];
}

function removeDuplicatedByIDAndVoter(arr) {
  return [
    ...new Map(
      arr.map((item) => [item["proposalId"] + item["voter"], item])
    ).values(),
  ];
}

module.exports = (events) => {
  return {
    blockNumber: events.blockNumber,
    proposalsCreated: removeDuplicatedByID(events.proposalsCreated),
    proposalsExecuted: removeDuplicatedByID(events.proposalsExecuted),
    proposalsVoted: removeDuplicatedByIDAndVoter(events.proposalsVoted),
  };
};
