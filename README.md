# Charity DAO backend

This server monitors the blockchain to get events from the CharityDao smart contract and serves them in a http endpoint

### Config file:

A JSON file structured in the following manner:

```
{
  blockNumber: number | string,
  proposalsCreated: event[],
  proposalsVoted: event[],
  proposalsExecuted: event[],
}
```
