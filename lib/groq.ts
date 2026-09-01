import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY || '';

export const groq = apiKey ? new Groq({ apiKey }) : null;

// Preferred Groq models for ultra low latency
export const GROQ_MODEL_FAST = 'llama-3.1-8b-instant';
export const GROQ_MODEL_VERSATILE = 'llama-3.3-70b-versatile';

export interface GeneratedQuestion {
  question_text: string;
  context_hint?: string;
}

export interface EvaluatedAnswer {
  score: number; // 0 to 10
  max_score: number;
  feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
}

/**
 * Generate Next Interview Question
 */
export async function generateQuestion(params: {
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionIndex: number;
  totalQuestions: number;
  previousQuestionsAndAnswers?: { question: string; answer: string }[];
}): Promise<GeneratedQuestion> {
  const { category, difficulty, questionIndex, totalQuestions, previousQuestionsAndAnswers = [] } = params;

  if (!groq) {
    // Fallback static questions if GROQ_API_KEY is not set
    const fallbackQuestions: Record<string, string[]> = {
      default: [
        `Welcome! Let's start with your background in ${category}. Could you walk me through a key project or experience that demonstrates your core competencies?`,
        `How do you handle ambiguous situations or technical roadblocks when working under tight deadlines in ${category}?`,
        `Can you describe a specific situation where you identified an operational flaw or optimization opportunity in ${category} and resolved it?`,
        `Given a high-stakes scenario with competing stakeholder priorities, how do you make trade-offs?`,
        `Finally, what emerging trends or innovations in ${category} do you believe will shape the industry over the next 2-3 years?`
      ]
    };

    const qList = fallbackQuestions.default;
    const qText = qList[(questionIndex - 1) % qList.length];
    return {
      question_text: qText,
      context_hint: `Question ${questionIndex} of ${totalQuestions} (${difficulty.toUpperCase()} difficulty)`
    };
  }

  const systemPrompt = `You are InternAdda, a world-class AI corporate interviewer conducting a professional mock interview for Upforge.org.
Category: ${category}
Difficulty: ${difficulty.toUpperCase()}
Question Number: ${questionIndex} out of ${totalQuestions}.

Difficulty Guidelines:
- EASY: Foundational, open-ended question. Friendly tone, tests practical knowledge.
- MEDIUM: In-depth, practical scenario or problem-solving question. Expects structured, detailed answers (STAR method).
- HARD: Complex, edge-case system design or strategic decision-making question under constraints. Tests deep mastery.

${
  previousQuestionsAndAnswers.length > 0
    ? `Previous Questions & Answers:\n` +
      previousQuestionsAndAnswers
        .map((item, idx) => `Q${idx + 1}: ${item.question}\nA${idx + 1}: ${item.answer}`)
        .join('\n\n')
    : 'This is the first question of the interview.'
}

Instructions:
1. Ask EXACTLY ONE question for question #${questionIndex}.
2. If previous answers were given, make this question organically build on or naturally follow up on what the candidate mentioned.
3. Keep the tone warm, concise, and executive corporate.
4. Output valid JSON in the format:
{
  "question_text": "Your concise question string here",
  "context_hint": "A short 1-line guidance on what key aspects to cover in their answer"
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please provide question #${questionIndex} for the candidate.` }
      ],
      model: GROQ_MODEL_VERSATILE,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 350
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    return {
      question_text: parsed.question_text || `Can you detail your experience in ${category}?`,
      context_hint: parsed.context_hint || 'Focus on concrete examples and results.'
    };
  } catch (error) {
    console.error('Groq generateQuestion error:', error);
    return {
      question_text: `Could you share a practical example of a challenging situation you encountered in ${category} and how you navigated it?`,
      context_hint: 'Highlight problem solving and outcomes.'
    };
  }
}

/**
 * Evaluate Candidate Answer
 */
export async function evaluateAnswer(params: {
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  answer: string;
}): Promise<EvaluatedAnswer> {
  const { category, difficulty, question, answer } = params;

  if (!groq) {
    // Dynamic rule-based score calculation when offline
    const wordCount = answer ? answer.trim().split(/\s+/).length : 0;
    let baseScore = Math.min(10, Math.max(3, Math.floor(wordCount / 10)));
    if (difficulty === 'medium') baseScore = Math.max(1, baseScore - 1);
    if (difficulty === 'hard') baseScore = Math.max(1, baseScore - 2);

    return {
      score: baseScore,
      max_score: 10,
      feedback:
        wordCount > 25
          ? 'Good response addressing key points of the prompt.'
          : 'Response was brief. Consider using the STAR method for a more comprehensive breakdown.',
      strengths: ['Clear articulate delivery', 'Addressed core topic'],
      areas_for_improvement: wordCount < 30 ? ['Provide more granular metrics and concrete outcomes'] : ['Deeper technical elaboration']
    };
  }

  const systemPrompt = `You are InternAdda, an executive evaluator scoring candidate interview responses for Upforge.org.
Category: ${category}
Difficulty: ${difficulty.toUpperCase()}

Difficulty Rubric & Severity:
- EASY: Generous grading. If answer covers the basics clearly, grant 7-10/10. 50% qualifying threshold is easy.
- MEDIUM: Strict rubric. Penalize heavily for vague generalizations, lack of concrete metrics, or incomplete logic. Grant 4-7/10 for standard answers. 50% qualifying bar must be genuinely hard to cross.
- HARD: Near-expert rubric. Minimal partial credit. Require deep domain mastery, risk awareness, and flawless rationale. Grant 2-5/10 for average answers. 50% bar is very difficult to reach.

Question Asked: "${question}"
Candidate Answer: "${answer}"

Instructions:
Evaluate the answer rigorously according to the difficulty tier. Output ONLY valid JSON:
{
  "score": <number between 0 and 10>,
  "feedback": "<2-3 sentence constructive executive feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "areas_for_improvement": ["<area 1>", "<area 2>"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Evaluate the response now.' }
      ],
      model: GROQ_MODEL_VERSATILE,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 400
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    return {
      score: typeof parsed.score === 'number' ? parsed.score : 6,
      max_score: 10,
      feedback: parsed.feedback || 'Answer noted and evaluated against corporate standards.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Clear communication'],
      areas_for_improvement: Array.isArray(parsed.areas_for_improvement) ? parsed.areas_for_improvement : ['Include measurable impacts']
    };
  } catch (error) {
    console.error('Groq evaluateAnswer error:', error);
    return {
      score: 6,
      max_score: 10,
      feedback: 'Answer acknowledged. Evaluated based on category standard.',
      strengths: ['Direct response to prompt'],
      areas_for_improvement: ['Elaborate further on implementation details']
    };
  }
}
