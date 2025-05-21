import mongoose from "mongoose";

const datasetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    fileId: {
      type: String, // Ví dụ ID từ Dropbox hoặc hệ thống của bạn
      required: true,
      unique: true,
    },
    isFinetuned: {
      type: Boolean,
      default: false, // false: chưa fine-tune | true: đã fine-tune
    },
  },
  {
    timestamps: false,
  }
);

const Dataset = mongoose.model("Dataset", datasetSchema);
export default Dataset;
