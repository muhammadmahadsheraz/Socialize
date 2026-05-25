import { Schema, model, Document } from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption';

export interface IVerificationRecord extends Document {
  userId: Schema.Types.ObjectId;
  nationalId: string;
  fullName: string;
  dateOfBirth?: Date;
  rawOcrText: string;
  riskScore: number;
  violations: string[];
  status: 'approved' | 'rejected' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

const VerificationRecordSchema = new Schema<IVerificationRecord>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dateOfBirth: { type: Date, required: false },
  nationalId: { 
    type: String, 
    required: true, 
    set: (v: string) => encrypt(v) || v, 
    get: (v: string) => decrypt(v) || v 
  },
  fullName: { 
    type: String, 
    required: true, 
    set: (v: string) => encrypt(v) || v, 
    get: (v: string) => decrypt(v) || v 
  },

  rawOcrText: { 
    type: String, 
    required: true, 
    set: (v: string) => encrypt(v) || v, 
    get: (v: string) => decrypt(v) || v 
  },
  riskScore: { type: Number, required: true },
  violations: { type: [String], default: [] },
  status: { type: String, enum: ['approved', 'rejected', 'pending'], default: 'pending' },
}, { 
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

export default model<IVerificationRecord>('VerificationRecord', VerificationRecordSchema);
