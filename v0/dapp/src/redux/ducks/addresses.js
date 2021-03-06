import HoneyTokens from "honeyswap-default-token-list";
import { MAINNET, RINKEBY, LOCAL, XDAI } from "../../constants/addresses";

const SET_ADDRESSES = "app/addresses/setAddresses";

const initialState = MAINNET;

export const setAddresses = networkId => {
  switch (networkId) {
    // Main Net
    case 1:
    case "1":
      return {
        type: SET_ADDRESSES,
        payload: MAINNET,
      };
    // Rinkeby
    case 4:
    case "4":
      return {
        type: SET_ADDRESSES,
        payload: RINKEBY,
      };
    // xDAI
    case 100:
    case "100": {
      let tokens = HoneyTokens.tokens.filter(token => token.chainId === 100 && token.symbol !== 'WXDAI');
      XDAI.tokenAddresses.addresses.push(...tokens.map(token => [token.symbol, token.address, token.logoURI]));
      XDAI.tokenAddressesToSymbols = Object.assign(XDAI.tokenAddressesToSymbols, ...tokens.map(token => {
        const addToSymbol = {};
        addToSymbol[token.address] = token.symbol;
        return addToSymbol;
      }))
      return {
        type: SET_ADDRESSES,
        payload: XDAI,
      };
    }
    // Local
    case 8995:
    case "8995":
      return {
        type: SET_ADDRESSES,
        payload: LOCAL,
      };
    default:
      return {
        type: SET_ADDRESSES,
        payload: MAINNET,
      };
  }
};

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case SET_ADDRESSES:
      return payload;
    default:
      return state;
  }
};
