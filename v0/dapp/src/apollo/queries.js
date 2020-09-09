import gql from "graphql-tag";

export const GET_STREAMS = gql`
  query ProxyStreams($owner: String!) {
    proxyStreams(first: 100, orderBy: timestamp, orderDirection: desc, where: { sender: $owner }) {
      id
      sender
      recipient
      stream {
        id
        sender
        recipient
        deposit
        cancellation {
          id
          recipientBalance
          recipientInterest
          senderBalance
          senderInterest
          sablierInterest
          timestamp
        }
        startTime
        stopTime
        ratePerSecond
        token {
          id
          decimals
          name
          symbol
        }
        txs {
          id
          block
          event
          timestamp
        }
        withdrawals {
          id
          amount
        }
        timestamp
      }
      timestamp
    }
  }
`;

export const GET_STREAM = gql`
  query ProxyStream($streamId: ID!) {
    proxyStream(id: $streamId) {
      id
      sender
      recipient
      stream {
        id
        sender
        recipient
        deposit
        cancellation {
          id
          recipientBalance
          recipientInterest
          senderBalance
          senderInterest
          sablierInterest
          timestamp
        }
        startTime
        stopTime
        ratePerSecond
        token {
          id
          decimals
          name
          symbol
        }
        txs {
          id
          block
          event
          timestamp
        }
        withdrawals {
          id
          amount
        }
        timestamp
      }
      timestamp
    }
  }
`;
