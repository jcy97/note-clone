import mongoose, { Document, Schema } from "mongoose";

interface IBlock {
  id: string;
  type: "text" | "table" | "code";
  content: string;
  position: number;
}

interface IPage extends Document {
  title: string;
  blocks: IBlock[];
  createdAt: Date;
  updatedAt: Date;
}

const BlockSchema = new Schema<IBlock>({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ["text", "table", "code"],
    default: "text",
    required: true,
  },
  content: { type: String, default: "" },
  position: { type: Number, default: 0 },
});

const PageSchema = new Schema<IPage>(
  {
    title: {
      type: String,
      default: "Untitled",
      trim: true,
      maxlength: 200,
    },
    blocks: {
      type: [BlockSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: process.env.DB_NAME ? `${process.env.DB_NAME}_pages` : "pages",
  }
);

PageSchema.index({ updatedAt: -1 });
PageSchema.index({ title: "text" });

export const Page = mongoose.model<IPage>("Page", PageSchema);
