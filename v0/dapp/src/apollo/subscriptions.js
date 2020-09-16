/* eslint-disable import/prefer-default-export */
import gql from "graphql-tag";

export const GET_LAST_RAW_STREAM = gql`
  subscription LastProxyStream($timestamp: BigInt!, $sender: String!) {
    proxyStreams(first: 1, where: { sender: $sender, timestamp_gte: $timestamp }) {
      id
      timestamp
    }
  }
`;
