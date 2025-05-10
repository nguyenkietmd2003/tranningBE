import mongoose from "mongoose";

const datasetSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    filepath: {
      type: String,
      required: true,
    },
    filetype: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: false,
  }
);

const Dataset = mongoose.model("Dataset", datasetSchema);

export default Dataset;
