import Link from 'next/link';

export default function ConceptsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
        New Debate UI Concepts
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Link href="/concepts/arena" className="block p-6 border border-gray-800 rounded-xl hover:border-purple-500 hover:bg-gray-900 transition-all group">
          <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">⚔️</div>
          <h2 className="text-xl font-bold mb-2">The Arena</h2>
          <p className="text-gray-400 text-sm">Fighting game style interface. Health bars, damage indicators, competitive visual flow.</p>
        </Link>
        
        <Link href="/concepts/stream" className="block p-6 border border-gray-800 rounded-xl hover:border-green-500 hover:bg-gray-900 transition-all group">
          <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
          <h2 className="text-xl font-bold mb-2">Data Stream</h2>
          <p className="text-gray-400 text-sm">Cyberpunk, high-density data visualization. Focus on logic flow and argument structure.</p>
        </Link>
        
        <Link href="/concepts/court" className="block p-6 border border-gray-800 rounded-xl hover:border-yellow-500 hover:bg-gray-900 transition-all group">
          <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">⚖️</div>
          <h2 className="text-xl font-bold mb-2">The Courtroom</h2>
          <p className="text-gray-400 text-sm">Legal drama setting. Judge, jury, evidence. Formal but dramatic presentation.</p>
        </Link>
      </div>
    </div>
  );
}
