import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Question } from "../models/question.js";

const createQuestion = asyncHandler(async (req, res, next) => {
    const { question, answers, selectedCategory } = req.body;

    if (!question || !Array.isArray(answers) || answers.length === 0) {
        throw new ApiError(400, "Invalid request body. Question and answers are required.");
    }

    // Check if at least one answer is marked as correct
    const hasCorrectAnswer = answers.some(answer => answer.isCorrect === true);
    if (!hasCorrectAnswer) {
        throw new ApiError(400, "At least one answer must be marked as correct.");
    }

    try {

        const arrayData = answers;
        const mappedData = arrayData.map(item => ({
            answer: item.answer,
            trueAnswer: item.isCorrect 
        }));

        const createdQuestion = await Question.create({
            category: req.body.selectedCategory,
            question: req.body.question,
            answers: mappedData,
        });

        const responseData = new ApiResponse(200, createdQuestion, "Question created successfully");

        return res.status(200).json(responseData);
    } catch (error) {
        console.error("Error creating question:", error);
        throw new ApiError(500, "Something went wrong while creating the question");
    }
});

const getQuestion = asyncHandler(async (req, res, next) => {
    try {
        const category = req.query.category;
     
        // Define the pipeline stages for the aggregation
        const pipeline = [
            // Stage 1: Match documents based on the category
            { $match: { category: category } },
            // Stage 2: Sample random questions from the matched documents
            { $sample: { size: 5 } }
        ];

        const randomQuestions = await Question.aggregate(pipeline);

        if (!randomQuestions || randomQuestions.length === 0) {
            throw new ApiError(404, "No random questions found for the specified category");
        }

        const responseData = new ApiResponse(200, randomQuestions, "Random questions retrieved successfully");

        return res.status(200).json(responseData);
    } catch (error) {
        next(error);
    }
});


export {
    createQuestion,
    getQuestion
};
