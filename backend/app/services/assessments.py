from app.schemas.phase3 import Assessment, AssessmentInfo, GradeRequest, GradeResult, Question, Option, QuestionFeedback
from app.seed.assessments import QUIZZES

NOTICE = "A short practice quiz, not a credential or proof of job readiness. Passing means at least four of five correct. Scores never change self-reported skills or career fit. Answers are revealed after grading; retakes are practice."


def list_assessments():
    return [AssessmentInfo(slug=slug, title=title, skill_id=skill, question_count=5) for slug, (title, skill, _) in QUIZZES.items()]


def get_assessment(slug: str):
    title, skill, bank = QUIZZES[slug]
    return Assessment(slug=slug, title=title, skill_id=skill, question_count=5, notice=NOTICE, questions=[
        Question(id=f"{slug}-{i+1}", prompt=prompt, options=[Option(id=letter, text=text) for letter, text in zip("abcd", options)])
        for i, (prompt, options, _, _) in enumerate(bank)
    ])


def grade_assessment(slug: str, payload: GradeRequest):
    title, _, bank = QUIZZES[slug]
    submitted = {answer.question_id: answer.option_id for answer in payload.answers}
    expected = {f"{slug}-{i+1}" for i in range(5)}
    if len(submitted) != 5 or submitted.keys() != expected:
        raise ValueError("Answer every question exactly once using the current quiz question IDs")
    feedback = [QuestionFeedback(question_id=f"{slug}-{i+1}", selected_option_id=submitted[f"{slug}-{i+1}"], correct_option_id=correct,
        correct=submitted[f"{slug}-{i+1}"] == correct, explanation=explanation) for i, (_, _, correct, explanation) in enumerate(bank)]
    score = sum(item.correct for item in feedback)
    return GradeResult(slug=slug, title=title, score=score, passed=score >= 4, badge="quiz-completed" if score >= 4 else None, feedback=feedback, notice=NOTICE)
