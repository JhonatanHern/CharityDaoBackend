const eventsABI = [
  "event ProposalCreated(uint256 proposalId, uint256 deadline, uint256 minimumVotes, uint256 proposedDonationAmount, address recipient)",
  "event ProposalVoted(uint256 proposalId, address voter, bool inSupport)",
  "event ProposalExecuted(uint256 proposalId)",
];

module.exports = eventsABI;
