import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import {
  CommitTransferBlockTransactionsRequest,
  CreateTransferBlockRequest,
} from './core/types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('transferblock/step1')
  async getFundingTransferBlockAddress(
    @Body() req: CreateTransferBlockRequest,
  ) {
    return this.appService.createTransferBlockFundingAddress(
      req.ticker,
      req.amount,
    );
  }

  @Post('transferblock/step2')
  async createTransferBlockCommitTransactions(
    @Body() req: CommitTransferBlockTransactionsRequest,
  ) {
    const createTxResult =
      await this.appService.createTransferBlockCommitTransaction(
        req.privateKeyHex,
        req.ticker,
        req.amount,
        req.recipient,
      );
    return createTxResult;
  }
}
