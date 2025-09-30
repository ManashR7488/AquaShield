import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

const Counter = mongoose.model('Counter', counterSchema);

// Helper function to get next sequence number
const getNextSequence = async (key) => {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return counter.seq;
};

export { Counter, getNextSequence };