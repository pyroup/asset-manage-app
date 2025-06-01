// 日本語フォント設定用モジュール

/**
 * Google Fonts APIから日本語フォントを取得
 */
export const loadJapaneseFont = async (): Promise<string> => {
  try {
    // Google Fonts APIからNoto Sans JPのWOFF2フォントを取得
    const fontUrl = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap';
    const response = await fetch(fontUrl);
    const cssText = await response.text();
    
    // CSS内のフォントURLを抽出
    const fontUrlMatch = cssText.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/);
    if (!fontUrlMatch) {
      throw new Error('Font URL not found');
    }
    
    // フォントファイルをダウンロード
    const fontFileResponse = await fetch(fontUrlMatch[1]);
    const fontArrayBuffer = await fontFileResponse.arrayBuffer();
    
    // ArrayBufferをbase64に変換
    const base64Font = arrayBufferToBase64(fontArrayBuffer);
    return base64Font;
  } catch (error) {
    console.error('Failed to load Japanese font:', error);
    // フォールバック: 内蔵の基本フォント設定
    return '';
  }
};

/**
 * ArrayBufferをbase64文字列に変換
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  return btoa(binary);
};

/**
 * 軽量な日本語フォントサポート（フォールバック用）
 */
export const setupBasicJapaneseSupport = () => {
  // ブラウザでサポートされている日本語フォント
  const japaneseFonts = [
    '"Hiragino Kaku Gothic ProN"',
    '"Hiragino Sans"',
    '"BIZ UDPGothic"',
    '"Meiryo"',
    '"MS PGothic"',
    '"Yu Gothic"',
    '"Noto Sans JP"',
    'sans-serif'
  ].join(',');
  
  return {
    fontFamily: japaneseFonts,
    fallbacks: [
      'Arial Unicode MS',
      'Microsoft YaHei',
      'SimSun',
      'sans-serif'
    ]
  };
}; 