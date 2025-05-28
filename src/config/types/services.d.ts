import {
    type QueryOptions,
    type UpdateQuery,
    type FilterQuery,
    type Document,
    type Types,
  } from "mongoose";    

  import {type PermissionGroup} from "./permission_group";

  export interface IService {
    _id: Types.ObjectId;
    serviceName: string;
    serviceDescription: string;
    servicePrice: number;
    serviceStatus: string;
    serviceCreatedAt: Date;
    serviceUpdatedAt: Date;
    serviceDeletedAt: Date;
    serviceCreatedBy: Types.ObjectId;
    serviceUpdatedBy: Types.ObjectId;
    serviceDeletedBy: Types.ObjectId;
    serviceType: string;
    serviceCategory: string;
    serviceExperience: string;
    serviceEducation: string;
    serviceUrgencyLevel: string;
    serviceActiveJobs: number;
    serviceCompletedJobs: number;
    serviceCancelledJobs: number;
  }

  export type Service = IService & Document;

  export interface ServiceFilter extends FilterQuery<Service> {}

  export interface ServiceProjection extends ProjectionType<Service> {}