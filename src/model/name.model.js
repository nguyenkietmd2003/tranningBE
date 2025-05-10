import mongoose from "mongoose";

const nameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: false,
  }
);

const Name = mongoose.model("Name", nameSchema);

export default Name;
