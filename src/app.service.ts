import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IUtxoData } from './core/types';
import { Utils } from './core/utils';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private Tx;
  private Script;
  private Tap;
  private Address;
  private CryptoUtils;
  private Signer;
  private Buff;
  private Utils;
  private _unisatApiKey;

  constructor(
    private readonly _httpService: HttpService,
    private readonly _configService: ConfigService,
  ) {
    this._unisatApiKey = this._configService.get<string>('UNISAT_API_KEY');
    this.loadUtils();
  }

  async loadUtils() {
    const { Tx, Script, Tap, Address, Signer } = await import(
      '@cmdcode/tapscript'
    );
    const CryptoUtils = await import('@cmdcode/crypto-utils');
    const _Buff = await import('@cmdcode/buff-utils');
    this.Tx = Tx;
    this.Script = Script;
    this.Tap = Tap;
    this.Address = Address;
    this.CryptoUtils = CryptoUtils;
    this.Signer = Signer;
    this.Buff = _Buff.Buff;
    this.Utils = new Utils(
      this.Tx,
      this.Script,
      this.Tap,
      this.Address,
      this.CryptoUtils,
      this.Signer,
    );
  }


  async createTransferBlockCommitTransaction(
    pkHex: string,
    ticker: string,
    amount: string,
    recipient: string,
  ) {
    const pk = Buffer.from(pkHex, 'hex');

    const secretKey = new this.CryptoUtils.SecretKey(pk, { type: 'taproot' });
    const pubkey = secretKey.pub;

    const mimetype = `application/json`;
    const content = this.Utils.tokenToTransferBlock(ticker, amount);
    const encodedContent = Buffer.from(JSON.stringify(content));

    const script = [
      pubkey,
      'OP_CHECKSIG',
      'OP_0',
      'OP_IF',
      this.Buff.encode('ord'),
      '01',
      this.Buff.encode(mimetype),
      'OP_0',
      encodedContent,
      'OP_ENDIF',
    ];
    const tapleaf = this.Tap.encodeScript(script);
    const [tpubkey, cblock] = this.Tap.getPubKey(pubkey, { target: tapleaf });
    const address = this.Address.p2tr.fromPubKey(tpubkey, 'main');
    const utxo = await this.getIncomingUtxo(address);
    if (!utxo) {
      throw new Error('No UTXO found');
    }

    const txData = this.Tx.create({
      vin: [
        {
          txid: utxo.txid,
          vout: 0,
          prevout: {
            value: utxo.amount,
            scriptPubKey: ['OP_1', tpubkey],
          },
        },
      ],
      vout: [
        {
          value: utxo.amount - 4500,
          scriptPubKey: this.Address.toScriptPubKey(recipient),
        },
      ],
    });

    const sig = this.Signer.taproot.sign(secretKey, txData, 0, {
      extension: tapleaf,
    });

    txData.vin[0].witness = [sig, script, cblock];

    const txHex = this.Tx.encode(txData).hex;
    
    return {
      hex: txHex,
    };
  }

  async createTransferBlockFundingAddress(ticker: string, amount: number) {
    const pk = this.Utils.getPrivateKey();
    const pkHex = pk.toString('hex');

    const secretKey = new this.CryptoUtils.SecretKey(pk, { type: 'taproot' });
    const pubkey = secretKey.pub;

    const mimetype = `application/json`;
    const content = this.Utils.tokenToTransferBlock(ticker, amount);
    const encodedContent = Buffer.from(JSON.stringify(content));

    const script = [
      pubkey,
      'OP_CHECKSIG',
      'OP_0',
      'OP_IF',
      this.Buff.encode('ord'),
      '01',
      this.Buff.encode(mimetype),
      'OP_0',
      encodedContent,
      'OP_ENDIF',
    ];
    const tapleaf = this.Tap.encodeScript(script);
    const [tpubkey, cblock] = this.Tap.getPubKey(pubkey, { target: tapleaf });
    const address = this.Address.p2tr.fromPubKey(tpubkey, 'main');
    return {
      address,
      pkHex,
      tapleaf,
      cblock,
      ticker,
      amount,
    };
  }

  async getIncomingUtxo(address: string): Promise<IUtxoData> {
    const url = `https://open-api-fractal-testnet.unisat.io/v1/indexer/address/${address}/utxo-data?cursor=0&size=16`;
    const { data } = await this._httpService.get(url, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this._unisatApiKey}`,
    },
    }).toPromise();
    if (data && data.data && data.data.length) {
      const txId = data.data.utxo[0].txid;
      const outsUrl = `https://open-api-fractal-testnet.unisat.io/v1/indexer/tx/${txId}/outs`;

      const outsResponse = await this._httpService.get(url, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${this._unisatApiKey}`,
      },
      }).toPromise();

      const outsData = outsResponse.data;
      for (let i = 0; i < outsResponse.data.length; i++) {
        const output = outsResponse.data[i];
        if (output.address === address) {
          return {
            txid: txId,
            vout: i,
            amount: output.satoshi,
          };
        }
      }
    }
    return null;
  }
}
