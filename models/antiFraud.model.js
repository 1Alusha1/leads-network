import mongoose from 'mongoose';

const { Schema } = mongoose;

const antiFraudSchema = new Schema({
  phone: { type: String, unique: true, required: true },
  email: String,
});

const smsCodeSchema = new Schema({
  code: { type: String, required: true },
});

const smsCode = mongoose.model('smsCode', smsCodeSchema);
export { smsCode };
export default mongoose.model('antiFraud', antiFraudSchema);
