import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { TransactionDto, TransactionService } from '../transaction.service';
import type { TooltipItem, ChartOptions, ChartConfiguration } from 'chart.js';
import jsPDF from 'jspdf';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';
import { AnalyticsService, PredictionDto } from '../analytics.service';
import { CategoryService } from '../category.service'; // 👈 додай цей сервіс

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  expensesByCategory: { [category: string]: number } = {};
  incomeByCategory: { [category: string]: number } = {};
  predictedExpenses: { [category: string]: number } = {};
  transactions: TransactionDto[] = [];

  totalIncome = 0;
  totalExpense = 0;
  netBalance = 0;
  averageIncome = 0;
  averageExpense = 0;

  reportFilter = {
    startDate: '',
    endDate: ''
  };
  

  expenseChart: Chart | null = null;
  incomeChart: Chart | null = null;
  predictedChart: Chart | null = null;

  constructor(
    private analyticsService: AnalyticsService,
    private categoryService: CategoryService, // 👈 інжектимо новий сервіс
    private transactionsService: TransactionService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.loadPredictions();
    this.loadCategoryData();
  }

  applyReportFilter(): void {
    // Тут логіка для фільтрації доходів, витрат, графіків та обчислень
    this.loadReportData(this.reportFilter.startDate, this.reportFilter.endDate);
  }

  loadReportData(startDate?: string, endDate?: string): void {
    this.transactionsService.getUserTransactions().subscribe(data => {
      // Фільтруємо транзакції за діапазоном дат
      this.transactions = data.filter(t => {
        const txDate = new Date(t.date);
        const afterStart = startDate ? txDate >= new Date(startDate) : true;
        const beforeEnd = endDate ? txDate <= new Date(endDate) : true;
        return afterStart && beforeEnd;
      });
  
      // Перерахунок основних показників
      this.calculateTotals();
  
      // Оновлення даних по категоріях і графіків
      this.loadCategoryData();
  
      // Прогнозування залишаємо без змін
      this.loadPredictions();
    });
  }
  
  

  loadTransactions() {
    this.transactionsService.getUserTransactions().subscribe(data => {
      this.transactions = data;
      console.log('Loaded transactions:', this.transactions);
      this.calculateTotals();
      this.loadCategoryData(); // 👈 ПЕРЕНЕСЕНО СЮДИ!
    });
  }
  

  calculateTotals() {
    const incomeTransactions = this.transactions.filter(t => t.type === 'INCOME');
    const expenseTransactions = this.transactions.filter(t => t.type === 'EXPENSE');

    this.totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    this.totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    this.netBalance = this.totalIncome - this.totalExpense;

    const totalDays = this.getUniqueDays(this.transactions).length;
    this.averageIncome = totalDays ? this.totalIncome / totalDays : 0;
    this.averageExpense = totalDays ? this.totalExpense / totalDays : 0;
  }

  loadCategoryData() {
    this.expensesByCategory = this.aggregateTransactionsByCategory('EXPENSE');
    this.renderExpenseChart();
  
    this.incomeByCategory = this.aggregateTransactionsByCategory('INCOME');
    this.renderIncomeChart();
  }
  

  
  aggregateTransactionsByCategory(type: string): { [key: string]: number } {
    console.log(`🔍 Стартує агрегація транзакцій типу: ${type}`);
    const grouped: { [key: string]: number } = {};
    const expectedType = type.trim().toUpperCase();
  
    for (const t of this.transactions) {
      const transactionType = t.type?.trim().toUpperCase();
      const category = t.category;
      const categoryName = category?.name?.trim();
  
      console.log(`➡️ Перевірка транзакції:`, {
        type: transactionType,
        expected: expectedType,
        category: category,
        categoryName,
        amount: t.amount
      });
  
      if (transactionType !== expectedType) continue;
      if (!categoryName) continue;
  
      if (!grouped[categoryName]) grouped[categoryName] = 0;
      grouped[categoryName] += t.amount;
    }
  
    console.log(`✅ Згруповано ${type}:`, grouped);
    return grouped;
  }
  

  
  

  loadPredictions() {
    this.analyticsService.getPredictedExpenses().subscribe((response: PredictionDto) => {
      this.predictedExpenses = response.predictedExpenses;
      this.renderPredictedChart();
    });
  }

  renderExpenseChart() {
    if (this.expenseChart) this.expenseChart.destroy();
    this.expenseChart = new Chart('expenseChart', {
      type: 'bar',
      data: {
        labels: Object.keys(this.expensesByCategory),
        datasets: [{
          label: 'Expenses',
          data: Object.values(this.expensesByCategory),
          backgroundColor: Object.keys(this.expensesByCategory).map((_, i) => this.getColor(i)),
          borderRadius: 6,
          barThickness: 22
        }]
      },
      options: this.getChartOptions('Expenses')
    });
  }
  
  renderIncomeChart() {
    if (this.incomeChart) this.incomeChart.destroy();
    this.incomeChart = new Chart('incomeChart', {
      type: 'bar',
      data: {
        labels: Object.keys(this.incomeByCategory),
        datasets: [{
          label: 'Income',
          data: Object.values(this.incomeByCategory),
          backgroundColor: Object.keys(this.incomeByCategory).map((_, i) => this.getColor(i)),
          borderRadius: 6,
          barThickness: 22
        }]
      },
      options: this.getChartOptions('Income')
    });
  }
  
  
  
  renderPredictedChart() {
    if (this.predictedChart) this.predictedChart.destroy();
    this.predictedChart = new Chart('predictedChart', {
      type: 'bar',
      data: {
        labels: Object.keys(this.predictedExpenses),
        datasets: [{
          label: 'Predicted',
          data: Object.values(this.predictedExpenses),
          backgroundColor: Object.keys(this.predictedExpenses).map((_, i) => this.getColor(i)),
          borderRadius: 6,
          barThickness: 22
        }]
      },
      options: this.getChartOptions('Predicted Expenses')
    });
  }
  

  getChartOptions(title: string): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          ticks: {
            color: '#1e293b',
            font: {
              family: 'Georgia, Times New Roman, serif',
              size: 14
            }
          },
          grid: {
            color: '#e2e8f0'
          }
        },
        y: {
          ticks: {
            color: '#1e293b',
            font: {
              family: 'Georgia, Times New Roman, serif',
              size: 14
            }
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#334155',
          titleColor: '#ffffff',
          bodyColor: '#f8fafc',
          padding: 12,
          borderWidth: 1,
          borderColor: '#cbd5e1',
          callbacks: {
            label: (ctx) => `${ctx.label}: $${ctx.raw}`
          }
        },
        title: {
          display: true,
          text: title,
          color: '#1e293b',
          font: {
            family: 'Georgia, Times New Roman, serif',
            size: 18,
            weight: 600
          },
          padding: {
            bottom: 20
          }
        }
      }
    };
  }
  
  

  // generateImageReport() {
  //   const reportElement = document.getElementById('reportToPrint');
  //   if (!reportElement) return;

  //   html2canvas(reportElement, { scale: 2 }).then(canvas => {
  //     canvas.toBlob(blob => {
  //       if (!blob) return;

  //       const formData = new FormData();
  //       formData.append('file', blob, 'report.png');

  //       fetch('http://localhost:8082/analytics/upload-image-report', {
  //         method: 'POST',
  //         body: formData
  //       })
  //       .then(res => res.text())
  //       .then(url => {
  //         alert('✅ Звіт збережено у вигляді зображення!');
  //         window.open(url, '_blank');
  //         this.generatePdfFromImage(url);
  //       })
  //       .catch(err => {
  //         console.error('❌ Upload image error:', err);
  //         alert('⚠️ Помилка під час завантаження звіту.');
  //       });
  //     }, 'image/png');
  //   });
  // }

  // generatePdfFromImage(imageUrl: string) {
  //   const pdf = new jsPDF();
  //   const img = new Image();
  //   img.onload = () => {
  //     const width = pdf.internal.pageSize.getWidth();
  //     const height = (img.height * width) / img.width;
  //     pdf.addImage(img, 'PNG', 0, 0, width, height);
  //     pdf.save('report.pdf');
  //   };
  //   img.src = imageUrl;
  // }

  generatePdfReport(): void {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    let y = 10;
  
    doc.setFontSize(18);
    doc.text('Financial Report', 105, y, { align: 'center' });
    y += 10;
  
    // Date and period
    doc.setFontSize(12);
    const reportDate = new Date().toLocaleDateString();
    doc.text(`Generated on: ${reportDate}`, 14, y);
    y += 7;
  
    const from = this.reportFilter.startDate;
    const to = this.reportFilter.endDate;
    const formattedFrom = new Date(from).toLocaleDateString();
    const formattedTo = new Date(to).toLocaleDateString();
    doc.text(`Period: ${formattedFrom} - ${formattedTo}`, 14, y);
    y += 10;
  
    // Summary
    doc.setFontSize(14);
    doc.text('Summary Overview', 14, y);
    y += 7;
  
    doc.setFontSize(12);
    doc.text(`Total Income: ${this.totalIncome.toFixed(2)} $`, 20, y);
    y += 6;
    doc.text(`Total Expenses: ${this.totalExpense.toFixed(2)} $`, 20, y);
    y += 6;
    doc.text(`Net Balance: ${this.netBalance.toFixed(2)} $`, 20, y);
    y += 6;
    doc.text(`Average Daily Income: ${this.averageIncome.toFixed(2)} $`, 20, y);
    y += 6;
    doc.text(`Average Daily Expenses: ${this.averageExpense.toFixed(2)} $`, 20, y);
    y += 10;
  
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 7;
  
    // Income
    doc.setFontSize(14);
    doc.text('Income Breakdown by Category', 14, y);
    y += 7;
    doc.setFontSize(12);
    for (const [category, amount] of Object.entries(this.incomeByCategory)) {
      doc.text(`• ${category}: ${amount.toFixed(2)} $`, 20, y);
      y += 6;
    }
  
    y += 8;
  
    // Expenses
    doc.setFontSize(14);
    doc.text('Expense Breakdown by Category', 14, y);
    y += 7;
    doc.setFontSize(12);
    for (const [category, amount] of Object.entries(this.expensesByCategory)) {
      doc.text(`• ${category}: ${amount.toFixed(2)} $`, 20, y);
      y += 6;
    }
  
    y += 8;
  
    // Predicted expenses
    if (Object.keys(this.predictedExpenses).length > 0) {
      doc.setFontSize(14);
      doc.text('Predicted Expenses (Forecast)', 14, y);
      y += 7;
      doc.setFontSize(12);
      for (const [category, amount] of Object.entries(this.predictedExpenses)) {
        doc.text(`• ${category}: ${amount.toFixed(2)} $`, 20, y);
        y += 6;
      }
      y += 8;
    }
  
    // Extra insight (idea added)
    doc.setFontSize(14);
    doc.text('Insight', 14, y);
    y += 7;
    doc.setFontSize(12);
  
    const trend = this.totalIncome > this.totalExpense
      ? 'Great job! You are earning more than you spend.'
      : 'Warning: Your expenses exceed your income. Consider revising your budget.';
  
    doc.text(trend, 20, y, { maxWidth: 170 });
    y += 10;
  
    doc.save('financial-report.pdf');
  }
  
  
  

  getColor(index: number): string {
    const palette = [
      '#6f5c4f', '#9a8c7d', '#b8b1a9', '#4b5563',
      '#334155', '#64748b', '#8b5cf6', '#0ea5e9',
      '#f59e0b', '#ef4444'
    ];
    return palette[index % palette.length];
  }
  

  getUniqueDays(transactions: TransactionDto[]): string[] {
    const dates = transactions.map(t => new Date(t.date).toDateString());
    return [...new Set(dates)];
  }

  getKeys(obj: { [key: string]: number }): string[] {
    return Object.keys(obj);
  }
}
