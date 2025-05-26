import {
    type QueryOptions,
    type UpdateQuery,
    type FilterQuery,
    type Document,
    type Types,
    type ProjectionType,
    ObjectExpressionOperatorReturningObject,
  } from "mongoose";

  import {type PermissionGroup} from "./permission_group";

  export interface IJobs {
    _id: Types.ObjectId;
    jobTitle: string;
    jobDescription: string;
    jobType: string;
    jobCategory: string;
    jobLocation: string;
    jobPrice: string;
    jobStatus: string;
    jobCreatedAt: Date;
    jobUpdatedAt: Date;
    jobDeletedAt: Date;
    jobCreatedBy: Types.ObjectId;
    jobUpdatedBy: Types.ObjectId;
    jobDeletedBy: Types.ObjectId;
    jobServiceType: string;
    jobServiceCategory: string;
    jobServiceLocation: string;
    jobFee: string;
    jobAdditionalFee: string;
    jobServiceExperience: string;
    jobServiceEducation: string;
    jobServiceSkills: string[];
    jobUrgencyLevel: string;
    jobUrgencyDate: Date;
    jobUrgencyTime: Date;
    jobCreatedBy: Types.ObjectId;
    jobUpdatedBy: Types.ObjectId;
    jobDeletedBy: Types.ObjectId;
    jobAssignedTechnician: Types.ObjectId;
    jobAssignedTechnicianName: string;
    jobAssignedTechnicianPhone: string;
    jobAssignedTechnicianEmail: string;
    jobAssignedTechnicianAddress: string;
    jobAssignedTechnicianCity: string;
    jobAssignedTechnicianState: string;
    jobImages: string[];
  }

  export type Jobs = IJobs & Document;

  export interface JobsFilter extends FilterQuery<Jobs> {}

  export interface JobsProjection extends ProjectionType<Jobs> {}

  export interface JobsOptions extends QueryOptions<Jobs> {}

  export interface JobsUpdate extends UpdateQuery<Jobs> {}

  export type JobsCallback = (err: any, jobs: Jobs | null) => void;

  export type JobsCollectionCallback = (err: any, jobs: Jobs[] | null) => void;