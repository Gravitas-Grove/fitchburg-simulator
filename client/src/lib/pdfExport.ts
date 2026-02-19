import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { ScorecardResult } from '@/types/scorecard';
import { GRADE_COLORS } from '@/data/designTokens';
import type { Grade } from '@/types/scorecard';

interface ExportOptions {
  includeMap: boolean;
  includeScorecard: boolean;
  includeRadar: boolean;
  includeAI: boolean;
}

interface ExportData {
  scenarioName: string;
  growthRate: number;
  density: string;
  scorecard: ScorecardResult | null;
  aiAnalysis?: string;
}

const FITCHBURG_TEAL = [78, 205, 196] as const;
const DARK_BG = [12, 17, 23] as const;
const CARD_BG = [26, 35, 50] as const;
const TEXT_PRIMARY = [232, 237, 243] as const;
const TEXT_SECONDARY = [136, 150, 167] as const;

export class ReportGenerator {
  private pdf: jsPDF;
  private y: number = 0;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 40;

  constructor() {
    this.pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  async generate(data: ExportData, options: ExportOptions): Promise<jsPDF> {
    this.addCoverPage(data);

    if (options.includeMap) {
      await this.addMapPage();
    }

    if (options.includeScorecard && data.scorecard) {
      this.addScorecardPage(data.scorecard, data.scenarioName);
    }

    if (options.includeRadar) {
      await this.addRadarPage();
    }

    if (options.includeAI && data.aiAnalysis) {
      this.addAIPage(data.aiAnalysis);
    }

    return this.pdf;
  }

  private addCoverPage(data: ExportData) {
    // Dark background
    this.pdf.setFillColor(...DARK_BG);
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    // Teal accent bar
    this.pdf.setFillColor(...FITCHBURG_TEAL);
    this.pdf.rect(this.margin, 160, 80, 4, 'F');

    // Title block
    this.pdf.setTextColor(...FITCHBURG_TEAL);
    this.pdf.setFontSize(11);
    this.pdf.text('CITY OF FITCHBURG, WISCONSIN', this.margin, 140);

    this.pdf.setTextColor(...TEXT_PRIMARY);
    this.pdf.setFontSize(32);
    this.pdf.text('Growth Scenario', this.margin, 200);
    this.pdf.text('Analysis Report', this.margin, 240);

    // Scenario details
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(...FITCHBURG_TEAL);
    this.pdf.text(data.scenarioName, this.margin, 300);

    this.pdf.setTextColor(...TEXT_SECONDARY);
    this.pdf.setFontSize(11);
    this.pdf.text(`Growth Rate: ${data.growthRate} acres/year`, this.margin, 330);
    this.pdf.text(`Density: ${data.density === 'low' ? '3' : data.density === 'high' ? '7.5' : '5'} DU/acre (${data.density})`, this.margin, 348);

    if (data.scorecard) {
      this.pdf.text(`Overall Grade: ${data.scorecard.overallGrade} (${Math.round(data.scorecard.overallScore)}/100)`, this.margin, 366);
    }

    // Date
    this.pdf.setTextColor(...TEXT_SECONDARY);
    this.pdf.setFontSize(10);
    this.pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, this.margin, 420);
    this.pdf.text('Comprehensive Plan Update · 2025', this.margin, 438);

    // Footer
    this.pdf.setFontSize(8);
    this.pdf.text('Fitchburg Growth Scenario Simulator', this.margin, this.pageHeight - 40);
  }

  private async addMapPage() {
    this.pdf.addPage();
    this.pdf.setFillColor(...DARK_BG);
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    this.addPageHeader('Map View');

    // Capture the map element
    const mapEl = document.querySelector('.leaflet-container') as HTMLElement;
    if (mapEl) {
      try {
        const canvas = await html2canvas(mapEl, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = this.pageWidth - this.margin * 2;
        const imgHeight = (canvas.height / canvas.width) * imgWidth;
        this.pdf.addImage(imgData, 'PNG', this.margin, 80, imgWidth, Math.min(imgHeight, this.pageHeight - 120));
      } catch {
        this.pdf.setTextColor(...TEXT_SECONDARY);
        this.pdf.setFontSize(12);
        this.pdf.text('Map capture unavailable', this.pageWidth / 2, this.pageHeight / 2, { align: 'center' });
      }
    }
  }

  private addScorecardPage(scorecard: ScorecardResult, scenarioName: string) {
    this.pdf.addPage();
    this.pdf.setFillColor(...DARK_BG);
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    this.addPageHeader('Scorecard Analysis');
    this.y = 90;

    // Overall grade
    this.pdf.setTextColor(...TEXT_PRIMARY);
    this.pdf.setFontSize(14);
    this.pdf.text(`${scenarioName} — Overall: ${scorecard.overallGrade}`, this.margin, this.y);
    this.y += 30;

    // Dimensions
    for (const dim of scorecard.dimensions) {
      if (this.y > this.pageHeight - 100) {
        this.pdf.addPage();
        this.pdf.setFillColor(...DARK_BG);
        this.pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
        this.y = 50;
      }

      // Dimension header with grade
      const gradeColor = GRADE_COLORS[dim.grade as Grade];
      const rgb = this.hexToRgb(gradeColor);
      this.pdf.setFillColor(...CARD_BG);
      this.pdf.roundedRect(this.margin, this.y, this.pageWidth - this.margin * 2, 24, 4, 4, 'F');

      this.pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
      this.pdf.setFontSize(12);
      this.pdf.text(`${dim.grade}`, this.margin + 12, this.y + 16);

      this.pdf.setTextColor(...TEXT_PRIMARY);
      this.pdf.setFontSize(11);
      this.pdf.text(`${dim.label} — ${Math.round(dim.score)}/100`, this.margin + 36, this.y + 16);
      this.y += 32;

      // Metrics
      this.pdf.setFontSize(9);
      for (const metric of dim.metrics) {
        this.pdf.setTextColor(...TEXT_SECONDARY);
        this.pdf.text(metric.label, this.margin + 16, this.y);
        this.pdf.setTextColor(...TEXT_PRIMARY);
        this.pdf.text(metric.formatted, this.pageWidth - this.margin - 16, this.y, { align: 'right' });
        this.y += 15;
      }
      this.y += 10;
    }
  }

  private async addRadarPage() {
    this.pdf.addPage();
    this.pdf.setFillColor(...DARK_BG);
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    this.addPageHeader('Scenario Comparison');

    // Try to capture the radar chart
    const radarEl = document.querySelector('.recharts-responsive-container') as HTMLElement;
    if (radarEl) {
      try {
        const canvas = await html2canvas(radarEl, {
          backgroundColor: null,
          scale: 2,
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = this.pageWidth - this.margin * 2;
        const imgHeight = (canvas.height / canvas.width) * imgWidth;
        this.pdf.addImage(imgData, 'PNG', this.margin, 80, imgWidth, Math.min(imgHeight, 400));
      } catch {
        this.pdf.setTextColor(...TEXT_SECONDARY);
        this.pdf.setFontSize(12);
        this.pdf.text('Radar chart capture unavailable', this.pageWidth / 2, 200, { align: 'center' });
      }
    }
  }

  private addAIPage(analysis: string) {
    this.pdf.addPage();
    this.pdf.setFillColor(...DARK_BG);
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    this.addPageHeader('AI Analysis');
    this.y = 90;

    // Clean markdown and render as text
    const cleanText = analysis
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/### /g, '')
      .replace(/## /g, '')
      .replace(/\|[-:| ]+\|/g, '') // Remove separator rows
      .replace(/^\|/gm, '  ');

    this.pdf.setTextColor(...TEXT_SECONDARY);
    this.pdf.setFontSize(9);

    const lines = this.pdf.splitTextToSize(cleanText, this.pageWidth - this.margin * 2);
    for (const line of lines) {
      if (this.y > this.pageHeight - 50) {
        this.pdf.addPage();
        this.pdf.setFillColor(...DARK_BG);
        this.pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
        this.y = 50;
      }
      this.pdf.text(line, this.margin, this.y);
      this.y += 13;
    }
  }

  private addPageHeader(title: string) {
    this.pdf.setTextColor(...FITCHBURG_TEAL);
    this.pdf.setFontSize(9);
    this.pdf.text('FITCHBURG GROWTH SIMULATOR', this.margin, 35);

    this.pdf.setTextColor(...TEXT_PRIMARY);
    this.pdf.setFontSize(18);
    this.pdf.text(title, this.margin, 60);

    // Teal line
    this.pdf.setDrawColor(...FITCHBURG_TEAL);
    this.pdf.setLineWidth(1);
    this.pdf.line(this.margin, 68, this.pageWidth - this.margin, 68);
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [255, 255, 255];
  }
}
