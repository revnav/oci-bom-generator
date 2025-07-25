import React, { useState, useEffect } from 'react';
import { 
  QuestionMarkCircleIcon, 
  ChatBubbleBottomCenterTextIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

const FollowUpQuestions = ({ questions, answers, onAnswersChange, onSubmit, isLoading }) => {
  const [localAnswers, setLocalAnswers] = useState(answers || {});
  const [completedQuestions, setCompletedQuestions] = useState(new Set());

  useEffect(() => {
    setLocalAnswers(answers || {});
  }, [answers]);

  const handleAnswerChange = (questionId, answer) => {
    const newAnswers = { ...localAnswers, [questionId]: answer };
    setLocalAnswers(newAnswers);
    onAnswersChange(newAnswers);

    // Mark question as completed when it has a non-empty answer
    if (answer.trim()) {
      setCompletedQuestions(prev => new Set([...prev, questionId]));
    } else {
      setCompletedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const allQuestionsAnswered = questions.every(
    (_, index) => localAnswers[index] && localAnswers[index].trim()
  );

  const getQuestionIcon = (index) => {
    if (completedQuestions.has(index)) {
      return <CheckIcon className="w-5 h-5 text-green-600" />;
    }
    return <QuestionMarkCircleIcon className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-yellow-600" />
        <div>
          <h3 className="text-lg font-medium text-yellow-900">
            Please provide additional details
          </h3>
          <p className="text-sm text-yellow-700">
            To generate an accurate BOM, we need some clarification on your requirements.
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-lg p-3 border border-yellow-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress:</span>
          <span className="font-medium text-gray-900">
            {completedQuestions.size} of {questions.length} questions answered
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedQuestions.size / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div 
            key={index}
            className={`bg-white rounded-lg border-2 p-4 transition-colors ${
              completedQuestions.has(index) 
                ? 'border-green-200 bg-green-50' 
                : 'border-yellow-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              {getQuestionIcon(index)}
              <div className="flex-1">
                <label 
                  htmlFor={`question-${index}`}
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Question {index + 1}: {typeof question === 'string' ? question : question.question}
                  {typeof question !== 'string' && question.area && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {question.area}
                    </span>
                  )}
                </label>
                <textarea
                  id={`question-${index}`}
                  value={localAnswers[index] || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Type your answer here..."
                />
                
                {/* Character count */}
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {(localAnswers[index] || '').length} characters
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for better answers:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Be as specific as possible with numbers and requirements</li>
          <li>• Include any constraints or preferences you have</li>
          <li>• Mention if you're unsure - we can provide recommendations</li>
          <li>• Consider future growth and scalability needs</li>
        </ul>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-600">
          {allQuestionsAnswered ? (
            <span className="text-green-600 font-medium">
              ✅ All questions answered - ready to generate BOM
            </span>
          ) : (
            <span>
              Please answer all questions to continue
            </span>
          )}
        </div>
        
        <button
          onClick={onSubmit}
          disabled={!allQuestionsAnswered || isLoading}
          className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Generating BOM...</span>
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5" />
              <span>Continue with BOM Generation</span>
            </>
          )}
        </button>
      </div>

      {/* Validation Messages */}
      {!allQuestionsAnswered && (
        <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3">
          ⚠️ Please answer all questions above to proceed with BOM generation.
        </div>
      )}
    </div>
  );
};

export default FollowUpQuestions;