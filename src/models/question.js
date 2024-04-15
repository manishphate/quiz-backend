import mongoose, { Schema } from 'mongoose';

const answerSchema = new Schema({
    answer: {
      type: String,
      required: true
    },
    trueAnswer: {
      type: Boolean,
      required: true
    }
  });
  
  const questionSchema = new Schema(
    {
      category:{
        type: String,
        required: true
      },
      question: {
        type: String,
        required: true
      },
      answers: {
        type: [answerSchema],
        required: true
      }
    },
    { timestamps: true }
  );

export const Question = mongoose.model("Question", questionSchema);