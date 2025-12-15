import { Request, Response } from "express";
import Transaction from "../models/transaction.model";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  TransactionSummary,
} from "../config/types/transaction";
import mongoose from "mongoose";

import utils from "../lib/utils";
import EventEmitter from "node:events";
import Joi from "joi";
import makeRequest from "../utils/axiosClient";
import config from "../config";

export class TransactionController {
  // Create a new transaction
  static async createTransaction(req: Request, res: Response) {
    console.log("createTransaction", req.body);
    try {
      const transactionData: any = req.body;

      console.log("transactionData User Data ==>", (req as any)._user);

      transactionData.userId = (req as any)._user._id;

      // Validate required fields
      if (!transactionData || !transactionData.jobId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: jobId is required",
        });
      }

      // Remove any _id from request data (security measure)
      delete transactionData._id;

      // Check if transaction already exists for this job
      const existingTransaction = await Transaction.findOne({
        jobId: transactionData.jobId,
      });

      if (existingTransaction) {
        // Check payment type and status
        if (transactionData.paymentType === "downPayment") {
          // If trying to create down payment but it already exists
          if (
            existingTransaction.amountForDownPayment &&
            existingTransaction.transactionStatusForDownPayment !== "failed"
          ) {
            return res.status(400).json({
              success: false,
              message: "Down payment already exists for this job",
              //data: existingTransaction
            });
          }
        } else if (transactionData.paymentType === "finalPayment") {
          // If trying to create final payment, check if down payment exists and is completed
          if (
            !existingTransaction.amountForDownPayment ||
            existingTransaction.transactionStatusForDownPayment !== "completed"
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Down payment must be completed before creating final payment",
              data: existingTransaction,
            });
          }
        }

        // Update existing transaction (exclude _id from update)
        const { _id, ...updateData } = transactionData;
        const updatedTransaction = await Transaction.findByIdAndUpdate(
          existingTransaction._id,
          updateData,
          { new: true, runValidators: true }
        );

        return res.status(200).json({
          success: true,
          message: "Transaction updated successfully",
          data: updatedTransaction,
        });
      } else {
        // Create new transaction (MongoDB will auto-generate _id)
        const transaction = new Transaction(transactionData);
        await transaction.save();

        return res.status(201).json({
          success: true,
          message: "Transaction created successfully",
          data: transaction,
        });
      }
    } catch (error: any) {
      console.error("Error in createTransaction:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating transaction",
        error: error.message,
      });
    }
  }

  static async initiatePayment(req: Request, res: Response) {
    console.log("initiatePayment", req.body);
    try {
      const transactionData: any = req.body;

      console.log("transactionData User Data ==>", (req as any)._user);

      transactionData.userId = (req as any)._user._id;

      // Validate required fields
      if (!transactionData || !transactionData.jobId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: jobId is required",
        });
      }

      if (!transactionData.paymentType) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: paymentType is required",
        });
      }

      if (!transactionData.amount) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: amount is required",
        });
      }

      // Find any existing transaction for this job and transactionType
      const existingTransaction = await Transaction.findOne({
        jobId: transactionData.jobId,
        paymentType: transactionData.paymentType,
      });

      console.log("existingTransaction ==>", existingTransaction);

      let transaction: any;

      if (existingTransaction == null) {
        return res.status(400).json({
          success: false,
          message: "Transaction not found Please Try Again",
        });
      }

      if (existingTransaction) {
        // Reuse and optionally update existing transaction data (excluding _id)
        const { _id, ...updateData } = transactionData;
        transaction = await Transaction.findByIdAndUpdate(
          existingTransaction._id,
          updateData,
          { new: true, runValidators: true }
        );
      } else {
        // Create a new transaction for this job and transactionType
        transaction = new Transaction(transactionData);
        await transaction.save();
      }

      const chapaSecret =
        process.env.CHAPA_SECRET_KEY ||
        "CHASECK-EgmFAPq28jE6uDTUQrxleAPs1ffy907H";
      if (!chapaSecret) {
        return res.status(500).json({
          success: false,
          message: "Chapa secret key is not configured on the server",
        });
      }

      // Build Chapa payload based on minimal working example from Chapa docs
      const amount =
        transaction.paymentType === "downPayment"
          ? transaction.amountForDownPayment
          : transaction.amount;

      const chapaPayload = {
        amount: amount?.toString() || "0",
        phone_number:
          transactionData.phone_number ||
          transaction.creditPhoneNumber ||
          (req as any)._user?.phoneNumber ||
          "",
      };

      const chapaResponse = await makeRequest(
        "https://api.chapa.co",
        "/v1/transaction/initialize",
        "post",
        chapaPayload,
        chapaSecret
      );

      if (!chapaResponse) {
        return res.status(502).json({
          success: false,
          message: "Failed to initiate payment with Chapa",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payment initialized successfully",
        data: {
          transaction,
          chapa: chapaResponse.data,
        },
      });
    } catch (error: any) {
      console.error("Error in createTransaction:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating transaction",
        error: error.message,
      });
    }
  }

  /**
   * Chapa callback endpoint to update transaction status.
   * This URL is used as `callback_url` when initializing the payment.
   */
  static async chapaCallback(req: Request, res: Response) {
    try {
      const { tx_ref, status } = { ...req.body, ...req.query } as any;

      if (!tx_ref) {
        return res.status(400).json({
          success: false,
          message: "Missing tx_ref in callback",
        });
      }

      const transaction = await Transaction.findOne({
        $or: [
          { transactionIDForDownPayment: tx_ref },
          { transactionID: tx_ref },
        ],
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found for provided tx_ref",
        });
      }

      const isSuccess = status === "success";

      if (transaction.paymentType === "downPayment") {
        transaction.transactionStatusForDownPayment = isSuccess
          ? "completed"
          : "failed";
        transaction.isPaidForDownPayment = isSuccess;
        transaction.isFailedForDownPayment = !isSuccess;
      } else {
        transaction.transactionStatus = isSuccess ? "completed" : "failed";
        transaction.isPaid = isSuccess;
        transaction.isFailed = !isSuccess;
      }

      await transaction.save();

      return res.status(200).json({
        success: true,
        message: "Transaction status updated from Chapa callback",
        data: transaction,
      });
    } catch (error: any) {
      console.error("Error handling Chapa callback:", error);
      return res.status(500).json({
        success: false,
        message: "Error handling Chapa callback",
        error: error.message,
      });
    }
  }

  /**
   * Endpoint to check/verify a payment with Chapa using tx_ref.
   */
  static async verifyChapaPayment(req: Request, res: Response) {
    try {
      const { txRef } = req.params as any;

      if (!txRef) {
        return res.status(400).json({
          success: false,
          message: "txRef is required",
        });
      }

      const chapaSecret =
        process.env.CHAPA_SECRET_KEY ||
        "CHASECK-EgmFAPq28jE6uDTUQrxleAPs1ffy907H";
      if (!chapaSecret) {
        return res.status(500).json({
          success: false,
          message: "Chapa secret key is not configured on the server",
        });
      }

      const chapaResponse = await makeRequest(
        "https://api.chapa.co",
        `/v1/transaction/verify/${txRef}`,
        "get",
        undefined,
        chapaSecret
      );

      if (!chapaResponse) {
        return res.status(502).json({
          success: false,
          message: "Failed to verify payment with Chapa",
        });
      }

      // Optionally sync status to our transaction
      const chapaStatus = chapaResponse.data?.data?.status;
      const transaction = await Transaction.findOne({
        $or: [{ transactionIDForDownPayment: txRef }, { transactionID: txRef }],
      });

      if (transaction && chapaStatus) {
        const isSuccess = chapaStatus === "success";
        if (transaction.paymentType === "downPayment") {
          transaction.transactionStatusForDownPayment = isSuccess
            ? "completed"
            : "failed";
          transaction.isPaidForDownPayment = isSuccess;
          transaction.isFailedForDownPayment = !isSuccess;
        } else {
          transaction.transactionStatus = isSuccess ? "completed" : "failed";
          transaction.isPaid = isSuccess;
          transaction.isFailed = !isSuccess;
        }
        await transaction.save();
      }

      return res.status(200).json({
        success: true,
        data: {
          chapa: chapaResponse.data,
          transaction,
        },
      });
    } catch (error: any) {
      console.error("Error verifying Chapa payment:", error);
      return res.status(500).json({
        success: false,
        message: "Error verifying Chapa payment",
        error: error.message,
      });
    }
  }

  static async confirmTransaction(req: Request, res: Response) {
    try {
      const { transactionID } = req.body;
      const transaction = await Transaction.findOne({ transactionID });
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Transaction confirmed successfully",
          data: transaction,
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error confirming transaction",
        error: error.message,
      });
    }
  }

  // Get transaction by ID
  static async getTransactionById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findById(id)
        .populate("userId", "fullName phoneNumber userCode")
        .populate("clientId", "businessName TILLNumber phoneNumber")
        .populate("jobId", "jobTitle jobDescription jobPrice")
        .populate("technicianId", "fullName phoneNumber");

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error fetching transaction",
        error: error.message,
      });
    }
  }

  // Get transactions with filters and pagination
  static async getTransactions(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        userId = (req as any)._user._id,
        clientId = (req as any)._user.clientId,
        jobId = "",
        technicianId = "",
        transactionType = "transfer",
        transactionStatus = "pending",
        paymentMethod = "telebirr",
        isPaid = false,
        dateFrom = "",
        dateTo = "",
        amountMin = 0,
        amountMax = 0,
        bankName = "",
        agentCode = "",
        branchCode = "",
      } = req.query;

      // Build filter object
      const filters: any = {};

      if (userId) filters.userId = userId;
      if (clientId) filters.clientId = clientId;
      if (jobId) filters.jobId = jobId;
      if (technicianId) filters.technicianId = technicianId;
      if (transactionType) filters.transactionType = transactionType;
      if (transactionStatus) filters.transactionStatus = transactionStatus;
      if (paymentMethod) filters.paymentMethod = paymentMethod;
      if (isPaid !== undefined) filters.isPaid = isPaid === "true";
      if (bankName) filters.bankName = new RegExp(bankName as string, "i");
      if (agentCode) filters.agentCode = agentCode;
      if (branchCode) filters.branchCode = branchCode;

      // Date range filter
      if (dateFrom || dateTo) {
        filters.transactionDate = {};
        if (dateFrom)
          filters.transactionDate.$gte = new Date(dateFrom as string);
        if (dateTo) filters.transactionDate.$lte = new Date(dateTo as string);
      }

      // Amount range filter
      if (amountMin || amountMax) {
        filters.amount = {};
        if (amountMin) filters.amount.$gte = Number(amountMin);
        if (amountMax) filters.amount.$lte = Number(amountMax);
      }

      const options = {
        page: Number(page),
        limit: Number(limit),
        sort: { transactionDate: -1 },
        populate: [
          { path: "userId", select: "fullName phoneNumber userCode" },
          { path: "clientId", select: "businessName TILLNumber phoneNumber" },
          { path: "jobId", select: "jobTitle jobDescription jobPrice" },
          { path: "technicianId", select: "fullName phoneNumber" },
        ],
      };

      const transactions = await Transaction.paginate(filters, options);

      return res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error fetching transactions",
        error: error.message,
      });
    }
  }

  // Update transaction
  static async updateTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData: UpdateTransactionInput = req.body;

      const transaction = await Transaction.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Transaction updated successfully",
        data: transaction,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error updating transaction",
        error: error.message,
      });
    }
  }

  // Mark transaction as paid
  static async markAsPaid(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { paidAmount, paymentMethod, telebirrReference, mpesaReference } =
        req.body;

      const transaction = await Transaction.findByIdAndUpdate(
        id,
        {
          isPaid: true,
          transactionStatus: "completed",
          paidAmount: paidAmount,
          paidAt: new Date(),
          paymentMethod,
          telebirrReference,
          mpesaReference,
        },
        { new: true }
      );

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Transaction marked as paid successfully",
        data: transaction,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error marking transaction as paid",
        error: error.message,
      });
    }
  }

  // Get financial summary/overview
  static async getFinancialSummary(req: Request, res: Response) {
    try {
      const { dateFrom, dateTo, userId, technicianId } = req.query;

      // Build match criteria
      const matchCriteria: any = {};

      if (dateFrom || dateTo) {
        matchCriteria.transactionDate = {};
        if (dateFrom)
          matchCriteria.transactionDate.$gte = new Date(dateFrom as string);
        if (dateTo)
          matchCriteria.transactionDate.$lte = new Date(dateTo as string);
      }

      if (userId)
        matchCriteria.userId = new mongoose.Types.ObjectId(userId as string);
      if (technicianId)
        matchCriteria.technicianId = new mongoose.Types.ObjectId(
          technicianId as string
        );

      const summary = await Transaction.aggregate([
        { $match: matchCriteria },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [
                  { $in: ["$transactionType", ["payment", "deposit"]] },
                  "$amount",
                  0,
                ],
              },
            },
            totalExpenses: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$transactionType",
                      ["withdrawal", "commission", "tip"],
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },
            pendingPayments: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$isPaid", false] },
                      { $eq: ["$transactionStatus", "pending"] },
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },
            technicianPayouts: {
              $sum: {
                $cond: [
                  { $eq: ["$transactionType", "commission"] },
                  "$amount",
                  0,
                ],
              },
            },
            totalTransactions: { $sum: 1 },
            completedTransactions: {
              $sum: {
                $cond: [{ $eq: ["$transactionStatus", "completed"] }, 1, 0],
              },
            },
            failedTransactions: {
              $sum: {
                $cond: [{ $eq: ["$transactionStatus", "failed"] }, 1, 0],
              },
            },
            pendingTransactions: {
              $sum: {
                $cond: [{ $eq: ["$transactionStatus", "pending"] }, 1, 0],
              },
            },
            averageTransactionAmount: { $avg: "$amount" },
            totalServiceFees: { $sum: "$serviceFee" },
            totalVAT: { $sum: "$VAT" },
            totalTips: { $sum: "$tipAmount" },
            totalCommissions: { $sum: "$commissionAmount" },
          },
        },
      ]);

      const result: TransactionSummary = summary[0] || {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        pendingPayments: 0,
        technicianPayouts: 0,
        totalTransactions: 0,
        completedTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0,
        averageTransactionAmount: 0,
        totalServiceFees: 0,
        totalVAT: 0,
        totalTips: 0,
        totalCommissions: 0,
      };

      // Calculate net profit
      result.netProfit = result.totalRevenue - result.totalExpenses;

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error generating financial summary",
        error: error.message,
      });
    }
  }

  // Get transactions by job ID
  static async getTransactionsByJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const options = {
        page: Number(page),
        limit: Number(limit),
        sort: { transactionDate: -1 },
        populate: [
          { path: "userId", select: "fullName phoneNumber userCode" },
          { path: "technicianId", select: "fullName phoneNumber" },
        ],
      };

      const transactions = await Transaction.paginate({ jobId }, options);

      return res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error fetching job transactions",
        error: error.message,
      });
    }
  }

  // Get transactions by technician
  static async getTransactionsByTechnician(req: Request, res: Response) {
    try {
      const { technicianId } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      const filters: any = { technicianId };
      if (status) filters.transactionStatus = status;

      const options = {
        page: Number(page),
        limit: Number(limit),
        sort: { transactionDate: -1 },
        populate: [
          { path: "userId", select: "fullName phoneNumber userCode" },
          { path: "jobId", select: "jobTitle jobDescription jobPrice" },
          { path: "clientId", select: "businessName TILLNumber" },
        ],
      };

      const transactions = await Transaction.paginate(filters, options);

      return res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error fetching technician transactions",
        error: error.message,
      });
    }
  }

  // Delete transaction (soft delete)
  static async deleteTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findByIdAndUpdate(
        id,
        {
          transactionStatus: "cancelled",
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Transaction cancelled successfully",
        data: transaction,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error cancelling transaction",
        error: error.message,
      });
    }
  }
}
