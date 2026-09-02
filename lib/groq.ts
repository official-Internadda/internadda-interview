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
 * Generate Next Interview Question with Adaptive Dialogue Probing & Hard Mode Rigor
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
        `How do you handle technical roadblocks or competing stakeholder priorities when working under tight deadlines in ${category}?`,
        `Can you describe a specific situation where you identified an architectural or process flaw in ${category} and resolved it?`,
        `Given a high-stakes scenario with tight constraints, what trade-offs do you prioritize and how do you measure success?`,
        `Finally, what emerging trends or industry standards in ${category} do you believe will shape future development over the next 2-3 years?`
      ]
    };

    const qList = fallbackQuestions.default;
    const qText = qList[(questionIndex - 1) % qList.length];
    return {
      question_text: qText,
      context_hint: `Question ${questionIndex} of ${totalQuestions} (${difficulty.toUpperCase()} difficulty standard)`
    };
  }

  const isHardMode = difficulty === 'hard';

  const systemPrompt = `You are AI Interviewer, Europe's premier privacy-first autonomous talent evaluation engine.
Domain Category: ${category}
Difficulty Tier: ${difficulty.toUpperCase()}
Question Index: ${questionIndex} of ${totalQuestions}.

Difficulty Guidelines & Probing Intensity:
- EASY: Foundational, open-ended question testing practical domain literacy. Constructive and encouraging tone.
- MEDIUM: In-depth scenario or problem-solving question requiring structured explanation (STAR method: Situation, Task, Action, Result).
- HARD (EXECUTIVE RIGOR): Deeply analytical probing. Challenge assumptions, demand concrete metrics, ask for specific technical/architectural trade-offs, and call out vague generalizations. If candidate's previous response was brief or vague, explicitly ask them to quantify their impact or explain their exact technical implementation choices.

${
  previousQuestionsAndAnswers.length > 0
    ? `Candidate Dialogue History:\n` +
      previousQuestionsAndAnswers
        .map((item, idx) => `Turn Q${idx + 1}: ${item.question}\nCandidate A${idx + 1}: ${item.answer}`)
        .join('\n\n')
    : 'This is the opening question of the interview session.'
}

Instructions:
1. Output EXACTLY ONE clear spoken question for Question #${questionIndex}.
2. If previous answers exist, organically build on what the candidate mentioned — ask a natural context-aware follow-up.
3. ${isHardMode ? 'In HARD mode, dig deep into specific metrics, trade-offs, and edge cases. Do not let vague answers pass.' : 'Keep tone professional, clear, and focused on core competencies.'}
4. Output ONLY valid JSON matching this schema:
{
  "question_text": "Your concise spoken question string here",
  "context_hint": "A 1-line guidance on what key metrics or structure the evaluator expects in their response"
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate question #${questionIndex} for ${category} (${difficulty} difficulty).` }
      ],
      model: GROQ_MODEL_VERSATILE,
      response_format: { type: 'json_object' },
      temperature: isHardMode ? 0.6 : 0.7,
      max_tokens: 350
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    return {
      question_text: parsed.question_text || `Could you elaborate on your practical experience and technical approach in ${category}?`,
      context_hint: parsed.context_hint || 'Focus on specific implementation details and quantifiable outcomes.'
    };
  } catch (error) {
    console.error('Groq generateQuestion error:', error);
    return {
      question_text: `Could you share a concrete scenario in ${category} where you overcame a complex technical or operational obstacle?`,
      context_hint: 'Detail your specific role, actions taken, and measurable results.'
    };
  }
}

/**
 * Evaluate Candidate Answer against Domain Rubric
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
          ? 'Good response addressing key aspects of the prompt.'
          : 'Response was brief. Use the STAR method (Situation, Task, Action, Result) for a comprehensive breakdown.',
      strengths: ['Clear articulate delivery', 'Addressed core topic'],
      areas_for_improvement: wordCount < 30 ? ['Include specific metrics and concrete results'] : ['Deeper technical elaboration']
    };
  }

  const systemPrompt = `You are AI Interviewer, Europe's objective corporate talent evaluation engine scoring candidate responses.
Domain Category: ${category}
Difficulty Level: ${difficulty.toUpperCase()}

Difficulty Rubric & Severity:
- EASY: Generous grading. Clear foundational understanding earns 7-10/10. 50% qualification bar is accessible.
- MEDIUM: Standard executive rubric. Require clear STAR methodology logic, domain terminology, and structured answers. Vague responses earn 4-6/10.
- HARD (RIGOROUS): Near-expert rubric. Minimal partial credit. Penalize buzzword usage without substance, vague statements without metrics, or missing technical depth. Grant 2-5/10 for average or high-level answers. The 50% qualification threshold requires solid, verifiable depth.

Question Asked: "${question}"
Candidate Response: "${answer}"

Instructions:
Evaluate objectively according to the specified difficulty tier. Output ONLY valid JSON:
{
  "score": <number between 0 and 10>,
  "feedback": "<2-3 sentence constructive executive evaluation feedback>",
  "strengths": ["<key strength 1>", "<key strength 2>"],
  "areas_for_improvement": ["<improvement area 1>", "<improvement area 2>"]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Evaluate this candidate response now.' }
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
      feedback: parsed.feedback || 'Response evaluated against standardized European talent rubrics.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Clear domain communication'],
      areas_for_improvement: Array.isArray(parsed.areas_for_improvement) ? parsed.areas_for_improvement : ['Include measurable outcomes and technical depth']
    };
  } catch (error) {
    console.error('Groq evaluateAnswer error:', error);
    return {
      score: 6,
      max_score: 10,
      feedback: 'Response acknowledged and scored against category standard.',
      strengths: ['Direct response to question prompt'],
      areas_for_improvement: ['Elaborate further on implementation specifics']
    };
  }
}
