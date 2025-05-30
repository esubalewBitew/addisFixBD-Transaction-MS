import { Document, Types } from "mongoose";

export interface Transaction extends Document {
    // Core Transaction Identifiers
    transactionID: string;
    FTNumber: string;
    
    // User and Client Information
    userId: Types.ObjectId;
    userCode: string;
    phoneNumber?: string;
    clientId?: Types.ObjectId;
    
    // Job Related Information
    jobId?: Types.ObjectId;
    jobTitle?: string;
    technicianId?: Types.ObjectId;
    technicianName?: string;
    technicianPhone?: string;
    
    // Account Information
    debitAccountNumber: string;
    debitAccountHolderName: string;
    creditAccountNumber: string;
    creditAccountHolderName: string;
    creditPhoneNumber?: string;
    
    // Financial Details
    amount: number;
    totalAmount?: number;
    paidAmount?: number;
    serviceFee?: number;
    facilitationFee?: number;
    VAT?: number;
    tipAmount?: number;
    deliveryAmount?: number;
    commissionAmount?: number;
    currency: string;
    
    // Transaction Type and Status
    transactionType: "deposit" | "withdrawal" | "transfer" | "payment" | "refund" | "commission" | "tip";
    transactionStatus: "pending" | "completed" | "failed" | "cancelled" | "processing";
    paymentMethod?: "telebirr" | "mpesa" | "bank_transfer" | "cash" | "wallet";
    
    // Payment Status Flags
    isPaid: boolean;
    isExpired: boolean;
    isFailed: boolean;
    isReversed: boolean;
    
    // Service and Business Related
    isOwnTransfer: boolean;
    isMerchant: boolean;
    isTipPayment: boolean;
    isRequest: boolean;
    requestStatus?: "pending" | "accepted" | "rejected";
    requestID?: string;
    
    // Bank and External Service Information
    bankName?: string;
    BCICode?: string;
    isDashenBank: boolean;
    
    // Agent and Branch Information
    agentCode?: string;
    agentName?: string;
    TILLNumber?: string;
    branchCode?: string;
    businessId?: string;
    
    // External References
    telebirrReference?: string;
    mpesaReference?: string;
    incomingReference?: string;
    
    // Technical and Response Data
    coreResponse?: any;
    extRefResponse?: any;
    reverseResponse?: any;
    extRefStatus?: string;
    
    // Dates
    transactionDate: Date;
    dueDate?: Date;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    
    // Additional Information
    transactionReason: string;
    
    // Saving and GL Action
    isSaved: boolean;
    savingCode: string;
    GLActionType: string;
    isGLActionCreditType: boolean;
    isGLActionDebitType: boolean;
    
    // Incoming Transaction Flags
    isIncoming: boolean;
    incomingSource?: string;
    
    // Three Click Up Feature
    isThreeClickUp: boolean;
}

// Transaction creation interface (for creating new transactions)
export interface CreateTransactionInput {
    FTNumber: string;
    userId: string | Types.ObjectId;
    userCode: string;
    phoneNumber?: string;
    clientId?: string | Types.ObjectId;
    jobId?: string | Types.ObjectId;
    jobTitle?: string;
    technicianId?: string | Types.ObjectId;
    technicianName?: string;
    technicianPhone?: string;
    debitAccountNumber: string;
    debitAccountHolderName: string;
    creditAccountNumber: string;
    creditAccountHolderName: string;
    creditPhoneNumber?: string;
    amount: number;
    serviceFee?: number;
    facilitationFee?: number;
    VAT?: number;
    tipAmount?: number;
    deliveryAmount?: number;
    commissionAmount?: number;
    currency?: string;
    transactionType: "deposit" | "withdrawal" | "transfer" | "payment" | "refund" | "commission" | "tip";
    paymentMethod?: "telebirr" | "mpesa" | "bank_transfer" | "cash" | "wallet";
    transactionReason: string;
    bankName?: string;
    BCICode?: string;
    agentCode?: string;
    agentName?: string;
    TILLNumber?: string;
    branchCode?: string;
    businessId?: string;
    dueDate?: Date;
    isOwnTransfer?: boolean;
    isMerchant?: boolean;
    isTipPayment?: boolean;
    isRequest?: boolean;
    requestID?: string;
}

// Transaction update interface
export interface UpdateTransactionInput {
    transactionStatus?: "pending" | "completed" | "failed" | "cancelled" | "processing";
    isPaid?: boolean;
    isExpired?: boolean;
    isFailed?: boolean;
    isReversed?: boolean;
    paidAmount?: number;
    paidAt?: Date;
    requestStatus?: "pending" | "accepted" | "rejected";
    coreResponse?: any;
    extRefResponse?: any;
    reverseResponse?: any;
    extRefStatus?: string;
    telebirrReference?: string;
    mpesaReference?: string;
    incomingReference?: string;
}

// Transaction query filters
export interface TransactionFilters {
    userId?: string | Types.ObjectId;
    clientId?: string | Types.ObjectId;
    jobId?: string | Types.ObjectId;
    technicianId?: string | Types.ObjectId;
    transactionType?: string | string[];
    transactionStatus?: string | string[];
    paymentMethod?: string | string[];
    isPaid?: boolean;
    isExpired?: boolean;
    isFailed?: boolean;
    isReversed?: boolean;
    isMerchant?: boolean;
    isRequest?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    amountMin?: number;
    amountMax?: number;
    bankName?: string;
    agentCode?: string;
    branchCode?: string;
    businessId?: string;
}

// Transaction summary interface for financial overview
export interface TransactionSummary {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    pendingPayments: number;
    technicianPayouts: number;
    totalTransactions: number;
    completedTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
    averageTransactionAmount: number;
    totalServiceFees: number;
    totalVAT: number;
    totalTips: number;
    totalCommissions: number;
} 