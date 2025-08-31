import React, { useState } from 'react';

export const DEBATE_TOPICS = {
  "Politics & Policy": [
    "Should universal basic income be implemented?",
    "Is democracy the best form of government?",
    "Should voting be mandatory?",
    "Are term limits necessary for all elected positions?",
  ],
  "Ethics & Philosophy": [
    "Is free will an illusion?",
    "Are humans inherently good or evil?",
    "Is morality objective or subjective?",
    "Should we have a right to die?",
  ],
  "Science & Technology": [
    "Is artificial intelligence a threat to humanity?",
    "Should we prioritize space exploration?",
    "Are GMOs safe and necessary?",
    "Should human genetic engineering be allowed?",
  ],
  "Economics": [
    "Is capitalism the best economic system?",
    "Should college education be free?",
    "Is cryptocurrency the future of money?",
    "Should there be a maximum wage?",
  ],
  "Social Issues": [
    "Is social media harmful to society?",
    "Should hate speech be protected as free speech?",
    "Is cancel culture justified?",
    "Should we abolish gender roles?",
  ],
  "Environment": [
    "Is nuclear energy the solution to climate change?",
    "Should we ban single-use plastics?",
    "Is veganism morally superior?",
    "Can technology solve the climate crisis?",
  ]
};

interface TopicSelectorProps {
  selectedTopic: string;
  customTopic: string;
  onTopicSelect: (topic: string) => void;
  onCustomTopicChange: (topic: string) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopic,
  customTopic,
  onTopicSelect,
  onCustomTopicChange
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Politics & Policy");

  const handleRandomTopic = () => {
    const allTopics = Object.values(DEBATE_TOPICS).flat();
    const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
    onTopicSelect(randomTopic);
    onCustomTopicChange('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Select a Debate Topic</h2>
        
        {/* Random Topic Button */}
        <div className="text-center mb-6">
          <button
            onClick={handleRandomTopic}
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-lg transition-all"
          >
            🎲 Random Topic
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
          {Object.keys(DEBATE_TOPICS).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedCategory === category
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Topics Grid */}
        <div className="grid gap-3 mb-6">
          {DEBATE_TOPICS[selectedCategory as keyof typeof DEBATE_TOPICS].map((topic) => (
            <button
              key={topic}
              onClick={() => {
                onTopicSelect(topic);
                onCustomTopicChange('');
              }}
              className={`p-4 rounded-lg text-left transition-all ${
                selectedTopic === topic && !customTopic
                  ? 'bg-gray-50 border-2 border-gray-900 text-gray-900'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Custom Topic */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Or Enter Your Own Topic</h3>
          <input
            type="text"
            placeholder="Enter a custom debate topic..."
            value={customTopic}
            onChange={(e) => {
              onCustomTopicChange(e.target.value);
              onTopicSelect('');
            }}
            className="w-full p-4 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

export default TopicSelector;