import mongoose from 'mongoose';

const { Schema } = mongoose;

const LinkMonito = new Schema({
  chat_id: String,
  link: String,
});

export default mongoose.model('LinkMonito', LinkMonito);
