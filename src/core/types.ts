import { ApiProperty } from "@nestjs/swagger";

export interface IDomainContent {
  p: string;
  op: string;
  name: string;
}

export interface IInscriptionContent {
  name: string;
  hex: string;
  mimetype: string;
}

export interface InscriptionTXConfig {
  padding: number;
  satsPerByte: number;
}

export interface IUtxoData {
  txid: string;
  vout: number;
  amount: number;
}

export interface IInscriptionOutput {
  leaf: any;
  tapKey: any;
  controlBlock: any;
  inscriptionAddress: any;
  txSize: number;
  fee: number;
  script: any[];
}

export class CommitTransferBlockTransactionsRequest {
  @ApiProperty()
  privateKeyHex: string;

  @ApiProperty()
  ticker: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  recipient: string;
}

export class CreateTransferBlockRequest {
  @ApiProperty()
  ticker: string;

  @ApiProperty()
  amount: number;

}