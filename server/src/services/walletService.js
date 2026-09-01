const mongoose = require("mongoose");

const Wallet =
  require("../models/Wallet");

const Transaction =
  require("../models/Transaction");

const generateTransactionId =
  require("../utils/transactionIdGenerator");


class WalletService {

  /*
  |--------------------------------------------------------------------------
  | CREDIT
  |--------------------------------------------------------------------------
  */

  async credit(
    userId,
    amount,
    type,
    remark = "",
    options = {}
  ) {

    const numericAmount =
      Number(amount);


    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      throw new Error(
        "Invalid credit amount."
      );
    }


    /*
     * If caller already provides a
     * MongoDB session, use it.
     */

    const externalSession =
      options?.session || null;


    const session =
      externalSession ||
      await mongoose.startSession();


    const shouldEndSession =
      !externalSession;


    try {

      if (
        shouldEndSession
      ) {

        session.startTransaction();

      }


      /*
       * ==========================================
       * GET WALLET
       * ==========================================
       */

      const wallet =
        await Wallet.findOne({
          user: userId,
        }).session(
          session
        );


      if (!wallet) {

        throw new Error(
          "Wallet not found"
        );

      }


      const previousBalance =
        Number(
          wallet.balance || 0
        );


      const currentBalance =
        previousBalance +
        numericAmount;


      /*
       * ==========================================
       * UPDATE WALLET
       * ==========================================
       */

      wallet.balance =
        currentBalance;


      /*
       * Deposit statistics.
       */

      if (
        type === "deposit"
      ) {

        wallet.totalDeposit +=
          numericAmount;

      }


      /*
       * Winning statistics.
       */

      if (
        type === "win"
      ) {

        wallet.totalWin +=
          numericAmount;

        wallet.winningBalance +=
          numericAmount;

      }


      await wallet.save({
        session,
      });


      /*
       * ==========================================
       * CREATE TRANSACTION
       * ==========================================
       */

      const transactionId =
        generateTransactionId();


      const transaction =
        await Transaction.create(
          [
            {
              transactionId,

              user:
                userId,

              wallet:
                wallet._id,

              ...(options?.payoutId
                ? {
                  payout:
                    options.payoutId,
                }
                : {}),

              type,

              amount:
                numericAmount,

              previousBalance,

              currentBalance,

              status:
                "success",

              remark,

            },
          ],
          {
            session,
          }
        );


      /*
       * ==========================================
       * COMMIT
       * ==========================================
       */

      if (
        shouldEndSession
      ) {

        await session.commitTransaction();

      }


      return {

        wallet,

        transaction:
          transaction[0],

        transactionId,

        previousBalance,

        currentBalance,

      };


    } catch (error) {

      if (
        shouldEndSession
      ) {

        await session.abortTransaction();

      }


      throw error;


    } finally {

      if (
        shouldEndSession
      ) {

        await session.endSession();

      }

    }

  }


  /*
  |--------------------------------------------------------------------------
  | DEBIT
  |--------------------------------------------------------------------------
  */

  async debit(
    userId,
    amount,
    type,
    remark = "",
    options = {}
  ) {

    const numericAmount =
      Number(amount);


    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {

      throw new Error(
        "Invalid debit amount."
      );

    }


    const externalSession =
      options?.session || null;


    const session =
      externalSession ||
      await mongoose.startSession();


    const shouldEndSession =
      !externalSession;


    try {

      if (
        shouldEndSession
      ) {

        session.startTransaction();

      }


      /*
       * ==========================================
       * GET WALLET
       * ==========================================
       */

      const wallet =
        await Wallet.findOne({
          user: userId,
        }).session(
          session
        );


      if (!wallet) {

        throw new Error(
          "Wallet not found"
        );

      }


      const previousBalance =
        Number(
          wallet.balance || 0
        );


      /*
       * ==========================================
       * BALANCE PROTECTION
       * ==========================================
       */

      if (
        previousBalance <
        numericAmount
      ) {

        throw new Error(
          "Insufficient Balance"
        );

      }


      const currentBalance =
        previousBalance -
        numericAmount;


      /*
       * ==========================================
       * UPDATE WALLET
       * ==========================================
       */

      wallet.balance =
        currentBalance;


      if (
        type === "withdraw"
      ) {

        wallet.totalWithdraw +=
          numericAmount;

      }


      if (
        type === "bet"
      ) {

        wallet.totalBet +=
          numericAmount;

      }


      await wallet.save({
        session,
      });


      /*
       * ==========================================
       * CREATE TRANSACTION
       * ==========================================
       */

      const transactionId =
        generateTransactionId();


      const transaction =
        await Transaction.create(
          [
            {
              transactionId,

              user:
                userId,

              wallet:
                wallet._id,

              ...(options?.payoutId
                ? {
                  payout:
                    options.payoutId,
                }
                : {}),

              type,

              amount:
                numericAmount,

              previousBalance,

              currentBalance,

              status:
                "success",

              remark,

            },
          ],
          {
            session,
          }
        );


      /*
       * ==========================================
       * COMMIT
       * ==========================================
       */

      if (
        shouldEndSession
      ) {

        await session.commitTransaction();

      }


      return {

        wallet,

        transaction:
          transaction[0],

        transactionId,

        previousBalance,

        currentBalance,

      };


    } catch (error) {

      if (
        shouldEndSession
      ) {

        await session.abortTransaction();

      }


      throw error;


    } finally {

      if (
        shouldEndSession
      ) {

        await session.endSession();

      }

    }

  }


  /*
  |--------------------------------------------------------------------------
  | REVERSE PAYOUT
  |--------------------------------------------------------------------------
  */

  async reversePayout(
    userId,
    amount,
    payoutId,
    remark = "",
    options = {}
  ) {

    const numericAmount =
      Number(amount);


    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {

      throw new Error(
        "Invalid reversal amount."
      );

    }


    if (!payoutId) {

      throw new Error(
        "Payout ID is required."
      );

    }


    /*
     * If caller already provides a
     * MongoDB session, use it.
     */

    const externalSession =
      options?.session || null;


    const session =
      externalSession ||
      await mongoose.startSession();


    const shouldEndSession =
      !externalSession;


    try {

      if (
        shouldEndSession
      ) {

        session.startTransaction();

      }


      /*
       * ==========================================
       * IDEMPOTENCY CHECK
       * ==========================================
       *
       * If this payout already has a
       * reversal transaction, don't debit again.
       */

      const existingReversal =
        await Transaction.findOne({

          payout:
            payoutId,

          type:
            "payout_reverse",

        }).session(
          session
        );


      if (
        existingReversal
      ) {

        const existingWallet =
          await Wallet.findOne({
            user:
              userId,
          }).session(
            session
          );


        if (!existingWallet) {

          throw new Error(
            "Wallet not found."
          );

        }


        if (
          shouldEndSession
        ) {

          await session.commitTransaction();

        }


        return {

          wallet:
            existingWallet,

          transaction:
            existingReversal,

          transactionId:
            existingReversal.transactionId,

          alreadyReversed:
            true,

        };

      }


      /*
       * ==========================================
       * GET WALLET
       * ==========================================
       */

      const wallet =
        await Wallet.findOne({
          user:
            userId,
        }).session(
          session
        );


      if (!wallet) {

        throw new Error(
          "Wallet not found."
        );

      }


      /*
       * ==========================================
       * BALANCE CHECK
       * ==========================================
       */

      const previousBalance =
        Number(
          wallet.balance || 0
        );


      if (
        previousBalance <
        numericAmount
      ) {

        throw new Error(
          "Insufficient wallet balance for payout reversal."
        );

      }


      /*
       * ==========================================
       * WINNING BALANCE CHECK
       * ==========================================
       */

      const previousWinningBalance =
        Number(
          wallet.winningBalance || 0
        );


      if (
        previousWinningBalance <
        numericAmount
      ) {

        throw new Error(
          "Insufficient winning balance for payout reversal."
        );

      }


      /*
       * ==========================================
       * CURRENT BALANCES
       * ==========================================
       */

      const currentBalance =
        previousBalance -
        numericAmount;


      const currentWinningBalance =
        previousWinningBalance -
        numericAmount;


      /*
       * ==========================================
       * UPDATE WALLET
       * ==========================================
       */

      wallet.balance =
        currentBalance;


      wallet.winningBalance =
        currentWinningBalance;


      wallet.totalWin =
        Math.max(

          Number(
            wallet.totalWin || 0
          ) -
          numericAmount,

          0

        );


      await wallet.save({
        session,
      });


      /*
       * ==========================================
       * CREATE REVERSAL TRANSACTION
       * ==========================================
       */

      const transactionId =
        generateTransactionId();


      const transaction =
        await Transaction.create(
          [
            {
              transactionId,

              user:
                userId,

              wallet:
                wallet._id,

              payout:
                payoutId,

              type:
                "payout_reverse",

              amount:
                numericAmount,

              previousBalance,

              currentBalance,

              status:
                "success",

              remark:
                remark ||
                "Payout Reversal",

            },
          ],
          {
            session,
          }
        );


      /*
       * ==========================================
       * COMMIT
       * ==========================================
       */

      if (
        shouldEndSession
      ) {

        await session.commitTransaction();

      }


      return {

        wallet,

        transaction:
          transaction[0],

        transactionId,

        previousBalance,

        currentBalance,

        alreadyReversed:
          false,

      };


    } catch (error) {

      if (
        shouldEndSession
      ) {

        await session.abortTransaction();

      }


      throw error;


    } finally {

      if (
        shouldEndSession
      ) {

        await session.endSession();

      }

    }

  }


  /*
  |--------------------------------------------------------------------------
  | REFUND PAYOUT
  |--------------------------------------------------------------------------
  */

  async refundPayout(
    userId,
    amount,
    payoutId,
    refundId,
    remark = "",
    options = {}
  ) {

    const numericAmount =
      Number(amount);


    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {

      throw new Error(
        "Invalid refund amount."
      );

    }


    if (!payoutId) {

      throw new Error(
        "Payout ID is required."
      );

    }


    if (!refundId) {

      throw new Error(
        "Refund ID is required."
      );

    }


    const externalSession =
      options?.session || null;


    const session =
      externalSession ||
      await mongoose.startSession();


    const shouldEndSession =
      !externalSession;


    try {

      if (
        shouldEndSession
      ) {

        session.startTransaction();

      }


      /*
       * ==========================================
       * REFUND MODEL
       * ==========================================
       */

      const PayoutRefund =
        require(
          "../models/PayoutRefund"
        );


      /*
       * ==========================================
       * DUPLICATE REFUND PROTECTION
       * ==========================================
       */

      const existingRefund =
        await PayoutRefund.findOne({

          _id:
            refundId,

          status:
            "completed",

        }).session(
          session
        );


      if (
        existingRefund
      ) {

        const wallet =
          await Wallet.findOne({
            user:
              userId,
          }).session(
            session
          );


        if (!wallet) {

          throw new Error(
            "Wallet not found."
          );

        }


        if (
          shouldEndSession
        ) {

          await session.commitTransaction();

        }


        return {

          wallet,

          refund:
            existingRefund,

          alreadyRefunded:
            true,

          transactionId:
            existingRefund.transactionId,

        };

      }


      /*
       * ==========================================
       * GET WALLET
       * ==========================================
       */

      const wallet =
        await Wallet.findOne({

          user:
            userId,

        }).session(
          session
        );


      if (!wallet) {

        throw new Error(
          "Wallet not found."
        );

      }


      /*
       * ==========================================
       * CREDIT WALLET
       * ==========================================
       */

      const previousBalance =
        Number(
          wallet.balance || 0
        );


      const currentBalance =
        previousBalance +
        numericAmount;


      wallet.balance =
        currentBalance;


      await wallet.save({
        session,
      });


      /*
       * ==========================================
       * CREATE REFUND TRANSACTION
       * ==========================================
       */

      const transactionId =
        generateTransactionId();


      const transaction =
        await Transaction.create(
          [
            {
              transactionId,

              user:
                userId,

              wallet:
                wallet._id,

              payout:
                payoutId,

              type:
                "refund",

              amount:
                numericAmount,

              previousBalance,

              currentBalance,

              status:
                "success",

              remark:
                remark ||
                "Payout Refund",

            },
          ],
          {
            session,
          }
        );


      /*
       * ==========================================
       * UPDATE REFUND RECORD
       * ==========================================
       */

      const refund =
        await PayoutRefund.findByIdAndUpdate(

          refundId,

          {
            status:
              "completed",

            transactionId:
              transaction[0]
                .transactionId,

          },

          {
            new:
              true,

            session,

          }

        );


      if (!refund) {

        throw new Error(
          "Refund record not found."
        );

      }


      /*
       * ==========================================
       * COMMIT
       * ==========================================
       */

      if (
        shouldEndSession
      ) {

        await session.commitTransaction();

      }


      return {

        wallet,

        refund,

        transaction:
          transaction[0],

        transactionId,

        alreadyRefunded:
          false,

        previousBalance,

        currentBalance,

      };


    } catch (error) {

      if (
        shouldEndSession
      ) {

        await session.abortTransaction();

      }


      throw error;


    } finally {

      if (
        shouldEndSession
      ) {

        await session.endSession();

      }

    }

  }


  /*
  |--------------------------------------------------------------------------
  | RESTORE REVERSED PAYOUT
  |--------------------------------------------------------------------------
  */

  async restorePayout(
    userId,
    amount,
    payoutId,
    remark = "",
    options = {}
  ) {

    const numericAmount =
      Number(amount);


    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {

      throw new Error(
        "Invalid restore amount."
      );

    }


    if (!payoutId) {

      throw new Error(
        "Payout ID is required."
      );

    }


    const externalSession =
      options?.session || null;


    const session =
      externalSession ||
      await mongoose.startSession();


    const shouldEndSession =
      !externalSession;


    try {

      if (
        shouldEndSession
      ) {

        session.startTransaction();

      }


      /*
       * ==========================================
       * DUPLICATE RESTORE PROTECTION
       * ==========================================
       */

      const existingRestore =
        await Transaction.findOne({

          payout:
            payoutId,

          type:
            "payout_restore",

        }).session(
          session
        );


      if (
        existingRestore
      ) {

        const wallet =
          await Wallet.findOne({

            user:
              userId,

          }).session(
            session
          );


        if (!wallet) {

          throw new Error(
            "Wallet not found."
          );

        }


        if (
          shouldEndSession
        ) {

          await session.commitTransaction();

        }


        return {

          wallet,

          transaction:
            existingRestore,

          transactionId:
            existingRestore.transactionId,

          alreadyRestored:
            true,

        };

      }


      /*
       * ==========================================
       * GET WALLET
       * ==========================================
       */

      const wallet =
        await Wallet.findOne({

          user:
            userId,

        }).session(
          session
        );


      if (!wallet) {

        throw new Error(
          "Wallet not found."
        );

      }


      /*
       * ==========================================
       * CREDIT WALLET
       * ==========================================
       */

      const previousBalance =
        Number(
          wallet.balance || 0
        );


      const currentBalance =
        previousBalance +
        numericAmount;


      wallet.balance =
        currentBalance;


      /*
       * Restore the winning amount
       * removed during reversal.
       */

      wallet.winningBalance =
        Number(
          wallet.winningBalance || 0
        ) +
        numericAmount;


      wallet.totalWin =
        Number(
          wallet.totalWin || 0
        ) +
        numericAmount;


      await wallet.save({
        session,
      });


      /*
       * ==========================================
       * CREATE RESTORE TRANSACTION
       * ==========================================
       */

      const transactionId =
        generateTransactionId();


      const transaction =
        await Transaction.create(
          [
            {
              transactionId,

              user:
                userId,

              wallet:
                wallet._id,

              payout:
                payoutId,

              type:
                "payout_restore",

              amount:
                numericAmount,

              previousBalance,

              currentBalance,

              status:
                "success",

              remark:
                remark ||
                "Payout restored.",

            },
          ],
          {
            session,
          }
        );


      /*
       * ==========================================
       * COMMIT
       * ==========================================
       */

      if (
        shouldEndSession
      ) {

        await session.commitTransaction();

      }


      return {

        wallet,

        transaction:
          transaction[0],

        transactionId,

        previousBalance,

        currentBalance,

        alreadyRestored:
          false,

      };


    } catch (error) {

      if (
        shouldEndSession
      ) {

        await session.abortTransaction();

      }


      throw error;


    } finally {

      if (
        shouldEndSession
      ) {

        await session.endSession();

      }

    }

  }


  /*
  |--------------------------------------------------------------------------
  | GET WALLET
  |--------------------------------------------------------------------------
  */

  async getWallet(
    userId
  ) {

    return await Wallet.findOne({
      user: userId,
    });

  }

}


module.exports =
  new WalletService();