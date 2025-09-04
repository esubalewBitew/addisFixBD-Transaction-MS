import { Request, Response } from "express";
import Transaction from "../models/transaction.model";
import { 
    CreateTransactionInput, 
    UpdateTransactionInput, 
    TransactionFilters, 
    TransactionSummary 
} from "../config/types/transaction";
import mongoose from "mongoose";

import utils from "../lib/utils";

export class TransactionController {
    
    // Create a new transaction
    static async createTransaction(req: Request, res: Response) {
        console.log("createTransaction", req.body);
        try {
            const transactionData: CreateTransactionInput = req.body;

            transactionData.userId = (req as any)._user._id;
            transactionData.userCode = (req as any)._user.userCode;
            
            // Validate required fields
            if (!transactionData || !transactionData || !transactionData.amount) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: FTNumber, userId, and amount are required"
                });
            }

            const transactionID = await utils.generateTransactionID();
            transactionData.transactionID = transactionID;
            if(transactionData.transactionID)
            {
                const transaction = new Transaction(transactionData);
                await transaction.save();
                return res.status(201).json({
                    success: true,
                    message: "Transaction created successfully",
                    data: transaction
                });
            }
            else
            {
                return res.status(400).json({
                    success: false,
                    message: "Failed to generate transaction ID"
                });
            }
            
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Error creating transaction",
                error: error.message
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
                    message: "Transaction not found"
                });
            }
            else
            {
                return res.status(200).json({
                    success: true,
                    message: "Transaction confirmed successfully",
                    data: transaction
                });
            }
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Error confirming transaction",
                error: error.message
            });
        }
    }

    // Get transaction by ID
    static async getTransactionById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            const transaction = await Transaction.findById(id)
                .populate('userId', 'fullName phoneNumber userCode')
                .populate('clientId', 'businessName TILLNumber phoneNumber')
                .populate('jobId', 'jobTitle jobDescription jobPrice')
                .populate('technicianId', 'fullName phoneNumber');

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: "Transaction not found"
                });
            }

            return res.status(200).json({
                success: true,
                data: transaction
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Error fetching transaction",
                error: error.message
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
                branchCode = ""
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
            if (isPaid !== undefined) filters.isPaid = isPaid === 'true';
            if (bankName) filters.bankName = new RegExp(bankName as string, 'i');
            if (agentCode) filters.agentCode = agentCode;
            if (branchCode) filters.branchCode = branchCode;

            // Date range filter
            if (dateFrom || dateTo) {
                filters.transactionDate = {};
                if (dateFrom) filters.transactionDate.$gte = new Date(dateFrom as string);
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
                    { path: 'userId', select: 'fullName phoneNumber userCode' },
                    { path: 'clientId', select: 'businessName TILLNumber phoneNumber' },
                    { path: 'jobId', select: 'jobTitle jobDescription jobPrice' },
                    { path: 'technicianId', select: 'fullName phoneNumber' }
                ]
            };

            const transactions = await Transaction.paginate(filters, options);

            return res.status(200).json({
                success: true,
                data: transactions
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Error fetching transactions",
                error: error.message
            });
        }
    }

    // Update transaction
    static async updateTransaction(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData: UpdateTransactionInput = req.body;

            const transaction = await Transaction.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: "Transaction not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Transaction updated successfully",
                data: transaction
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Error updating transaction",
                error: error.message
            });
        }
    }

    // Mark transaction as paid
    static async markAsPaid(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { paidAmount, paymentMethod, telebirrReference, mpesaReference } = req.body;

            const transaction = await Transaction.findByIdAndUpdate(
                id,
                {
                    isPaid: true,
                    transactionStatus: 'completed',
                    paidAmount: paidAmount,
                    paidAt: new Date(),
                    paymentMethod,
                    telebirrReference,
                    mpesaReference
                },
                { new: true }
            );

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: "Transaction not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Transaction marked as paid successfully",
                data: transaction
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Error marking transaction as paid",
                error: error.message
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
                if (dateFrom) matchCriteria.transactionDate.$gte = new Date(dateFrom as string);
                if (dateTo) matchCriteria.transactionDate.$lte = new Date(dateTo as string);
            }

            if (userId) matchCriteria.userId = new mongoose.Types.ObjectId(userId as string);
            if (technicianId) matchCriteria.technicianId = new mongoose.Types.ObjectId(technicianId as string);

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
                                    0
                                ]
                            }
                        },
                        totalExpenses: {
                            $sum: {
                                $cond: [
                                    { $in: ["$transactionType", ["withdrawal", "commission", "tip"]] },
                                    "$amount",
                                    0
                                ]
                            }
                        },
                        pendingPayments: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $eq: ["$isPaid", false] }, { $eq: ["$transactionStatus", "pending"] }] },
                                    "$amount",
                                    0
                                ]
                            }
                        },
                        technicianPayouts: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$transactionType", "commission"] },
                                    "$amount",
                                    0
                                ]
                            }
                        },
                        totalTransactions: { $sum: 1 },
                        completedTransactions: {
                            $sum: {
                                $cond: [{ $eq: ["$transactionStatus", "completed"] }, 1, 0]
                            }
                        },
                        failedTransactions: {
                            $sum: {
                                $cond: [{ $eq: ["$transactionStatus", "failed"] }, 1, 0]
                            }
                        },
                        pendingTransactions: {
                            $sum: {
                                $cond: [{ $eq: ["$transactionStatus", "pending"] }, 1, 0]
                            }
                        },
                        averageTransactionAmount: { $avg: "$amount" },
                        totalServiceFees: { $sum: "$serviceFee" },
                        totalVAT: { $sum: "$VAT" },
                        totalTips: { $sum: "$tipAmount" },
                        totalCommissions: { $sum: "$commissionAmount" }
                    }
                }
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
                totalCommissions: 0
            };

            // Calculate net profit
            result.netProfit = result.totalRevenue - result.totalExpenses;

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Error generating financial summary",
                error: error.message
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
                    { path: 'userId', select: 'fullName phoneNumber userCode' },
                    { path: 'technicianId', select: 'fullName phoneNumber' }
                ]
            };

            const transactions = await Transaction.paginate({ jobId }, options);

            return res.status(200).json({
                success: true,
                data: transactions
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Error fetching job transactions",
                error: error.message
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
                    { path: 'userId', select: 'fullName phoneNumber userCode' },
                    { path: 'jobId', select: 'jobTitle jobDescription jobPrice' },
                    { path: 'clientId', select: 'businessName TILLNumber' }
                ]
            };

            const transactions = await Transaction.paginate(filters, options);

            return res.status(200).json({
                success: true,
                data: transactions
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Error fetching technician transactions",
                error: error.message
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
                    transactionStatus: 'cancelled',
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: "Transaction not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Transaction cancelled successfully",
                data: transaction
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Error cancelling transaction",
                error: error.message
            });
        }
    }
} 