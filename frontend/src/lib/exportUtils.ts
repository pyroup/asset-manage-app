import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { AssetWithCategory } from 'shared/types';

// 日付フォーマット
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * レポート画面をPDFとしてエクスポート（画面キャプチャ版）
 */
export const exportReportAsPDF = async (elementId: string, filename?: string): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    console.log('Found element:', element);
    console.log('Element dimensions:', {
      width: element.offsetWidth,
      height: element.offsetHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight
    });

    // 要素が表示されているかチェック
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
      throw new Error('Element is not visible');
    }

    // html2canvasの設定を改善
    const canvas = await html2canvas(element, {
      scale: 2, // スケールを少し下げる
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: true, // デバッグ用にログを有効化
      imageTimeout: 30000,
      removeContainer: false,
      foreignObjectRendering: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });

    console.log('Canvas created:', {
      width: canvas.width,
      height: canvas.height
    });

    // キャンバスが空でないかチェック
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas is empty');
    }

    // PDFを作成
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // A4サイズの計算
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // 画像のアスペクト比を保持してリサイズ
    const imgAspectRatio = canvas.height / canvas.width;
    let imgWidth = pdfWidth;
    let imgHeight = pdfWidth * imgAspectRatio;

    // 高さがページサイズを超える場合は調整
    if (imgHeight > pdfHeight) {
      imgHeight = pdfHeight;
      imgWidth = pdfHeight / imgAspectRatio;
    }

    // 画像データを取得
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    console.log('Image data length:', imgData.length);

    // 画像をPDFに追加
    let yPosition = 0;
    
    // 最初のページ
    pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);

    // 複数ページが必要な場合の処理
    let remainingHeight = imgHeight - pdfHeight;
    
    while (remainingHeight > 0) {
      pdf.addPage();
      yPosition = -pdfHeight + (imgHeight - remainingHeight);
      pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
      remainingHeight -= pdfHeight;
    }

    // ファイル名を生成
    const defaultFilename = `レポート画面_${formatDate(new Date()).replace(/\//g, '')}.pdf`;
    const finalFilename = filename || defaultFilename;

    console.log('Saving PDF as:', finalFilename);

    // PDFをダウンロード
    pdf.save(finalFilename);
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error(`PDFの生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 資産データをExcelとしてエクスポート
 */
export const exportAssetsAsExcel = (
  assets: AssetWithCategory[],
  filename?: string
): void => {
  try {
    // ワークブック作成
    const workbook = XLSX.utils.book_new();

    // 資産一覧シート
    const assetsData = assets.map(asset => {
      const currentValue = asset.quantity * asset.currentPrice;
      const acquisitionValue = asset.quantity * asset.acquisitionPrice;
      const gainLoss = currentValue - acquisitionValue;
      const gainLossPercent = acquisitionValue > 0 ? (gainLoss / acquisitionValue) * 100 : 0;

      return {
        '資産名': asset.name,
        'シンボル': asset.symbol || '',
        'カテゴリ': asset.category.name,
        '数量': asset.quantity,
        '取得価格': asset.acquisitionPrice,
        '現在価格': asset.currentPrice,
        '取得日': formatDate(asset.acquisitionDate),
        '評価額': currentValue,
        '損益': gainLoss,
        '損益率(%)': gainLossPercent,
        'メモ': asset.notes || ''
      };
    });

    const assetsSheet = XLSX.utils.json_to_sheet(assetsData);
    XLSX.utils.book_append_sheet(workbook, assetsSheet, '資産一覧');

    // カテゴリ別サマリーシート
    const categoryMap = new Map<string, {
      name: string;
      totalValue: number;
      totalGainLoss: number;
      assetCount: number;
    }>();

    let totalPortfolioValue = 0;

    assets.forEach(asset => {
      const currentValue = asset.quantity * asset.currentPrice;
      const acquisitionValue = asset.quantity * asset.acquisitionPrice;
      const gainLoss = currentValue - acquisitionValue;
      
      totalPortfolioValue += currentValue;

      const categoryId = asset.categoryId;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          name: asset.category.name,
          totalValue: 0,
          totalGainLoss: 0,
          assetCount: 0
        });
      }

      const category = categoryMap.get(categoryId)!;
      category.totalValue += currentValue;
      category.totalGainLoss += gainLoss;
      category.assetCount += 1;
    });

    const categoryData = Array.from(categoryMap.values()).map(category => {
      const percentage = (category.totalValue / totalPortfolioValue) * 100;
      const acquisitionValue = category.totalValue - category.totalGainLoss;
      const gainLossPercent = acquisitionValue > 0 ? (category.totalGainLoss / acquisitionValue) * 100 : 0;

      return {
        'カテゴリ': category.name,
        '資産数': category.assetCount,
        '評価額': category.totalValue,
        '構成比(%)': percentage,
        '損益': category.totalGainLoss,
        '損益率(%)': gainLossPercent
      };
    });

    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'カテゴリ別サマリー');

    // ポートフォリオサマリーシート
    const totalValue = assets.reduce((sum, asset) => sum + (asset.quantity * asset.currentPrice), 0);
    const totalAcquisitionValue = assets.reduce((sum, asset) => sum + (asset.quantity * asset.acquisitionPrice), 0);
    const totalGainLoss = totalValue - totalAcquisitionValue;
    const totalGainLossPercent = totalAcquisitionValue > 0 ? (totalGainLoss / totalAcquisitionValue) * 100 : 0;

    const summaryData = [
      { '項目': '総資産額', '値': totalValue, '備考': '' },
      { '項目': '取得価額合計', '値': totalAcquisitionValue, '備考': '' },
      { '項目': '総損益', '値': totalGainLoss, '備考': '' },
      { '項目': '総損益率(%)', '値': totalGainLossPercent, '備考': '' },
      { '項目': '資産数', '値': assets.length, '備考': '件' },
      { '項目': 'レポート生成日', '値': formatDate(new Date()), '備考': '' }
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'ポートフォリオサマリー');

    // 列幅を自動調整
    const sheets = ['資産一覧', 'カテゴリ別サマリー', 'ポートフォリオサマリー'];
    sheets.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;

      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      const colWidths: number[] = [];

      for (let col = range.s.c; col <= range.e.c; col++) {
        let maxWidth = 10;
        for (let row = range.s.r; row <= range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = sheet[cellAddress];
          if (cell && cell.v) {
            const cellValue = String(cell.v);
            maxWidth = Math.max(maxWidth, cellValue.length * 1.2);
          }
        }
        colWidths.push(Math.min(maxWidth, 50)); // 最大幅を50に制限
      }

      sheet['!cols'] = colWidths.map(width => ({ width }));
    });

    // ファイル名を生成
    const defaultFilename = `資産データ_${formatDate(new Date()).replace(/\//g, '')}.xlsx`;
    const finalFilename = filename || defaultFilename;

    // Excelファイルをダウンロード
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, finalFilename);
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error('Excelファイルの生成に失敗しました');
  }
}; 