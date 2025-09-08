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
    topic: "Did Elon ruin Twitter/X?",
    description: "Social media platform changes"
  },
  {
    persona: "Donald Trump",
    topic: "Was the 2020 election stolen?",
    description: "Election integrity claims"
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
    topic: "Should billionaires be abolished through taxation?",
    description: "Wealth inequality and tax policy"
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
    topic: "Is the matrix real?",
    description: "Society, control, and masculinity"
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
    topic: "Is the self-help industry a scam?",
    description: "Personal development industry critique"
  },
  {
    persona: "Stephen Colbert",
    topic: "Is late-night TV just liberal propaganda?",
    description: "Media bias in entertainment"
  },
  {
    persona: "Barack Obama",
    topic: "Is America more divided now than ever?",
    description: "National unity and polarization"
  },
  {
    persona: "Joe Biden",
    topic: "Is Biden too old to be president?",
    description: "Age and leadership capability"
  },
  {
    persona: "Kamala Harris",
    topic: "Should the border be completely closed?",
    description: "Immigration and border security"
  },
  {
    persona: "Ron DeSantis",
    topic: "Should drag shows be banned near children?",
    description: "LGBTQ rights and parental concerns"
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
    topic: "Should Trump be imprisoned?",
    description: "Political accountability and justice"
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
    topic: "Should artists be canceled for their political views?",
    description: "Cancel culture in entertainment"
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
    topic: "Are vaccines causing autism?",
    description: "Vaccine safety controversy"
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
    topic: "Is George Floyd a hero or a criminal?",
    description: "BLM and police brutality debates"
  },
  {
    persona: "Ibram X. Kendi",
    topic: "Should we have reparations for slavery?",
    description: "Historical justice and compensation"
  },
  {
    persona: "Malcolm Gladwell",
    topic: "Is meritocracy a myth?",
    description: "Success and privilege"
  },
  {
    persona: "Steven Pinker",
    topic: "Are we on the brink of World War 3?",
    description: "Global conflict and tensions"
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
    topic: "Should the 4-day work week be mandatory?",
    description: "Labor reform and productivity"
  },
  {
    persona: "Seth Godin",
    topic: "Should targeted advertising be banned?",
    description: "Privacy and marketing ethics"
  },
  {
    persona: "Simon Sinek",
    topic: "Should remote work be a human right?",
    description: "Future of work debates"
  },
  {
    persona: "Brené Brown",
    topic: "Is therapy culture making us weaker?",
    description: "Mental health and resilience"
  },
  {
    persona: "Tony Robbins",
    topic: "Is the American Dream dead?",
    description: "Economic mobility and opportunity"
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
    topic: "Is mass immigration destroying Europe?",
    description: "Immigration and cultural change"
  },
  {
    persona: "Matt Walsh",
    topic: "Should trans athletes compete in women's sports?",
    description: "Gender identity in athletics"
  },
  {
    persona: "Contrapoints",
    topic: "Are trans women real women?",
    description: "Gender identity debates"
  },
  {
    persona: "Hasan Piker",
    topic: "Is streaming political content journalism?",
    description: "New media and politics"
  },
  {
    persona: "Destiny",
    topic: "Is political violence ever justified?",
    description: "Extremism and self-defense"
  },
  {
    persona: "Vaush",
    topic: "Is socialism inevitable?",
    description: "Political economy"
  },
  {
    persona: "Tim Pool",
    topic: "Will the 2024 election cause a civil war?",
    description: "Political violence predictions"
  },
  {
    persona: "Jimmy Dore",
    topic: "Should we abolish political parties?",
    description: "Political system reform"
  },
  {
    persona: "Kyle Kulinski",
    topic: "Is healthcare a human right?",
    description: "Healthcare access debate"
  },
  {
    persona: "David Pakman",
    topic: "Is the filibuster anti-democratic?",
    description: "Senate rules"
  },
  {
    persona: "Steven Crowder",
    topic: "Should social media ban hate speech?",
    description: "Online speech regulation"
  },
  {
    persona: "Ana Kasparian",
    topic: "Is American democracy failing?",
    description: "Democratic crisis debates"
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
    topic: "Should Joe Rogan be censored?",
    description: "Platform responsibility and speech"
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
    topic: "Will there be another January 6th?",
    description: "Political violence and extremism"
  },
  {
    persona: "Lawrence O'Donnell",
    topic: "Should the Senate be abolished?",
    description: "Constitutional reform"
  },
  {
    persona: "Joy Reid",
    topic: "Should white people pay reparations?",
    description: "Racial justice and compensation"
  },
  {
    persona: "Don Lemon",
    topic: "Should America split into two countries?",
    description: "National divorce debate"
  },
  {
    persona: "Chris Cuomo",
    topic: "Should journalists be activists?",
    description: "Media neutrality"
  },
  {
    persona: "Megyn Kelly",
    topic: "Should we automatically believe all women?",
    description: "Due process and accusations"
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
    topic: "Are men under attack in society?",
    description: "Gender wars and masculinity"
  },
  {
    persona: "Sarah Silverman",
    topic: "Should offensive art be censored?",
    description: "Free expression versus harm"
  },
  {
    persona: "John Mulaney",
    topic: "Should comedians apologize for offensive jokes?",
    description: "Comedy and accountability"
  },
  {
    persona: "Hannah Gadsby",
    topic: "Is cancel culture justice or mob rule?",
    description: "Social accountability debates"
  },
  {
    persona: "Bo Burnham",
    topic: "Should smartphones be banned for kids under 16?",
    description: "Youth and technology"
  },
  {
    persona: "Hank Green",
    topic: "Is TikTok a Chinese surveillance tool?",
    description: "Social media and national security"
  },
  {
    persona: "John Green",
    topic: "Should parents control what teenagers read?",
    description: "Parental rights vs teen autonomy"
  },
  {
    persona: "Casey Neistat",
    topic: "Should children be allowed on social media?",
    description: "Child safety online"
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
    topic: "Is pornography destroying young men?",
    description: "Digital addiction and masculinity"
  },
  {
    persona: "Ninja",
    topic: "Are video games sports?",
    description: "Esports legitimacy"
  },
  {
    persona: "Shroud",
    topic: "Do violent video games create killers?",
    description: "Gaming and violence debate"
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