/* eslint-disable no-case-declarations */
import dayjs from "dayjs";

import { BigNumber as BN } from "bignumber.js";
import { toChecksumAddress } from "web3-utils";

import StreamFlow from "./stream/flow";
import StreamStatus from "./stream/status";

import { MAINNET_BLOCK_TIME_AVERAGE } from "../constants/time";
import { formatDuration, formatTime, roundToDecimalPoints } from "../helpers/format-utils";
import { getEtherscanTransactionLink } from "../helpers/web3-utils";
import { getUnitValue } from "../helpers/token-utils";
import { roundTimeAroundHour } from "../helpers/time-utils";

export const initialState = {
  flow: "",
  from: "",
  funds: {
    deposit: 0,
    paid: 0,
    ratio: 0,
    remaining: 0,
    withdrawable: 0,
    withdrawn: 0,
  },
  link: "",
  rate: "",
  rawStreamId: "",
  redemption: null,
  startTime: "",
  status: "",
  stopTime: "",
  to: "",
  token: {
    address: "",
    symbol: "",
  },
};

/**
 * Class to handle actions related to streams stored in the subgraph
 */
export class Parser {
  constructor(proxyStream, account, block, translations) {
    this.account = toChecksumAddress(account);
    this.block = block;
    this.translations = translations;

    // See the following
    // - https://stackoverflow.com/questions/13104494/does-javascript-pass-by-reference
    // eslint-disable-next-line max-len
    // - https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript/5344074#5344074
    this.proxyStream = JSON.parse(JSON.stringify(proxyStream));
    this.proxyStream.stream.ratePerSecond = new BN(proxyStream.stream.ratePerSecond);
    this.proxyStream.stream.deposit = new BN(proxyStream.stream.deposit);
    this.proxyStream.stream.recipient = toChecksumAddress(proxyStream.stream.recipient);
    this.proxyStream.stream.sender = toChecksumAddress(proxyStream.stream.sender);
    this.proxyStream.stream.startTime = new BN(proxyStream.stream.startTime);
    this.proxyStream.stream.stopTime = new BN(proxyStream.stream.stopTime);

    this.flow = this.account === this.proxyStream.stream.recipient ? StreamFlow.IN.name:StreamFlow.OUT.name;

    // Highly important function, but also really tricky. In the subgraph, it is not possible to continuously
    // update the status based on the current block number (smart contracts cannot act like cron jobs).
    // Therefore, it is up to the client to compute the status based on the current block number.
    const currTime = new BN(Math.round((new Date()).getTime() / 1000))
    let status = StreamStatus.UNDEFINED.name;
    // if (!stream.rawStream.redemption) {
    if (!proxyStream.stream.cancellation) {
      // if (block.number.isLessThan(this.stream.rawStream.startBlock)) {
      if (currTime.isLessThan(this.proxyStream.stream.startTime)) {
        status = StreamStatus.CREATED.name;
      // } else if (
      //   block.number.isGreaterThanOrEqualTo(this.stream.rawStream.startBlock) &&
      //   block.number.isLessThanOrEqualTo(this.stream.rawStream.stopBlock)
      // ) {
      } else if (
        currTime.isGreaterThanOrEqualTo(this.proxyStream.stream.startTime) &&
        currTime.isLessThanOrEqualTo(this.proxyStream.stream.stopTime)
      ) {
        status = StreamStatus.ACTIVE.name;
      } else {
        status = StreamStatus.ENDED.name;
      }
    } else {
      // Humans would arguably understand better the concept of a stream being "Ended" when
      // that stream has successfully paid the recipient all the funds deposited initially.
      // eslint-disable-next-line no-lonely-if
      // TODO:
      // if (stream.rawStream.redemption.senderAmount === 0) {
      if (new BN(proxyStream.stream.cancellation.senderBalance).isEqualTo(new BN(0))) {
        status = StreamStatus.ENDED.name;
      } else {
        status = StreamStatus.REDEEMED.name;
      }
    }
    this.proxyStream.stream.status = status;
  }

  static getMinutesForBlockDelta(blockDelta) {
    const seconds = Parser.getSecondsForBlockDelta(blockDelta);
    return BN(seconds.dividedBy(BN(60)).toFixed(0));
  }

  static getSecondsForBlockDelta(blockDelta) {
    return blockDelta.multipliedBy(MAINNET_BLOCK_TIME_AVERAGE);
  }

  static getTimeForBlockDelta(blockDelta, forPast = true) {
    const seconds = Parser.getSecondsForBlockDelta(blockDelta);
    let time = dayjs();
    if (forPast) {
      time = time.subtract(seconds, "second");
    } else {
      time = time.add(seconds, "second");
    }
    return roundTimeAroundHour(time);
  }

  parseAddresses() {
    const { proxyStream, flow, translations } = this;
    // const { flow, rawStream } = proxyStream;
    const { stream } = proxyStream;
    const { recipient, sender } = stream;

    if (flow === StreamFlow.IN.name) {
      return {
        from: {
          long: sender,
          short: `${sender.substring(0, 6)}...${sender.substring(38)}`,
        },
        to: {
          long: translations("you"),
          short: translations("you"),
        },
      };
    }

    if (flow === StreamFlow.OUT.name) {
      return {
        from: {
          long: translations("you"),
          short: translations("you"),
        },
        to: {
          long: recipient,
          short: `${recipient.substring(0, 6)}...${recipient.substring(38)}`,
        },
      };
    }

    return {
      from: {
        long: "",
        short: "",
      },
      to: {
        long: "",
        short: "",
      },
    };
  }

  parseFunds() {
    const { proxyStream, /*block*/ } = this;
    const { stream } = proxyStream;
    // const { interval, payment, startBlock, stopBlock, token, withdrawals } = stream;
    const { ratePerSecond, deposit, startTime, stopTime, token, withdrawals } = stream;

    const currTime = new BN(Math.round((new Date()).getTime() / 1000))

    // const totalBlockDeltaBN = stopTime.minus(startTime);
    // const depositBN = totalBlockDeltaBN.dividedBy(interval).multipliedBy(payment);

    const streamTime = stopTime - startTime;
    // const amountBN = (new BN(deposit)).multipliedBy(10 ** token.decimals);
    const depositBN = deposit.minus(deposit.mod(new BN(streamTime)));
    // console.log('depositBN', depositBN.toString())
    // const depositBN = totalBlockDeltaBN.multipliedBy(ratePerSecond);
    const depositValue = getUnitValue(depositBN, token.decimals);

    let blockDeltaBN;
    switch (stream.status) {
      case StreamStatus.ACTIVE.name:
        // blockDeltaBN = block.number.minus(startBlock);
        blockDeltaBN = currTime.minus(startTime);
        // const modulusBN = blockDeltaBN.modulo(interval);
        // blockDeltaBN = blockDeltaBN.minus(modulusBN);
        break;
      case StreamStatus.REDEEMED.name:
        // const redemptionBlockNumber = rawStream.txs[rawStream.txs.length - 1].block;
        const redemptionBlockNumber = stream.txs[0].timestamp;
        const redemptionBlockNumberBN = new BN(redemptionBlockNumber);
        // if (redemptionBlockNumberBN.isLessThanOrEqualTo(startBlock)) {
        if (redemptionBlockNumberBN.isLessThanOrEqualTo(startTime)) {
          blockDeltaBN = new BN(0);
        } else {
          // blockDeltaBN = redemptionBlockNumberBN.minus(startBlock);
          blockDeltaBN = redemptionBlockNumberBN.minus(startTime);
        }
        break;
      case StreamStatus.ENDED.name:
        // blockDeltaBN = stopBlock.minus(startBlock);
        blockDeltaBN = stopTime.minus(startTime);
        break;
      default:
        return {
          deposit: depositValue,
          paid: 0,
          ratio: 0,
          remaining: depositValue,
          withdrawable: 0,
          withdrawn: 0,
        };
    }

    // const paidBN = blockDeltaBN.dividedBy(interval).multipliedBy(payment);
    // const paidBN = blockDeltaBN.dividedBy(ratePerSecond).multipliedBy(deposit);
    const paidSoFar = blockDeltaBN.multipliedBy(ratePerSecond);
    const paidBN = paidSoFar.minus(paidSoFar.mod(blockDeltaBN)) || new BN(0);
    // console.log('paidBN', paidBN.toString())
    // const paidBN = blockDeltaBN.multipliedBy(ratePerSecond);
    const paidValue = getUnitValue(paidBN, token.decimals);
    const remainingBN = depositBN.minus(paidBN);
    const remainingValue = getUnitValue(remainingBN, token.decimals);

    const ratioBN = paidBN.dividedBy(depositBN).multipliedBy(new BN(100));
    // console.log('ratioBN', ratioBN.toString())
    const ratioValue = roundToDecimalPoints(ratioBN.toNumber(), 2);

    let withdrawnBN = new BN(0);
    withdrawals.forEach(withdrawal => {
      withdrawnBN = withdrawnBN.plus(new BN(withdrawal.amount));
    });
    const withdrawnValue = getUnitValue(withdrawnBN, token.decimals);
    // console.log('withdrawnValue', withdrawnValue)

    const withdrawableBN = paidBN.minus(withdrawnBN);
    const withdrawableValue = getUnitValue(withdrawableBN, token.decimals);

    return {
      deposit: depositValue,
      paid: paidValue,
      ratio: ratioValue,
      remaining: remainingValue,
      withdrawable: withdrawableValue,
      withdrawn: withdrawnValue,
    };
  }

  parseRate() {
    const { proxyStream, translations } = this;
    const { stream } = proxyStream;

    // // TODO: use the Etherscan API to calculate time and be loose with off-by-one errors.
    // // At the moment, the string interval won't be resolved lest the MAINNET_BLOCK_TIME_AVERAGE is
    // // 15 seconds.
    // const paymentBN = new BN(rawStream.payment);
    // const payment = getUnitValue(paymentBN, rawStream.token.decimals);
    const paymentBN = new BN(stream.deposit);
    const payment = getUnitValue(paymentBN, stream.token.decimals);
    // const minutes = Parser.getMinutesForBlockDelta(rawStream.interval);
    const minutes = BN(stream.stopTime.minus(stream.startTime).dividedBy(BN(60)).toFixed(0));

    const formattedInterval = formatDuration(translations, minutes)
      .replace(`1 ${translations("month")}`, translations("month"))
      .replace(`1 ${translations("day")}`, translations("day"))
      .replace(`1 ${translations("hour")}`, translations("hour"))
      .replace(`1 ${translations("min")}`, translations("min"));
    // return `${payment} ${rawStream.token.symbol}/ ${formattedInterval.toLowerCase()}`;
    return `${Math.round(payment)} ${stream.token.symbol}/ ${formattedInterval.toLowerCase()}`;
  }

  parseRedemption() {
    const { proxyStream, translations } = this;
    const { stream } = proxyStream;

    if (stream.status !== StreamStatus.REDEEMED.name) {
      return {};
    }

    const { timestamp } = stream.txs[stream.txs.length - 1];
    const redemptionTime = formatTime(translations, dayjs.unix(timestamp));

    return {
      // ...rawStream.redemption,
      ...stream.cancellation,
      time: redemptionTime,
    };
  }

  parseTimes() {
    // const { stream, block, translations } = this;
    const { proxyStream, /*block,*/ translations } = this;
    // const { rawStream } = stream;
    const { stream } = proxyStream;
    // const { startBlock, stopBlock } = rawStream;
    const { startTime, stopTime } = stream;

    // const blockNumberBN = new BN(block.number);
    // const intervalInMinutes = Parser.getMinutesForBlockDelta(rawStream.interval);
    const intervalInMinutes = BN(stream.stopTime.minus(stream.startTime).dividedBy(BN(60)).toFixed(0));
    // let startTime;
    // let stopTime;

    // // Not using the `status` here because start and stop times are independent of it
    // // Before the start of the stream
    // if (block.number.isLessThanOrEqualTo(startBlock)) {
    //   const startBlockDelta = startBlock.minus(block.number);
    //   const startDate = Parser.getTimeForBlockDelta(startBlockDelta, false);
    //   startTime = formatTime(translations, startDate, { minimumInterval: intervalInMinutes, prettyPrint: true });

    //   const stopBlockDelta = stopBlock.minus(block.number);
    //   const stopDate = Parser.getTimeForBlockDelta(stopBlockDelta, false);
    //   stopTime = formatTime(translations, stopDate, { minimumInterval: intervalInMinutes, prettyPrint: true });
    // }
    // // During the stream
    // else if (block.number.isLessThanOrEqualTo(stopBlock)) {
    //   const startBlockDelta = blockNumberBN.minus(startBlock);
    //   const startMinutes = Parser.getMinutesForBlockDelta(startBlockDelta);
    //   const startDuration = formatDuration(translations, startMinutes, intervalInMinutes).toLowerCase();
    //   startTime = `${startDuration} ${translations("ago").toLowerCase()}`;

    //   const stopBlockDelta = stopBlock.minus(block.number);
    //   const stopMinutes = Parser.getMinutesForBlockDelta(stopBlockDelta);
    //   const stopDuration = formatDuration(translations, stopMinutes, intervalInMinutes).toLowerCase();
    //   stopTime = `${stopDuration} ${translations("left").toLowerCase()}`;
    // }
    // // After the end of the stream
    // else {
    //   const startBlockDelta = blockNumberBN.minus(startBlock);
    //   const startDate = Parser.getTimeForBlockDelta(startBlockDelta, true);
    //   startTime = formatTime(translations, startDate, { minimumInterval: intervalInMinutes, prettyPrint: true });

    //   const stopBlockDelta = blockNumberBN.minus(stopBlock);
    //   const stopDate = Parser.getTimeForBlockDelta(stopBlockDelta, true);
    //   stopTime = formatTime(translations, stopDate, { minimumInterval: intervalInMinutes, prettyPrint: true });
    // }

    const startDate = dayjs(new Date(startTime.multipliedBy(1000).toNumber()));
    const stopDate = dayjs(new Date(stopTime.multipliedBy(1000).toNumber()));
    const startTime_ = formatTime(translations, startDate, { minimumInterval: intervalInMinutes, prettyPrint: true });
    const stopTime_ = formatTime(translations, stopDate, { minimumInterval: intervalInMinutes, prettyPrint: true });

    return { startTime: startTime_, stopTime: stopTime_ };
  }

  parse() {
    const { proxyStream, flow } = this;
    // const { flow, rawStream } = stream;
    const { id, stream } = proxyStream;
    const { status, token, txs } = stream;

    const funds = this.parseFunds();
    const { from, to } = this.parseAddresses();
    const link = getEtherscanTransactionLink(txs[0].id);
    const rate = this.parseRate();
    const redemption = this.parseRedemption();
    const { startTime, stopTime } = this.parseTimes();
    const tokenAddress = toChecksumAddress(token.id);

    return {
      flow: flow.toUpperCase(),
      from,
      funds,
      link,
      rate,
      rawStreamId: id,
      redemption,
      to,
      startTime,
      status,
      stopTime,
      token: {
        address: tokenAddress,
        decimals: token.decimals,
        symbol: token.symbol,
      },
    };
  }
}
