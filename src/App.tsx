import { useState, useEffect } from 'react'
import questionsData from './data/questions.json'
import './App.css'

interface Question {
  id: number
  sentence: string
  options: string[]
  correctAnswer: string
}

interface Answer {
  question: Question
  answer: string
  markedForReview: boolean
}

function App() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState(30)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isGameOver, setIsGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [randomQuestions, setRandomQuestions] = useState<Question[]>([])
  const [showResponseOverview, setShowResponseOverview] = useState(false)
  const [showingCorrectAnswer, setShowingCorrectAnswer] = useState(false)
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set())
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [score, setScore] = useState(0)
  const [animateScore, setAnimateScore] = useState(false)

  // Animation states
  const [questionEnter, setQuestionEnter] = useState(false)
  const [optionSelected, setOptionSelected] = useState(false)

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const currentQuestion = randomQuestions[currentQuestionIndex]

  useEffect(() => {
    if (gameStarted && !isGameOver) {
      setQuestionEnter(true)
      const timer = setTimeout(() => setQuestionEnter(false), 500)
      return () => clearTimeout(timer)
    }
  }, [currentQuestionIndex, gameStarted, isGameOver])

  useEffect(() => {
    if (timeLeft > 0 && !isGameOver && gameStarted && !showingCorrectAnswer) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !isGameOver && gameStarted && !showingCorrectAnswer) {
      setShowingCorrectAnswer(true)
      setTimeout(() => {
        setShowingCorrectAnswer(false)
        handleNextQuestion()
      }, 2000)
    }
  }, [timeLeft, isGameOver, gameStarted, showingCorrectAnswer])

  useEffect(() => {
    if (isGameOver) {
      const calculatedScore = answers.reduce((score, current) => {
        return current.answer === current.question.correctAnswer ? score + 1 : score
      }, 0)
      setScore(calculatedScore)
      setAnimateScore(true)
      const timer = setTimeout(() => setAnimateScore(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [isGameOver, answers])

  const handleAnswerSelect = (answer: string) => {
    if (!showingCorrectAnswer) {
      setSelectedAnswer(answer)
      setOptionSelected(true)
      setTimeout(() => setOptionSelected(false), 300)
    }
  }

  const toggleMarkForReview = () => {
    const newSet = new Set(markedForReview)
    if (newSet.has(currentQuestionIndex)) {
      newSet.delete(currentQuestionIndex)
    } else {
      newSet.add(currentQuestionIndex)
      setAnswers([...answers, { 
        question: currentQuestion, 
        answer: 'Marked for later',
        markedForReview: true
      }])
      setSelectedAnswer('')
      setTimeLeft(30)
      
      const nextIndex = findNextUnansweredQuestion(currentQuestionIndex, newSet)
      if (nextIndex !== -1) {
        setCurrentQuestionIndex(nextIndex)
      } else {
        startReviewMode()
      }
    }
    setMarkedForReview(newSet)
  }

  const findNextUnansweredQuestion = (currentIndex: number, markedSet: Set<number>) => {
    // Check questions after current
    for (let i = currentIndex + 1; i < randomQuestions.length; i++) {
      if (!markedSet.has(i) && !answers.some(a => a.question.id === randomQuestions[i].id)) {
        return i
      }
    }
    
    // Check questions before current
    for (let i = 0; i < currentIndex; i++) {
      if (!markedSet.has(i) && !answers.some(a => a.question.id === randomQuestions[i].id)) {
        return i
      }
    }
    
    return -1
  }

  const handleNextQuestion = () => {
    const currentAnswer = {
      question: currentQuestion,
      answer: selectedAnswer || 'No answer',
      markedForReview: markedForReview.has(currentQuestionIndex)
    }

    const updatedAnswers = [...answers, currentAnswer]
    setAnswers(updatedAnswers)

    if (currentQuestionIndex < randomQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer('')
      setTimeLeft(30)
    } else {
      const markedAnswers = updatedAnswers.filter(a => a.answer === 'Marked for later')
      if (markedAnswers.length > 0) {
        startReviewMode(updatedAnswers)
      } else {
        setIsGameOver(true)
      }
    }
  }

  const startGame = () => {
    const shuffled = shuffleArray(questionsData.questions)
    setRandomQuestions(shuffled.slice(0, 10))
    setGameStarted(true)
    setTimeLeft(30)
    setMarkedForReview(new Set())
    setScore(0)
    setIsGameOver(false)
    setCurrentQuestionIndex(0)
    setSelectedAnswer('')
    setAnswers([])
    setShowResponseOverview(false)
    setShowingCorrectAnswer(false)
    setIsReviewMode(false)
  }

  const restartGame = () => {
    startGame()
  }

  const startReviewMode = (currentAnswers: Answer[] = answers) => {
    const markedAnswers = currentAnswers.filter(a => a.answer === 'Marked for later')
    const remainingAnswers = currentAnswers.filter(a => a.answer !== 'Marked for later')
    
    setAnswers(remainingAnswers)
    setRandomQuestions(markedAnswers.map(a => a.question))
    setCurrentQuestionIndex(0)
    setSelectedAnswer('')
    setTimeLeft(30)
    setIsGameOver(false)
    setShowResponseOverview(false)
    setShowingCorrectAnswer(false)
    setMarkedForReview(new Set())
    setIsReviewMode(true)
  }

  const getScoreColor = () => {
    const percentage = score / (randomQuestions.length - answers.filter(a => a.answer === 'Marked for later').length)
    if (percentage >= 0.8) return 'text-emerald-400'
    if (percentage >= 0.6) return 'text-amber-400'
    return 'text-rose-400'
  }

  const getScoreMessage = () => {
    const percentage = score / (randomQuestions.length - answers.filter(a => a.answer === 'Marked for later').length)
    if (percentage >= 0.8) return 'Outstanding performance!'
    if (percentage >= 0.6) return 'Good job, keep improving!'
    return 'Keep practicing, you\'ll get better!'
  }

  const getScoreEmoji = () => {
    const percentage = score / (randomQuestions.length - answers.filter(a => a.answer === 'Marked for later').length)
    if (percentage >= 0.8) return '🎉'
    if (percentage >= 0.6) return '👍'
    return '💪'
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="w-full max-w-2xl bg-gray-800/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-700 relative z-10 transform transition-all hover:scale-[1.01]">
          <h1 className="text-4xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Sentence Master
          </h1>
          
          <div className="space-y-6 mb-8">
            <p className="text-lg text-gray-300 text-center">
              Test your language skills by completing sentences with the correct words.
            </p>
            
            <div className="bg-gray-700/50 p-6 rounded-xl backdrop-blur-sm border border-gray-600">
              <h2 className="text-xl font-semibold mb-4 text-blue-400">How to Play:</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">1</span>
                  Complete 10 sentences by filling in the blanks
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">2</span>
                  Choose from 4 options for each blank
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">3</span>
                  You have 30 seconds per question
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-1 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">4</span>
                  Mark questions for review to check them later
                </li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
          >
            Start Challenge
          </button>
        </div>
      </div>
    )
  }

  if (isGameOver) {
    const correctAnswers = answers.filter(a => a.answer === a.question.correctAnswer)
    const incorrectAnswers = answers.filter(a => a.answer !== a.question.correctAnswer && a.answer !== 'Marked for later')
    const markedQuestions = answers.filter(a => a.answer === 'Marked for later')

    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-4xl mx-auto bg-gray-800/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-700 relative z-10">
          <h1 className="text-3xl font-bold text-center mb-6">
            {isReviewMode ? 'Review Complete!' : 'Quiz Complete!'}
          </h1>
          
          <div className="bg-gray-700/50 p-8 rounded-xl mb-8 border border-gray-600">
            <div className="text-center mb-6">
              <div className={`text-6xl font-bold mb-4 ${getScoreColor()} ${animateScore ? 'animate-bounce' : ''}`}>
                {score} <span className="text-2xl text-gray-400">/ {randomQuestions.length - markedQuestions.length}</span>
              </div>
              <div className="text-2xl mb-2">{getScoreEmoji()}</div>
              <p className="text-xl text-gray-300">{getScoreMessage()}</p>
              {markedQuestions.length > 0 && !isReviewMode && (
                <p className="mt-4 text-amber-400">
                  You marked {markedQuestions.length} question{markedQuestions.length > 1 ? 's' : ''} for review
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-emerald-900/30 p-4 rounded-lg border border-emerald-800 text-center">
                <p className="text-3xl font-bold text-emerald-400">{correctAnswers.length}</p>
                <p className="text-sm text-emerald-300">Correct Answers</p>
              </div>
              <div className="bg-rose-900/30 p-4 rounded-lg border border-rose-800 text-center">
                <p className="text-3xl font-bold text-rose-400">{incorrectAnswers.length}</p>
                <p className="text-sm text-rose-300">Incorrect Answers</p>
              </div>
              <div className="bg-amber-900/30 p-4 rounded-lg border border-amber-800 text-center">
                <p className="text-3xl font-bold text-amber-400">{markedQuestions.length}</p>
                <p className="text-sm text-amber-300">Marked for Review</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={() => setShowResponseOverview(!showResponseOverview)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg font-semibold transition-all"
            >
              {showResponseOverview ? 'Hide Details' : 'Show Details'}
            </button>
            {!isReviewMode && markedQuestions.length > 0 && (
              <button
                onClick={() => startReviewMode()}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white p-4 rounded-lg font-semibold transition-all"
              >
                Review Marked Questions
              </button>
            )}
            <button
              onClick={restartGame}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-lg font-semibold transition-all"
            >
              {isReviewMode ? 'New Quiz' : 'Try Again'}
            </button>
          </div>

          {showResponseOverview && (
            <div className="space-y-4">
              {answers.map((answer, index) => (
                <div 
                  key={index}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    answer.answer === answer.question.correctAnswer
                      ? 'border-emerald-500/30 bg-emerald-900/10'
                      : 'border-rose-500/30 bg-rose-900/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium text-gray-400">
                        Q{index + 1}
                      </span>
                      {answer.markedForReview && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-800">
                          Marked
                        </span>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      answer.answer === answer.question.correctAnswer
                        ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800'
                        : answer.answer === 'No answer'
                        ? 'bg-gray-700 text-gray-300 border border-gray-600'
                        : 'bg-rose-900/30 text-rose-400 border border-rose-800'
                    }`}>
                      {answer.answer === answer.question.correctAnswer 
                        ? 'Correct' 
                        : answer.answer === 'No answer'
                        ? 'Skipped'
                        : 'Incorrect'}
                    </span>
                  </div>
                  
                  <p className="text-lg font-medium mb-4 text-gray-200">
                    {answer.question.sentence.split('___').map((part, idx, arr) => (
                      <span key={idx}>
                        {part}
                        {idx < arr.length - 1 && (
                          <span className={`inline-block px-3 py-1 mx-1 rounded font-bold ${
                            answer.answer === answer.question.correctAnswer
                              ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800'
                              : answer.answer === 'No answer'
                              ? 'bg-gray-700 text-gray-300 border border-gray-600'
                              : 'bg-rose-900/30 text-rose-300 border border-rose-800'
                          }`}>
                            {answer.answer}
                          </span>
                        )}
                      </span>
                    ))}
                  </p>
                  
                  {answer.answer !== answer.question.correctAnswer && (
                    <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400">
                        Correct answer: {' '}
                        <span className="font-semibold text-emerald-400">
                          {answer.question.correctAnswer}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 relative overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-2xl mx-auto bg-gray-800/90 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700 relative z-10">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-400">
              Question {currentQuestionIndex + 1} of {randomQuestions.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMarkForReview}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  markedForReview.has(currentQuestionIndex)
                    ? 'bg-amber-900/30 text-amber-400 border border-amber-800'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600'
                }`}
              >
                <svg 
                  className="w-4 h-4"
                  fill={markedForReview.has(currentQuestionIndex) ? "currentColor" : "none"}
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                {markedForReview.has(currentQuestionIndex) ? 'Marked' : 'Mark'}
              </button>
              <span className={`flex items-center gap-1 text-sm font-medium ${
                timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-blue-400'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {timeLeft}s
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                timeLeft <= 10 ? 'bg-rose-500' : 'bg-blue-500'
              }`}
              style={{ 
                width: `${(timeLeft / 30) * 100}%`,
                transition: 'width 1s linear'
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className={`mb-8 bg-gray-700/50 p-6 rounded-xl border border-gray-600 transition-all ${
          questionEnter ? 'animate-fadeIn' : ''
        }`}>
          <h2 className="text-xl sm:text-2xl font-medium mb-6 text-gray-200">
            {currentQuestion.sentence.split('___').map((part, idx, arr) => (
              <span key={idx}>
                {part}
                {idx < arr.length - 1 && (
                  <span 
                    className={`inline-block min-w-20 px-3 py-1 mx-1 rounded transition-all ${
                      showingCorrectAnswer
                        ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800 animate-pulse'
                        : selectedAnswer 
                          ? 'bg-blue-900/30 text-blue-300 border border-blue-800' 
                          : 'bg-gray-700 text-gray-400 border border-dashed border-gray-600'
                    } ${optionSelected ? 'animate-bounce' : ''}`}
                  >
                    {showingCorrectAnswer 
                      ? currentQuestion.correctAnswer 
                      : selectedAnswer || '______'}
                  </span>
                )}
              </span>
            ))}
          </h2>
          
          {showingCorrectAnswer && (
            <div className="text-center text-sm text-rose-400 animate-fadeIn">
              Time's up! The correct answer was shown.
            </div>
          )}
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {currentQuestion.options.map((option, index) => (
            <button
              key={option}
              onClick={() => handleAnswerSelect(option)}
              disabled={showingCorrectAnswer}
              className={`p-4 text-left rounded-lg border transition-all ${
                showingCorrectAnswer && option === currentQuestion.correctAnswer
                  ? 'bg-emerald-900/30 border-emerald-800 text-emerald-300 animate-pulse'
                  : selectedAnswer === option
                  ? 'bg-blue-900/30 border-blue-800 text-blue-300'
                  : 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300'
              } ${showingCorrectAnswer ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                animationDelay: `${index * 0.1}s`,
                transform: selectedAnswer === option ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={handleNextQuestion}
          disabled={!selectedAnswer && !showingCorrectAnswer}
          className={`w-full p-4 rounded-lg font-medium transition-all ${
            selectedAnswer || showingCorrectAnswer
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {currentQuestionIndex < randomQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
        </button>
      </div>
    </div>
  )
}

export default App