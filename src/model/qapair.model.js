import mongoose from "mongoose";

const qaPairSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
       questionVector: {
      type: [Number]
    },
  },
  {
    timestamps: false,
  }
);
const QAPair = mongoose.model("QAPair", qaPairSchema);

export default QAPair;
