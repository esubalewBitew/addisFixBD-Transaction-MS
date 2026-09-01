import { Request, Response } from "express";
import Transaction from "../models/transaction.model";
import Jobs from "../models/jobs.model";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  TransactionSummary,
} from "../config/types/transaction";
import mongoose from "mongoose";
import crypto from "crypto";

import utils from "../lib/utils";
import EventEmitter from "node:events";
import Joi from "joi";
import makeRequest from "../utils/axiosClient";
import config from "../config";
import {
  applyVerifiedChapaStatus,
  buildChapaTxRef,
  extractCallbackTxRef,
  findTransactionByTxRef,
  verifyWithChapa,
  resolvePaymentTypeFromTxRef,
} from "../utils/chapa";

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

      // One transaction document per job
      const existingTransaction = await Transaction.findOne({
        jobId: transactionData.jobId,
      });

      console.log("existingTransaction ==>", existingTransaction);

      let transaction: any;

      if (existingTransaction) {
        // Reuse and optionally update existing transaction data (excluding _id)
        const { _id, ...updateData } = transactionData;
        transaction = await Transaction.findByIdAndUpdate(
          existingTransaction._id,
          updateData,
          { new: true, runValidators: true }
        );
      } else {
        // No transaction exists yet for this job/paymentType (the normal
        // case the first time a customer taps "Pay Now") - create one now,
        // filling in the fields the schema requires that the client
        // doesn't (and shouldn't have to) send.
        const user = (req as any)._user;
        const isDownPayment = transactionData.paymentType === "downPayment";

        transaction = new Transaction({
          ...transactionData,
          userCode: user?.userCode || user?.phoneNumber || "N/A",
          phoneNumber:
            transactionData.phone_number || user?.phoneNumber || "",
          debitAccountHolderName: user?.fullName || "Customer",
          creditAccountNumber:
            process.env.CHAPA_MERCHANT_ACCOUNT || "ADDISFIX-CHAPA",
          creditAccountHolderName: "AddisFix",
          transactionType: transactionData.paymentType,
          transactionReason: `${
            isDownPayment ? "Down payment" : "Final payment"
          } for job ${transactionData.jobId}`,
          amountForDownPayment: isDownPayment
            ? Number(transactionData.amount) || 0
            : 0,
        });
        await transaction.save();
      }

      const paymentType = transactionData.paymentType as
        | "downPayment"
        | "finalPayment";

      // Fresh tx_ref on every attempt — Chapa rejects duplicate refs after abandoned checkout
      const txRef = buildChapaTxRef(String(transaction._id), paymentType);
      const chapaUpdate: Record<string, unknown> = {};
      if (paymentType === "downPayment") {
        chapaUpdate.transactionIDForDownPayment = txRef;
        chapaUpdate.transactionStatusForDownPayment = "processing";
        chapaUpdate.isFailedForDownPayment = false;
      } else {
        chapaUpdate.transactionID = txRef;
        chapaUpdate.transactionStatus = "processing";
        chapaUpdate.isFailed = false;
      }
      transaction = await Transaction.findByIdAndUpdate(
        transaction._id,
        chapaUpdate,
        { new: true, runValidators: true }
      );

      const chapaSecret = process.env.CHAPA_SECRET_KEY;
      if (!chapaSecret) {
        return res.status(500).json({
          success: false,
          message: "Chapa secret key is not configured on the server",
        });
      }

      // Build Chapa payload. amount, currency, email and tx_ref are all
      // required by Chapa's /v1/transaction/initialize endpoint - without
      // them Chapa rejects the request and makeRequest() swallows the
      // error, which previously surfaced as an opaque 502 here.
      const amount =
        paymentType === "downPayment"
          ? transaction?.amountForDownPayment
          : transaction?.amount;

      const user = (req as any)._user;
      const phoneNumber: string =
        transactionData.phone_number ||
        transaction.creditPhoneNumber ||
        user?.phoneNumber ||
        "";
      const [firstName, ...lastNameParts] = String(
        user?.fullName || "AddisFix Customer"
      ).split(" ");

      const miniAppUrl = (
        process.env.MINI_APP_URL ||
        process.env.FRONTEND_URL ||
        "http://localhost:3000"
      ).replace(/\/$/, "");

      const chapaPayload: Record<string, any> = {
        amount: amount?.toString() || "0",
        currency: transaction.currency || "ETB",
        email: user?.email || `${phoneNumber || txRef}@gmail.com`,
        tx_ref: txRef,
        phone_number: phoneNumber,
        first_name: firstName || "AddisFix",
        last_name: lastNameParts.join(" ") || "Customer",
        callback_url: `${config._VALS.baseURL}/addisfix/transaction/chapa/callback`,
        return_url: `${miniAppUrl}/payments/success?tx_ref=${encodeURIComponent(txRef)}`,
        customization: {
          title: "AddisFix Payment",
          description:
            paymentType === "downPayment" ? "Down payment" : "Final payment",
        },
      };

      const chapaResponse = await makeRequest(
        "https://api.chapa.co",
        "/v1/transaction/initialize",
        "post",
        chapaPayload,
        chapaSecret
      );

      if (!chapaResponse || chapaResponse.data?.status !== "success") {
        const chapaMessage =
          chapaResponse?.data?.message || "Failed to initiate payment with Chapa";
        return res.status(502).json({
          success: false,
          message: chapaMessage,
          error: chapaResponse?.data,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payment initialized successfully",
        data: {
          transaction,
          tx_ref: txRef,
          return_url: chapaPayload.return_url,
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
   *
   * This route is intentionally excluded from the JWT auth guard (see
   * index.ts) since Chapa's servers cannot send our Bearer token. Because
   * of that, we never trust the tx_ref/status Chapa sends us directly -
   * for a POST webhook we verify the HMAC signature, and either way we
   * re-verify the transaction server-to-server with Chapa's secret key
   * before touching our own records.
   */
  static async chapaCallback(req: Request, res: Response) {
    try {
      const txRef = extractCallbackTxRef(req.body, req.query);

      if (!txRef) {
        return res.status(400).json({
          success: false,
          message: "Missing tx_ref/trx_ref in callback",
        });
      }

      const chapaSecret = process.env.CHAPA_SECRET_KEY;
      if (!chapaSecret) {
        return res.status(500).json({
          success: false,
          message: "Chapa secret key is not configured on the server",
        });
      }

      // If Chapa sent this as a signed webhook (POST with a JSON body),
      // verify the signature before doing anything else.
      const signature =
        (req.headers["x-chapa-signature"] as string) ||
        (req.headers["chapa-signature"] as string);
      if (signature && req.body && Object.keys(req.body).length > 0) {
        const expectedSignature = crypto
          .createHmac("sha256", chapaSecret)
          .update(JSON.stringify(req.body))
          .digest("hex");
        if (expectedSignature !== signature) {
          console.warn("Rejected Chapa callback with invalid signature");
          return res.status(401).json({
            success: false,
            message: "Invalid webhook signature",
          });
        }
      }

      const transaction = await findTransactionByTxRef(txRef);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found for provided tx_ref",
        });
      }

      // Don't trust the status Chapa sent us in the callback body/query -
      // re-verify with Chapa directly using our secret key.
      const verifyResponse = await makeRequest(
        "https://api.chapa.co",
        `/v1/transaction/verify/${encodeURIComponent(txRef)}`,
        "get",
        undefined,
        chapaSecret
      );

      if (!verifyResponse) {
        return res.status(502).json({
          success: false,
          message: "Failed to verify payment with Chapa",
        });
      }

      const chapaStatus = verifyResponse.data?.data?.status;
      if (!chapaStatus) {
        return res.status(502).json({
          success: false,
          message: "Invalid verification response from Chapa",
        });
      }

      const paymentType = resolvePaymentTypeFromTxRef(transaction, txRef);
      const updatedTransaction = await applyVerifiedChapaStatus(
        transaction,
        paymentType,
        chapaStatus
      );

      return res.status(200).json({
        success: true,
        message: "Transaction status updated from Chapa callback",
        data: {
          transaction: updatedTransaction,
          chapaStatus,
        },
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

      const chapaResponse = await verifyWithChapa(txRef);

      if (!chapaResponse) {
        return res.status(502).json({
          success: false,
          message: "Failed to verify payment with Chapa",
        });
      }

      const chapaStatus = chapaResponse.data?.data?.status;
      const transaction = await findTransactionByTxRef(txRef);

      if (transaction && chapaStatus) {
        const paymentType = resolvePaymentTypeFromTxRef(transaction, txRef);
        await applyVerifiedChapaStatus(transaction, paymentType, chapaStatus);
      }

      const refreshedTransaction = await findTransactionByTxRef(txRef);

      return res.status(200).json({
        success: true,
        data: {
          chapa: chapaResponse.data,
          chapaStatus,
          transaction: refreshedTransaction,
          paymentSuccessful: chapaStatus === "success",
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
        transactionType = "",
        transactionStatus = "",
        paymentMethod = "",
        isPaid,
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

  // Get a user's payment summary - powers the "Pending Payment"/"Total Paid"
  // cards on the mini app home screen.
  static async getPaymentSummary(req: Request, res: Response) {
    try {
      const authUser = (req as any)._user;
      const userId = authUser?._id || (req.query.userId as string);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const userObjectId = new mongoose.Types.ObjectId(String(userId));
      const transactions = await Transaction.find({ userId: userObjectId }).lean();

      let totalPending = 0;
      let totalPaid = 0;
      const unpaidJobIds = new Set<string>();

      for (const txn of transactions) {
        const downAmount = Number(txn.amountForDownPayment || 0);
        const downPending =
          downAmount > 0 &&
          !txn.isPaidForDownPayment &&
          txn.transactionStatusForDownPayment !== "completed" &&
          txn.transactionStatusForDownPayment !== "cancelled";

        if (downPending) {
          totalPending += downAmount;
          if (txn.jobId) unpaidJobIds.add(String(txn.jobId));
        }

        if (txn.isPaidForDownPayment) {
          totalPaid += downAmount;
        }

        const finalAmount = Number(txn.amount || 0);
        const downSatisfied =
          downAmount === 0 || txn.isPaidForDownPayment === true;
        const finalPending =
          finalAmount > 0 &&
          !txn.isPaid &&
          txn.transactionStatus !== "completed" &&
          txn.transactionStatus !== "cancelled" &&
          downSatisfied;

        if (finalPending) {
          totalPending += finalAmount;
          if (txn.jobId) unpaidJobIds.add(String(txn.jobId));
        }

        if (txn.isPaid) {
          totalPaid += finalAmount;
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          totalPending,
          totalPaid,
          unpaidJobs: unpaidJobIds.size,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error generating payment summary",
        error: error.message,
      });
    }
  }

  // List a user's jobs that still have a payment awaiting completion -
  // powers the "Pending Payment" listing screen. "Pending" here is
  // type-aware: a downPayment transaction's completion only ever updates
  // isPaidForDownPayment/transactionStatusForDownPayment, never the plain
  // isPaid/transactionStatus fields, so a naive isPaid=false filter on
  // get-transactions would keep showing completed down payments as pending.
  static async getPendingPayments(req: Request, res: Response) {
    try {
      const authUser = (req as any)._user;
      if (!authUser?._id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const transactions = await Transaction.find({ userId: authUser._id })
        .populate({
          path: "jobId",
          select:
            "jobTitle jobDescription jobPrice jobDownPayment jobPaymentStatus jobServiceCategory jobStatus jobLocation",
        })
        .sort({ updatedAt: -1 })
        .lean();

      const pendingPayments: any[] = [];

      for (const txn of transactions) {
        const populatedJob = txn.jobId as any;
        if (!populatedJob) {
          continue;
        }
        if (
          populatedJob?.jobStatus &&
          String(populatedJob.jobStatus).toLowerCase() === "cancelled"
        ) {
          continue;
        }

        const downAmount = Number(txn.amountForDownPayment || 0);
        const downPending =
          downAmount > 0 &&
          !txn.isPaidForDownPayment &&
          txn.transactionStatusForDownPayment !== "completed" &&
          txn.transactionStatusForDownPayment !== "cancelled";

        if (downPending) {
          pendingPayments.push({
            ...txn,
            paymentType: "downPayment",
            amountDue: downAmount,
            readyToPay: true,
          });
        }

        const finalAmount = Number(txn.amount || 0);
        const downSatisfied =
          downAmount === 0 || txn.isPaidForDownPayment === true;
        const finalPending =
          finalAmount > 0 &&
          !txn.isPaid &&
          txn.transactionStatus !== "completed" &&
          txn.transactionStatus !== "cancelled" &&
          downSatisfied;

        if (finalPending) {
          pendingPayments.push({
            ...txn,
            paymentType: "finalPayment",
            amountDue: finalAmount,
            readyToPay: true,
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: pendingPayments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error fetching pending payments",
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

  static async rejectPayment(req: Request, res: Response) {
    try {
      const authUser = (req as any)._user;
      if (!authUser?._id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { jobId, paymentType } = req.body as {
        jobId?: string;
        paymentType?: "downPayment" | "finalPayment";
      };

      if (!jobId || !paymentType) {
        return res.status(400).json({
          success: false,
          message: "jobId and paymentType are required",
        });
      }

      const transaction = await Transaction.findOne({
        jobId,
        userId: authUser._id,
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found for this job",
        });
      }

      if (paymentType === "downPayment") {
        transaction.transactionStatusForDownPayment = "cancelled";
        transaction.isFailedForDownPayment = true;
        transaction.isPaidForDownPayment = false;
      } else {
        transaction.transactionStatus = "cancelled";
        transaction.isFailed = true;
        transaction.isPaid = false;
      }

      await transaction.save();

      await Jobs.findByIdAndUpdate(jobId, {
        jobPaymentStatus: "Failed",
        jobStatus: "Cancelled",
        jobUpdatedAt: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: "Payment request rejected successfully",
        data: transaction,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Error rejecting payment",
        error: error.message,
      });
    }
  }
}
