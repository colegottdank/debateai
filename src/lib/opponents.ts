export type OpponentType = "socratic" | "logical" | "devils_advocate" | "academic" | "pragmatist";
export type OpponentLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface Opponent {
  id: OpponentType;
  name: string;
  level: OpponentLevel;
  color: string;
  description: string;
  style: string;
  strengths: string;
  approach: string;
  avatar: string;
  avatarColor: string;
}

export const opponents: Opponent[] = [
  {
    id: "socratic",
    name: "The Socratic",
    level: "advanced",
    color: "bg-gradient-to-br from-blue-600 to-blue-800",
    description: "Questions everything to reveal truth",
    style: "Questioning & Analysis",
    strengths: "Exposing assumptions, finding contradictions",
    approach: "Uses probing questions to challenge your reasoning",
    avatar: "❓",
    avatarColor: "from-blue-600 to-blue-800"
  },
  {
    id: "logical",
    name: "The Logician",
    level: "expert",
    color: "bg-gradient-to-br from-green-600 to-green-800",
    description: "Pure logic and evidence-based reasoning",
    style: "Formal Logic",
    strengths: "Structured arguments, syllogisms, evidence",
    approach: "Builds airtight logical cases with clear premises",
    avatar: "🧮",
    avatarColor: "from-green-600 to-green-800"
  },
  {
    id: "devils_advocate",
    name: "Devil's Advocate",
    level: "advanced",
    color: "bg-gradient-to-br from-red-600 to-red-800",
    description: "Argues the opposing view, no matter what",
    style: "Contrarian",
    strengths: "Finding weaknesses, alternative perspectives",
    approach: "Takes the opposite stance to test your arguments",
    avatar: "😈",
    avatarColor: "from-red-600 to-red-800"
  },
  {
    id: "academic",
    name: "The Scholar",
    level: "expert",
    color: "bg-gradient-to-br from-purple-600 to-purple-800",
    description: "Academic rigor with citations and research",
    style: "Academic Discourse",
    strengths: "Research-based arguments, historical context",
    approach: "Uses scholarly evidence and theoretical frameworks",
    avatar: "📚",
    avatarColor: "from-purple-600 to-purple-800"
  },
  {
    id: "pragmatist",
    name: "The Pragmatist",
    level: "intermediate",
    color: "bg-gradient-to-br from-gray-600 to-gray-800",
    description: "Focuses on practical, real-world implications",
    style: "Practical Reasoning",
    strengths: "Real-world examples, feasibility analysis",
    approach: "Evaluates ideas based on practical outcomes",
    avatar: "⚖️",
    avatarColor: "from-gray-600 to-gray-800"
  }
];

export function getOpponentById(id: OpponentType): Opponent | undefined {
  return opponents.find(o => o.id === id);
}