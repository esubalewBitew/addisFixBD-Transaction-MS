import modules from "./imports/index";
import { Types, type PaginateModel } from "mongoose";
import { type Jobs } from "../config/types/jobs";

const Schema = modules.mongoose.Schema;

const JobsSchema = new Schema<Jobs>({
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },
    jobType: { type: String, required: true },
    jobCategory: { type: String, required: true },
    jobLocation: { type: String, required: true },
    jobStatus: { type: String, required: true },
    jobCreatedAt: { type: Date, required: true },
    jobUpdatedAt: { type: Date, required: true },
    jobDeletedAt: { type: Date, required: true },
    jobPrice: { type: String, required: true },
    jobAdditionalFee: { type: String,},
    jobServiceType: { type: String, required: true },
    jobServiceCategory: { type: String },
    jobServiceLocation: { type: String, required: true },
    jobServiceExperience: { type: String, required: true },
    jobUrgencyLevel: { type: String },
    jobUrgencyDate: { type: Date,},
    jobUrgencyTime: { type: Date},
    jobServiceSkills: { type: [String]},
    jobAssignedTechnician: { type: Schema.Types.ObjectId, ref: 'User' },
    jobCreatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    jobUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    jobDeletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    jobAssignedTechnicianName: { type: String },
    jobAssignedTechnicianPhone: { type: String },
    jobAssignedTechnicianEmail: { type: String },
    jobAssignedTechnicianAddress: { type: String },
    jobAssignedTechnicianCity: { type: String },
    jobAssignedTechnicianState: { type: String },
    jobImages: { type: [String] },
});

JobsSchema.plugin(modules.paginator);

JobsSchema.pre<Jobs>("save", function preSaveMiddleware(next) {
    const now = modules.moment().toDate();

    this.jobCreatedAt = now;
    this.jobUpdatedAt = now;
    this.jobDeletedAt = now;
    next();
});

const Jobs = modules.mongoose.model<Jobs, PaginateModel<Jobs>>("Jobs", JobsSchema);

export default Jobs;