import { NextRequest, NextResponse } from 'next/server';
import { generateQuestion } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { category, difficulty, questionIndex, totalQuestions, previousQA } = await req.json();

    if (!category || !difficulty || !questionIndex || !totalQuestions) {
      return NextResponse.json({ error: 'Missing parameters for question generation' }, { status: 400 });
    }

    const questionData = await generateQuestion({
      category,
      difficulty,
      questionIndex,
      totalQuestions,
      previousQuestionsAndAnswers: previousQA || []
    });

    return NextResponse.json({ success: true, ...questionData });
  } catch (error: any) {
    console.error('API generate-question error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate question' }, { status: 500 });
  }
}
