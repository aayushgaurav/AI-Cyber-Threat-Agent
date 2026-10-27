
from app.answer import answer_question

question = (
    "What does the database say about Microsoft vulnerabilities "
    "associated with ransomware, and what actions are recommended?"
)

try:
    print("\nQuestion:", question)
    print("\nAI Threat Intelligence Answer:\n")
    print(answer_question(question))
except Exception as exc:
    print(f"Test failed: {type(exc).__name__}: {exc}")
