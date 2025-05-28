import modules from "./imports/index";
import { Types, type PaginateModel } from "mongoose";
import { type Service } from "../config/types/services";

const Schema = modules.mongoose.Schema;

const ServiceSchema = new Schema<Service>({
    serviceName: { type: String, required: true },
    serviceDescription: { type: String, required: true },
    servicePrice: { type: Number,},
    serviceStatus: { type: String, required: true },
    serviceCreatedAt: { type: Date, required: true },
    serviceUpdatedAt: { type: Date },
    serviceDeletedAt: { type: Date },
    serviceCreatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    serviceUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    serviceDeletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    serviceType: { type: String, required: true },
    serviceCategory: { type: String, required: true },
    serviceEducation: { type: String},
    serviceUrgencyLevel: { type: String},
    serviceActiveJobs: { type: Number},
    serviceCompletedJobs: { type: Number},
    serviceCancelledJobs: { type: Number},
});

ServiceSchema.plugin(modules.paginator);

ServiceSchema.pre<Service>("save", function preSaveMiddleware(next) {
    const now = modules.moment().toDate();
    this.serviceCreatedAt = now;
    this.serviceUpdatedAt = now;
    next();
});

const Services = modules.mongoose.model<Service, PaginateModel<Service>>("Services", ServiceSchema);

export default Services;