
const studentPrompts = [
  {
    id: "student-notes",
    title: "Student Notes & Explanation",
    category: "education",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
    description: "किसी भी विषय के आसान नोट्स और व्याख्या तैयार करें।",
    prompt: "Act as an experienced teacher. Create clear, well-organized notes for Class [CLASS], Board [BOARD], Subject [SUBJECT], Chapter [CHAPTER]. Include headings, definitions, important points, formulas where relevant, examples, and a simple explanation in Hindi. Do not invent facts."
  },
  {
    id: "numerical-solver",
    title: "Numerical Solver",
    category: "education",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
    description: "Numerical को चरण-दर-चरण समझें।",
    prompt: "Act as a patient subject teacher. Solve this [SUBJECT] numerical for Class [CLASS]. Question: [QUESTION]. Show Given, Required, Formula, Substitution, Calculation, Final Answer, units, and a simple Hindi explanation. Verify the calculation."
  },
  {
    id: "mcq-maker",
    title: "MCQ & Mock Test Maker",
    category: "education",
    image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800",
    description: "अभ्यास के लिए MCQ और टेस्ट तैयार करें।",
    prompt: "Act as an exam question setter. Create [NUMBER] MCQs for Class [CLASS], Board [BOARD], Subject [SUBJECT], Chapter [CHAPTER]. Give four options per question, an answer key, and short explanations. Keep questions relevant to the supplied syllabus."
  },
  {
    id: "teacher-lesson-plan",
    title: "Teacher Lesson Planner",
    category: "education",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800",
    description: "शिक्षकों के लिए lesson plan और classroom activities।",
    prompt: "Act as an experienced teacher. Create a lesson plan for Class [CLASS], Board [BOARD], Subject [SUBJECT], Topic [TOPIC]. Include learning objectives, teaching materials, step-by-step teaching activities, examples, assessment questions, homework, and a short recap."
  },
  {
    id: "worksheet-maker",
    title: "Worksheet & Question Paper Maker",
    category: "education",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800",
    description: "Worksheets और question papers बनाएँ।",
    prompt: "Act as an experienced teacher and question-paper setter. Create a [WORKSHEET OR QUESTION PAPER] for Class [CLASS], Board [BOARD], Subject [SUBJECT], Chapter [CHAPTER]. Include a balanced mix of question types, clear instructions, marks for each question, and a separate answer key. Match the requested syllabus and difficulty."
  },
    {
    id: "universal-learning-teacher",
    title: "Universal AI Learning Teacher",
    category: "education",
    image: "images/universal-learning.png",
    description: "किसी भी विषय को आसान भाषा, उदाहरण, चित्र और Practice Test के साथ सीखें।",
    prompt: `🚀 UNIVERSAL AI LEARNING PROMPT
(COPY • PASTE • LEARN ANY TOPIC)

Act as an expert teacher and explain any topic I provide in a very simple and clear way.

1. INTRODUCTION
Explain what the topic is and why it is important.

2. EASY EXPLANATION
Teach step by step using simple Hindi or English according to my preference.

3. VISUAL LEARNING
Create relevant AI-generated images, diagrams, charts or illustrations. Each visual should explain an important concept.

4. REAL EXAMPLES
Give practical examples to help me understand.

5. IMPORTANT POINTS
Highlight key facts, rules, formulas and definitions wherever relevant.

6. STEP-BY-STEP GUIDE
If the topic involves a process, explain every step clearly.

7. FORMAT AND STRUCTURE
If I ask about a letter, application, document or format, provide the correct format with a complete example.

8. PRACTICAL USE
Explain where and how I can use this knowledge in real life.

9. QUICK REVISION
Give a short summary of the most important points.

10. PRACTICE TEST
Ask me 5 questions to check my understanding. Wait for my answers, then check them and explain my mistakes.

IMPORTANT RULES:
- Teach one concept at a time.
- Use simple language and clear headings.
- Avoid unnecessarily long explanations.
- Do not invent facts or formulas.
- Personalize teaching according to my class and knowledge level.
- If image generation is unavailable, provide a clear text diagram instead.

MY TOPIC: [Write your topic here]
MY CLASS / LEVEL: [Write your class or level]
LANGUAGE: [Hindi / English]
MY CURRENT KNOWLEDGE: [Beginner / Intermediate / Advanced]

Now start teaching me!`
  }
];

function createStudentPromptCard(item) {
  const article = document.createElement("article");
  article.className = "card";
  article.dataset.category = item.category;
  article.dataset.title = item.title;

  article.innerHTML = `
    <div class="card-img">
      <img
        loading="lazy"
        src="${item.image}"
        alt="${item.title}"
      >
      <span class="badge">✦ Education</span>
      <button class="heart" onclick="saveCard(this)">♡</button>
    </div>

    <div class="card-body">
      <h3>${item.title}</h3>
      <p>${item.description}</p>

      <div class="actions">
        <button class="copy"
          onclick="copyPrompt(this, studentPrompts.find(p => p.id === '${item.id}').prompt)">
          ▢ Copy Prompt
        </button>

        <button onclick="editPrompt(
          '${item.title.replace(/'/g, "\\'")}',
          studentPrompts.find(p => p.id === '${item.id}').prompt
        )">✎ Edit</button>
      </div>
    </div>
  `;

  return article;
}
