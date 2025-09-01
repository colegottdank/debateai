/**
 * Daily debate pairings - each day has a specific person and relevant topic
 * These are curated to match people with topics they're known for
 */

export interface DailyDebate {
  persona: string;
  topic: string;
  description?: string;
}

export const DAILY_DEBATES: DailyDebate[] = [
  {
    persona: "Elon Musk",
    topic: "Should humanity become a multi-planetary species?",
    description: "Space exploration and Mars colonization"
  },
  {
    persona: "Donald Trump",
    topic: "Should we build a wall on the southern border?",
    description: "Immigration and border security"
  },
  {
    persona: "Greta Thunberg",
    topic: "Should we ban fossil fuels by 2030?",
    description: "Climate change and environmental policy"
  },
  {
    persona: "Jordan Peterson",
    topic: "Is traditional masculinity toxic?",
    description: "Gender roles and social hierarchies"
  },
  {
    persona: "Alexandria Ocasio-Cortez",
    topic: "Should we implement a Green New Deal?",
    description: "Climate policy and economic reform"
  },
  {
    persona: "Joe Rogan",
    topic: "Should psychedelic drugs be legalized for therapeutic use?",
    description: "Drug policy and mental health"
  },
  {
    persona: "Ben Shapiro",
    topic: "Should college be free for everyone?",
    description: "Education and fiscal conservatism"
  },
  {
    persona: "Bernie Sanders",
    topic: "Should billionaires exist?",
    description: "Wealth inequality and taxation"
  },
  {
    persona: "Tucker Carlson",
    topic: "Is mainstream media trustworthy?",
    description: "Media bias and journalism"
  },
  {
    persona: "Sam Harris",
    topic: "Is free will an illusion?",
    description: "Philosophy and neuroscience"
  },
  {
    persona: "Andrew Tate",
    topic: "Is the modern education system making men weak?",
    description: "Masculinity and education"
  },
  {
    persona: "Bill Gates",
    topic: "Should AI development be heavily regulated?",
    description: "Technology and artificial intelligence"
  },
  {
    persona: "Warren Buffett",
    topic: "Is cryptocurrency a legitimate investment?",
    description: "Finance and digital assets"
  },
  {
    persona: "Oprah Winfrey",
    topic: "Can positive thinking change your life?",
    description: "Self-help and personal development"
  },
  {
    persona: "Stephen Colbert",
    topic: "Should political comedy shows be considered news?",
    description: "Media and political satire"
  },
  {
    persona: "Barack Obama",
    topic: "Should we have universal healthcare?",
    description: "Healthcare policy"
  },
  {
    persona: "Joe Biden",
    topic: "Should we forgive student loan debt?",
    description: "Education and economic policy"
  },
  {
    persona: "Kamala Harris",
    topic: "Should we defund the police?",
    description: "Criminal justice reform"
  },
  {
    persona: "Ron DeSantis",
    topic: "Should schools teach critical race theory?",
    description: "Education and cultural issues"
  },
  {
    persona: "Elizabeth Warren",
    topic: "Should we break up Big Tech companies?",
    description: "Antitrust and technology regulation"
  },
  {
    persona: "Jon Stewart",
    topic: "Should veterans have free healthcare for life?",
    description: "Veterans affairs and healthcare"
  },
  {
    persona: "Bill Maher",
    topic: "Is cancel culture destroying free speech?",
    description: "Free speech and social media"
  },
  {
    persona: "Rachel Maddow",
    topic: "Was the 2020 election the most secure in history?",
    description: "Election integrity and democracy"
  },
  {
    persona: "Sean Hannity",
    topic: "Should we drill for more oil in America?",
    description: "Energy independence"
  },
  {
    persona: "Mark Zuckerberg",
    topic: "Is the metaverse the future of social interaction?",
    description: "Virtual reality and social media"
  },
  {
    persona: "Jeff Bezos",
    topic: "Should companies be required to let employees unionize?",
    description: "Labor rights and business"
  },
  {
    persona: "Taylor Swift",
    topic: "Should artists own their master recordings?",
    description: "Music industry and artist rights"
  },
  {
    persona: "Kanye West",
    topic: "Is the fashion industry exploiting young artists?",
    description: "Creative industries and commerce"
  },
  {
    persona: "Gordon Ramsay",
    topic: "Should restaurants be required to list calories on menus?",
    description: "Food industry and health"
  },
  {
    persona: "Gary Vaynerchuk",
    topic: "Is college a waste of time for entrepreneurs?",
    description: "Business and education"
  },
  {
    persona: "Naval Ravikant",
    topic: "Is universal basic income inevitable?",
    description: "Economics and automation"
  },
  {
    persona: "Robert F. Kennedy Jr.",
    topic: "Should vaccine mandates be required for public schools?",
    description: "Public health and personal freedom"
  },
  {
    persona: "Noam Chomsky",
    topic: "Is American foreign policy imperialistic?",
    description: "Geopolitics and intervention"
  },
  {
    persona: "Dave Chappelle",
    topic: "Has comedy become too politically correct?",
    description: "Comedy and social boundaries"
  },
  {
    persona: "Ricky Gervais",
    topic: "Should celebrities stay out of politics?",
    description: "Celebrity influence and activism"
  },
  {
    persona: "Neil deGrasse Tyson",
    topic: "Should we prioritize space exploration over Earth's problems?",
    description: "Science priorities and funding"
  },
  {
    persona: "Richard Dawkins",
    topic: "Is religion holding back scientific progress?",
    description: "Science versus faith"
  },
  {
    persona: "Candace Owens",
    topic: "Is systemic racism a myth?",
    description: "Race relations and policy"
  },
  {
    persona: "Ibram X. Kendi",
    topic: "Should we have reparations for slavery?",
    description: "Historical justice and compensation"
  },
  {
    persona: "Malcolm Gladwell",
    topic: "Is the 10,000 hour rule real?",
    description: "Expertise and practice"
  },
  {
    persona: "Steven Pinker",
    topic: "Is the world actually getting better?",
    description: "Progress and pessimism"
  },
  {
    persona: "Yuval Noah Harari",
    topic: "Will AI make humans obsolete?",
    description: "Future of humanity and technology"
  },
  {
    persona: "Peter Thiel",
    topic: "Has competition become overrated?",
    description: "Business strategy and monopolies"
  },
  {
    persona: "Marc Andreessen",
    topic: "Should we build more or regulate more?",
    description: "Innovation versus safety"
  },
  {
    persona: "Paul Graham",
    topic: "Are universities becoming obsolete?",
    description: "Education and alternatives"
  },
  {
    persona: "Tim Ferriss",
    topic: "Is the 4-hour work week realistic?",
    description: "Productivity and work-life balance"
  },
  {
    persona: "Seth Godin",
    topic: "Is traditional marketing dead?",
    description: "Marketing evolution"
  },
  {
    persona: "Simon Sinek",
    topic: "Do millennials have unrealistic workplace expectations?",
    description: "Generational differences"
  },
  {
    persona: "Brené Brown",
    topic: "Is vulnerability weakness or strength?",
    description: "Leadership and emotions"
  },
  {
    persona: "Tony Robbins",
    topic: "Can anyone become successful?",
    description: "Success and mindset"
  },
  {
    persona: "Ray Dalio",
    topic: "Is capitalism broken?",
    description: "Economic systems"
  },
  {
    persona: "Charlie Munger",
    topic: "Should we ban cryptocurrency?",
    description: "Digital currency regulation"
  },
  {
    persona: "Cathie Wood",
    topic: "Is disruptive innovation worth the risk?",
    description: "Investment strategy"
  },
  {
    persona: "Michael Burry",
    topic: "Are we in another bubble?",
    description: "Market cycles and crashes"
  },
  {
    persona: "Janet Yellen",
    topic: "Should we raise interest rates aggressively?",
    description: "Monetary policy"
  },
  {
    persona: "Jerome Powell",
    topic: "Is inflation transitory?",
    description: "Economic indicators"
  },
  {
    persona: "Christine Lagarde",
    topic: "Should central banks issue digital currencies?",
    description: "Future of money"
  },
  {
    persona: "Larry Page",
    topic: "Should tech companies be broken up?",
    description: "Antitrust and innovation"
  },
  {
    persona: "Sergey Brin",
    topic: "Is privacy dead in the digital age?",
    description: "Data and surveillance"
  },
  {
    persona: "Tim Cook",
    topic: "Should encryption have backdoors for law enforcement?",
    description: "Security versus privacy"
  },
  {
    persona: "Satya Nadella",
    topic: "Will AI democratize or centralize power?",
    description: "AI governance"
  },
  {
    persona: "Jensen Huang",
    topic: "Is the GPU shortage artificial?",
    description: "Supply chains and demand"
  },
  {
    persona: "Lisa Su",
    topic: "Should we bring chip manufacturing back to America?",
    description: "Technology sovereignty"
  },
  {
    persona: "Sundar Pichai",
    topic: "Should AI development be paused?",
    description: "AI safety and progress"
  },
  {
    persona: "Sam Altman",
    topic: "Will AGI happen in our lifetime?",
    description: "Artificial general intelligence"
  },
  {
    persona: "Demis Hassabis",
    topic: "Can AI solve climate change?",
    description: "Technology and environment"
  },
  {
    persona: "Yann LeCun",
    topic: "Is deep learning hitting a wall?",
    description: "AI research directions"
  },
  {
    persona: "Geoffrey Hinton",
    topic: "Should we be afraid of AI?",
    description: "AI risks and benefits"
  },
  {
    persona: "Andrew Ng",
    topic: "Is AI overhyped?",
    description: "Technology expectations"
  },
  {
    persona: "Lex Fridman",
    topic: "Can AI ever be conscious?",
    description: "Machine consciousness"
  },
  {
    persona: "Eric Weinstein",
    topic: "Are institutions failing us?",
    description: "Institutional decay"
  },
  {
    persona: "Bret Weinstein",
    topic: "Is scientific consensus reliable?",
    description: "Science and dissent"
  },
  {
    persona: "Douglas Murray",
    topic: "Is Western civilization in decline?",
    description: "Cultural pessimism"
  },
  {
    persona: "Matt Walsh",
    topic: "What is a woman?",
    description: "Gender and biology"
  },
  {
    persona: "Contrapoints",
    topic: "Is cancel culture real?",
    description: "Online accountability"
  },
  {
    persona: "Hasan Piker",
    topic: "Is streaming political content journalism?",
    description: "New media and politics"
  },
  {
    persona: "Destiny",
    topic: "Should online debates change minds?",
    description: "Digital discourse"
  },
  {
    persona: "Vaush",
    topic: "Is socialism inevitable?",
    description: "Political economy"
  },
  {
    persona: "Tim Pool",
    topic: "Is civil war coming to America?",
    description: "Political polarization"
  },
  {
    persona: "Jimmy Dore",
    topic: "Are both parties the same?",
    description: "Political parties"
  },
  {
    persona: "Kyle Kulinski",
    topic: "Should we have Medicare for All?",
    description: "Healthcare reform"
  },
  {
    persona: "David Pakman",
    topic: "Is the filibuster anti-democratic?",
    description: "Senate rules"
  },
  {
    persona: "Steven Crowder",
    topic: "Is hate speech free speech?",
    description: "First Amendment limits"
  },
  {
    persona: "Ana Kasparian",
    topic: "Should we abolish the electoral college?",
    description: "Democratic reform"
  },
  {
    persona: "Cenk Uygur",
    topic: "Is corporate media dying?",
    description: "Media landscape"
  },
  {
    persona: "Glenn Greenwald",
    topic: "Has journalism lost its way?",
    description: "Press integrity"
  },
  {
    persona: "Matt Taibbi",
    topic: "Is censorship the new normal?",
    description: "Free speech online"
  },
  {
    persona: "Bari Weiss",
    topic: "Are universities indoctrinating students?",
    description: "Academic freedom"
  },
  {
    persona: "Coleman Hughes",
    topic: "Should we be colorblind?",
    description: "Race and policy"
  },
  {
    persona: "Thomas Sowell",
    topic: "Does welfare help or hurt the poor?",
    description: "Social programs"
  },
  {
    persona: "Cornel West",
    topic: "Is America an empire in decline?",
    description: "American hegemony"
  },
  {
    persona: "Slavoj Žižek",
    topic: "Is ideology inescapable?",
    description: "Philosophy and politics"
  },
  {
    persona: "Nassim Taleb",
    topic: "Are experts fooling us?",
    description: "Expertise and randomness"
  },
  {
    persona: "Michael Saylor",
    topic: "Is Bitcoin the future of money?",
    description: "Cryptocurrency adoption"
  },
  {
    persona: "Vitalik Buterin",
    topic: "Can blockchain solve governance?",
    description: "Decentralized systems"
  },
  {
    persona: "Jack Dorsey",
    topic: "Should social media be decentralized?",
    description: "Platform control"
  },
  {
    persona: "Pavel Durov",
    topic: "Is privacy a human right?",
    description: "Digital rights"
  },
  {
    persona: "Edward Snowden",
    topic: "Is mass surveillance justified?",
    description: "Security and privacy"
  },
  {
    persona: "Julian Assange",
    topic: "Should all government secrets be public?",
    description: "Transparency and security"
  },
  {
    persona: "Chelsea Manning",
    topic: "Are whistleblowers heroes or traitors?",
    description: "Ethics of leaking"
  },
  {
    persona: "Glenn Beck",
    topic: "Is America losing its founding principles?",
    description: "Constitutional originalism"
  },
  {
    persona: "Rush Limbaugh",
    topic: "Is liberalism a mental disorder?",
    description: "Political psychology"
  },
  {
    persona: "Howard Stern",
    topic: "Has radio become irrelevant?",
    description: "Media evolution"
  },
  {
    persona: "Bill O'Reilly",
    topic: "Is traditional media biased?",
    description: "Media objectivity"
  },
  {
    persona: "Keith Olbermann",
    topic: "Should Trump be prosecuted?",
    description: "Political accountability"
  },
  {
    persona: "Chris Hayes",
    topic: "Is American democracy in crisis?",
    description: "Democratic institutions"
  },
  {
    persona: "Lawrence O'Donnell",
    topic: "Should the Senate be abolished?",
    description: "Constitutional reform"
  },
  {
    persona: "Joy Reid",
    topic: "Is America fundamentally racist?",
    description: "Systemic racism"
  },
  {
    persona: "Don Lemon",
    topic: "Are we in a cold civil war?",
    description: "National division"
  },
  {
    persona: "Chris Cuomo",
    topic: "Should journalists be activists?",
    description: "Media neutrality"
  },
  {
    persona: "Megyn Kelly",
    topic: "Has MeToo gone too far?",
    description: "Social movements"
  },
  {
    persona: "Piers Morgan",
    topic: "Should guns be banned in America?",
    description: "Second Amendment"
  },
  {
    persona: "Bill Burr",
    topic: "Is outrage culture killing comedy?",
    description: "Comedy and sensitivity"
  },
  {
    persona: "Louis C.K.",
    topic: "Can cancelled people come back?",
    description: "Redemption and accountability"
  },
  {
    persona: "Kevin Hart",
    topic: "Should old tweets be held against you?",
    description: "Digital permanence"
  },
  {
    persona: "Amy Schumer",
    topic: "Is comedy still a boys' club?",
    description: "Gender in entertainment"
  },
  {
    persona: "Sarah Silverman",
    topic: "Can offensive jokes be funny?",
    description: "Humor boundaries"
  },
  {
    persona: "John Mulaney",
    topic: "Is stand-up comedy dying?",
    description: "Entertainment evolution"
  },
  {
    persona: "Hannah Gadsby",
    topic: "Should comedy always be funny?",
    description: "Art and activism"
  },
  {
    persona: "Bo Burnham",
    topic: "Is the internet ruining our brains?",
    description: "Digital mental health"
  },
  {
    persona: "Hank Green",
    topic: "Can influencers be trusted?",
    description: "Social media authenticity"
  },
  {
    persona: "John Green",
    topic: "Is YA literature real literature?",
    description: "Literary gatekeeping"
  },
  {
    persona: "Casey Neistat",
    topic: "Is vlogging narcissistic?",
    description: "Content creation ethics"
  },
  {
    persona: "MrBeast",
    topic: "Is philanthropy for views ethical?",
    description: "Charity and content"
  },
  {
    persona: "PewDiePie",
    topic: "Are content creators responsible for their audience?",
    description: "Platform responsibility"
  },
  {
    persona: "Pokimane",
    topic: "Should streaming be regulated?",
    description: "Digital entertainment law"
  },
  {
    persona: "Dr Disrespect",
    topic: "Are parasocial relationships unhealthy?",
    description: "Fan psychology"
  },
  {
    persona: "Ninja",
    topic: "Are video games sports?",
    description: "Esports legitimacy"
  },
  {
    persona: "Shroud",
    topic: "Is gaming addiction real?",
    description: "Digital wellness"
  }
];

/**
 * Get today's debate pairing (persona + topic)
 * Changes every day based on the date
 */
export function getDailyDebate(): DailyDebate {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % DAILY_DEBATES.length;
  return DAILY_DEBATES[index];
}