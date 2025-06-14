export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">スタイルテストページ</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">カード1</h2>
            <p className="text-gray-600">Tailwind CSSが正常に読み込まれているかのテストです。</p>
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              ボタン
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">カード2</h2>
            <p className="text-gray-600">レスポンシブグリッドのテストです。</p>
            <div className="mt-4 space-x-2">
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-sm rounded">成功</span>
              <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-sm rounded">エラー</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">カード3</h2>
            <p className="text-gray-600">アニメーションとホバー効果のテストです。</p>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-3/4 transition-all"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">フォームテスト</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                テキスト入力
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="テキストを入力してください"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                セレクトボックス
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>オプション1</option>
                <option>オプション2</option>
                <option>オプション3</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              送信
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
