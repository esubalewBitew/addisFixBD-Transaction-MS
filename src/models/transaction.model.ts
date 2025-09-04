import mongoose from "mongoose";
import paginator from "mongoose-paginate-v2";
import { type Transaction } from "../config/types/transaction";

const transactionSchema = new mongoose.Schema({
    // Core Transaction Identifiers
    transactionID: {
        type: String,
        required: true,
        unique: true,
    },
    FTNumber: {
        type: String,
        required: false,
    },
    
    // User and Client Information
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    userCode: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    
    // Job Related Information
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Jobs",
    },
    jobTitle: {
        type: String,
    },
    technicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    technicianName: {
        type: String,
    },
    technicianPhone: {
        type: String,
    },
    
    // Account Information
    debitAccountNumber: {
        type: String,
        required: false,
    },
    debitAccountHolderName: {
        type: String,
        required: true,
    },
    creditAccountNumber: {
        type: String,
        required: true,
    },
    creditAccountHolderName: {
        type: String,
        required: false,
    },
    creditPhoneNumber: {
        type: String,
    },
    
    // Financial Details
    amount: {
        type: Number,
        required: true,
    },
    totalAmount: {
        type: Number,
    },
    paidAmount: {
        type: Number,
    },
    serviceFee: {
        type: Number,
        default: 0,
    },
    facilitationFee: {
        type: Number,
        default: 0,
    },
    VAT: {
        type: Number,
        default: 0,
    },
    tipAmount: {
        type: Number,
        default: 0,
    },
    deliveryAmount: {
        type: Number,
        default: 0,
    },
    commissionAmount: {
        type: Number,
        default: 0,
    },
    currency: {
        type: String,
        default: "ETB",
    },
    
    // Transaction Type and Status
    transactionType: {
        type: String,
        enum: ["deposit", "withdrawal", "transfer", "payment", "refund", "commission", "tip"],
        required: true,
    },
    transactionStatus: {
        type: String,
        enum: ["pending", "completed", "failed", "cancelled", "processing"],
        required: true,
        default: "pending",
    },
    paymentMethod: {
        type: String,
        enum: ["telebirr", "mpesa", "bank_transfer", "cash", "wallet"],
    },
    
    // Payment Status Flags
    isPaid: {
        type: Boolean,
        default: false,
    },
    isExpired: {
        type: Boolean,
        default: false,
    },
    isFailed: {
        type: Boolean,
        default: false,
    },
    isReversed: {
        type: Boolean,
        default: false,
    },
    
    // Service and Business Related
    isOwnTransfer: {
        type: Boolean,
        default: false,
    },
    isMerchant: {
        type: Boolean,
        default: false,
    },
    isTipPayment: {
        type: Boolean,
        default: false,
    },
    isRequest: {
        type: Boolean,
        default: false,
    },
    requestStatus: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
    },
    requestID: {
        type: String,
    },
    
    // Bank and External Service Information
    bankName: {
        type: String,
    },
    BCICode: {
        type: String,
    },
    isDashenBank: {
        type: Boolean,
        default: false,
    },
    
    // Agent and Branch Information
    agentCode: {
        type: String,
    },
    agentName: {
        type: String,
    },
    TILLNumber: {
        type: String,
    },
    branchCode: {
        type: String,
    },
    businessId: {
        type: String,
    },
    
    // External References
    telebirrReference: {
        type: String,
    },
    mpesaReference: {
        type: String,
    },
    incomingReference: {
        type: String,
    },
    
    // Technical and Response Data
    coreResponse: {
        type: mongoose.Schema.Types.Mixed,
    },
    extRefResponse: {
        type: mongoose.Schema.Types.Mixed,
    },
    reverseResponse: {
        type: mongoose.Schema.Types.Mixed,
    },
    extRefStatus: {
        type: String,
    },
    
    // Dates
    transactionDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    dueDate: {
        type: Date,
    },
    paidAt: {
        type: Date,
    },
    
    // Additional Information
    transactionReason: {
        type: String,
        required: true,
    },
    
    // Saving and GL Action
    isSaved: {
        type: Boolean,
        default: false,
    },
    savingCode: {
        type: String,
        default: "",
    },
    GLActionType: {
        type: String,
        default: "",
    },
    isGLActionCreditType: {
        type: Boolean,
        default: false,
    },
    isGLActionDebitType: {
        type: Boolean,
        default: false,
    },
    
    // Incoming Transaction Flags
    isIncoming: {
        type: Boolean,
        default: false,
    },
    incomingSource: {
        type: String,
    },
    
    // Three Click Up Feature
    isThreeClickUp: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true, // This adds createdAt and updatedAt automatically
});

// Add pagination plugin
transactionSchema.plugin(paginator);

// Indexes for better query performance
transactionSchema.index({ transactionID: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ jobId: 1 });
transactionSchema.index({ technicianId: 1 });
transactionSchema.index({ transactionStatus: 1 });
transactionSchema.index({ transactionType: 1 });
transactionSchema.index({ transactionDate: -1 });
transactionSchema.index({ isPaid: 1 });
transactionSchema.index({ clientId: 1 });

// Pre-save middleware to generate transaction ID if not provided
transactionSchema.pre("save", function(next) {
    if (!this.transactionID) {
        this.transactionID = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set totalAmount if not provided
    if (!this.totalAmount) {
        this.totalAmount = (this.amount || 0) + (this.serviceFee || 0) + (this.VAT || 0) + (this.tipAmount || 0);
    }
    
    next();
});

const Transaction = mongoose.model<Transaction>("Transaction", transactionSchema);

export default Transaction;