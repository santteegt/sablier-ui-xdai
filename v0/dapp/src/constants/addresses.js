export const MAINNET = {
  tokenAddresses: {
    addresses: [
      ["DAI", "0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359"],
      ["GUSD", "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd"],
      ["USDC", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
    ],
  },
  tokenAddressesToSymbols: {
    "0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359": "DAI",
    "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd": "GUSD",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "USDC",
  },
  sablierAddress: "0xA4fc358455Febe425536fd1878bE67FfDBDEC59a",
  payrollAddress: "0xbd6a40Bb904aEa5a49c59050B5395f7484A4203d",
};

export const RINKEBY = {
  tokenAddresses: {
    addresses: [["DAI", "0x8ad3aA5d5ff084307d28C8f514D7a193B2Bfe725"]],
  },
  tokenAddressesToSymbols: {
    "0x8ad3aA5d5ff084307d28C8f514D7a193B2Bfe725": "DAI",
  },
  sablierAddress: "	0xc04Ad234E01327b24a831e3718DBFcbE245904CC",
  payrollAddress: "0x7ee114C3628Ca90119fC699f03665bF9dB8f5faF",
};

export const LOCAL = {
  tokenAddresses: {
    addresses: [["DAI", "0x0bd20370cE2d8Da4e2471a90caE794CD7BeFc57a"]],
  },
  tokenAddressesToSymbols: {
    "0x0bd20370cE2d8Da4e2471a90caE794CD7BeFc57a": "DAI",
  },
  sablierAddress: "0x62Df148cA261814F673033E71c0d9F2a66ab4B8e",
  payrollAddress: "0x44eCf0aF8f8d20DA30f42B44799a762F5edd5B85",
};

export const XDAI = {
  tokenAddresses: {
    addresses: [
      ["wxDAI", "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d"],
      ["DAI", "0x44fA8E6f47987339850636F88629646662444217"],
      ["POA20", "0x985e144EB355273c4B4D51E448B68b657F482E26"],
      ["USDC", "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83"],
    ]
  },
  tokenAddressesToSymbols: {
    "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d": "wxDAI",
    "0x44fA8E6f47987339850636F88629646662444217": "DAI",
    "0x985e144EB355273c4B4D51E448B68b657F482E26": "POA20",
    "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83": "USDC",
  },
  sablierAddress: "0xE0F33E95aF46EAd1Fe181d2A74919bff903cD5d4",
  payrollAddress: "0xF8E5E3b80393AeF6a3Fb9C3DbA24ec4233A477De",
};

// export const ACCEPTED_TOKENS = ["DAI", "GUSD", "USDC"];
// Other networks
// export const ACCEPTED_TOKENS = ["DAI"];
// export const DEFAULT_TOKEN_SYMBOL = "DAI";
// xDAI
export const ACCEPTED_TOKENS = ["wxDAI", "DAI", "POA20", "USDC"];
export const DEFAULT_TOKEN_SYMBOL = "wxDAI";
