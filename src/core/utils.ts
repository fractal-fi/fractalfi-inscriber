import * as _ from 'lodash';
import {
  IDomainContent,
  IInscriptionContent,
  IInscriptionOutput,
  IUtxoData,
  InscriptionTXConfig,
} from './types';
import ECPairFactory from 'ecpair';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ecc = require('tiny-secp256k1');

export class Utils {
  private Tx;
  private Script;
  private Tap;
  private Address;
  private CryptoUtils;
  private Signer;
  private ECPair;

  constructor(
    Tx: any,
    Script: any,
    Tap: any,
    Address: any,
    CryptoUtils: any,
    Signer: any,
  ) {
    this.Address = Address;
    this.Tap = Tap;
    this.Script = Script;
    this.Tx = Tx;
    this.CryptoUtils = CryptoUtils;
    this.Signer = Signer;
    this.ECPair = ECPairFactory(ecc);
  }

  public tokenToTransferBlock = (token: string, amount: string) => {
    return { p: 'brc-20', op: 'transfer', tick: token, amt: amount };
  };

  public tokenSend = (token: string, amount: string) => {
    return { p: 'brc-20', op: 'send', tick: token, amt: amount };
  };

  public hexToBytes = (hex: string) => {
    return Uint8Array.from(
      hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
    );
  };

  public getPrivateKey = () => {
    return this.ECPair.makeRandom().privateKey;
  };

}
