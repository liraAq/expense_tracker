import { Component, OnInit, OnDestroy } from '@angular/core';
import { Chart, ChartOptions } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { Subscription } from 'rxjs';
import { TransactionDto, TransactionService } from '../transaction.service';
import { SavingGoalsService, SavingGoalDto } from '../saving-goal.service';

export interface SavingGoalExtended extends SavingGoalDto {
  progress: number;
  isDeadlineNear: boolean;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  formCollapsed: boolean = false;
  transactions: TransactionDto[] = [];
  savingGoals: SavingGoalExtended[] = [];
  editingGoal: SavingGoalExtended | null = null;
  newGoal: SavingGoalDto = {
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: ''
  };

  summaries = [
    { title: 'Balance', amount: 0 },
    { title: 'Total Income', amount: 0 },
    { title: 'Total Expense', amount: 0 }
  ];

  goalFormFields: { id: string; label: string; type: string; model: keyof SavingGoalDto }[] = [
    { id: 'goalName', label: 'Goal Name', type: 'text', model: 'name' },
    { id: 'targetAmount', label: 'Target Amount', type: 'number', model: 'targetAmount' },
    { id: 'currentAmount', label: 'Current Amount', type: 'number', model: 'currentAmount' },
    { id: 'deadline', label: 'Deadline', type: 'date', model: 'deadline' }
  ];
  

  incomeChart: Chart | null = null;
  expenseChart: Chart | null = null;
  balance: number = 0;
  totalIncome: number = 0;
  totalExpense: number = 0;
  averageIncome: number = 0;
  averageExpense: number = 0;
  private subscription: Subscription | null = null;

  
  previousAmount: number | null = null; // Змінна для збереження старої суми
  previousDeadline: string | null = null;

  latestIncome: TransactionDto | null = null;
  latestExpense: TransactionDto | null = null;
  minIncome: number = 0;
  maxIncome: number = 0;
  minExpense: number = 0;
  maxExpense: number = 0;

  constructor(
    private transactionService: TransactionService,
    private savingGoalService: SavingGoalsService
  ) {}

  ngOnInit() {
    this.fetchTransactions();
    this.fetchSavingGoals();
  }
  
  toggleForm() {
    this.formCollapsed = !this.formCollapsed;
  }

  fetchTransactions() {
    this.subscription = this.transactionService.getUserTransactions().subscribe(data => {
      this.transactions = data;
      this.calculateTotals();
      this.updateRecentHistory();
      this.createCharts();
    });
  }

  fetchSavingGoals() {
    this.savingGoalService.getGoals().subscribe(goals => {
      const extendedGoals: SavingGoalExtended[] = goals.map(goal => {
        const progress = this.calculateProgress(goal.currentAmount, goal.targetAmount);
        const isDeadlineNear = this.checkDeadlineNear(goal.deadline);
        return {
          ...goal,
          progress,
          isDeadlineNear
        };
      });
      this.savingGoals = extendedGoals;
    });
  }

  calculateProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  }

  checkDeadlineNear(deadline: string): boolean {
    const now = new Date();
    const due = new Date(deadline);
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 && diffDays >= 0;
  }

  editGoal(goal: SavingGoalExtended) {
    this.editingGoal = goal;
    this.previousAmount = goal.currentAmount;
    this.previousDeadline = goal.deadline;
    console.log('Previous ' + this.previousAmount) // Зберігаємо стару суму
  }


  cancelEdit() {
    this.editingGoal = null;
    this.previousAmount = null; // Очистити стару суму
    this.fetchSavingGoals();
  }

  // updateGoal(goal: SavingGoalExtended) {
  //   this.savingGoalService.update(goal).subscribe({
  //     next: (updatedGoal) => {
  //       goal.progress = this.calculateProgress(updatedGoal.currentAmount, updatedGoal.targetAmount);
  //       goal.isDeadlineNear = this.checkDeadlineNear(updatedGoal.deadline);
  //       this.editingGoal = null;
  //       console.log('Goal updated successfully');
  //     },
  //     error: (err) => console.error('Error updating goal', err)
  //   });
  // }

  updateGoal(goal: SavingGoalExtended) {

    if (this.previousAmount === null) {
      console.error('[updateGoal] Previous amount is null');
      return; // Вихід, якщо попередня сума не визначена
    }

    // Зберігаємо попереднє значення суми перед редагуванням
    const previousAmount = this.previousAmount;
    console.log('Previous Amount:', previousAmount); // Debug: Вивести попереднє значення

  
    // Створення копії об'єкта та оновлення значення currentAmount
    const goalToUpdate = { ...goal, currentAmount: goal.currentAmount };
  
    this.savingGoalService.update(goalToUpdate).subscribe({
      next: (updatedGoalRaw) => {
        const updatedGoal = updatedGoalRaw as SavingGoalExtended;
  
        console.log('Updated Amount:', updatedGoal.currentAmount); // Debug: Вивести оновлене значення
  
        // Обчислення прогресу та перевірка дедлайну
        updatedGoal.progress = this.calculateProgress(updatedGoal.currentAmount, updatedGoal.targetAmount);
        updatedGoal.isDeadlineNear = this.checkDeadlineNear(updatedGoal.deadline);
  
        // Обчислення різниці між попереднім та оновленим значенням
        const diff = updatedGoal.currentAmount - previousAmount;
        console.log('Amount Difference (diff):', diff); // Debug: Вивести різницю
  
        // Якщо сума змінилася, створюємо витрати
        if (diff !== 0) {
          const expense = {
            id: 0,
            amount: diff,
            category: { id: 8, name: 'Savings', type: 'EXPENSE' },
            description: `Deposit update for goal: ${updatedGoal.name}`,
            date: new Date().toISOString().split('.')[0],
            type: 'EXPENSE'
          };
  
          const formData = new FormData();
          formData.append('transaction', JSON.stringify(expense));
  
          this.transactionService.addTransaction(formData).subscribe({
            next: () => {
              console.log('[updateGoal] Expense created for goal update');
              this.fetchTransactions(); // Оновити загальні фінанси
              this.fetchSavingGoals(); // Оновити список цілей
            },
            error: err => console.error('[updateGoal] Error creating expense', err)
          });
        } else {
          console.log('[updateGoal] Amount did not change.');
          this.fetchSavingGoals(); // Оновити список цілей навіть без змін
        }
  
        this.editingGoal = null;
      },
      error: (err) => console.error('[updateGoal] Error updating goal', err)
    });
  }
  
  
  
  
  
  
  
  

  // addGoal() {
  //   this.savingGoalService.create(this.newGoal).subscribe({
  //     next: (createdGoal) => {
  //       const progress = this.calculateProgress(createdGoal.currentAmount, createdGoal.targetAmount);
  //       const isDeadlineNear = this.checkDeadlineNear(createdGoal.deadline);
  //       this.savingGoals.push({ ...createdGoal, progress, isDeadlineNear });
  //       this.newGoal = { name: '', targetAmount: 0, currentAmount: 0, deadline: '' };
  //       console.log('Goal added successfully');
  //     },
  //     error: (err) => console.error('Error adding goal', err)
  //   });
  // }

  addGoal() {
    if (!this.newGoal.name.trim() || this.newGoal.targetAmount <= 0) return;
  
    this.savingGoalService.create(this.newGoal).subscribe({
      next: (createdGoal) => {
        const progress = this.calculateProgress(createdGoal.currentAmount, createdGoal.targetAmount);
        const isDeadlineNear = this.checkDeadlineNear(createdGoal.deadline);
        this.savingGoals.push({ ...createdGoal, progress, isDeadlineNear });
        console.log('Goal added successfully');
  
        // 👉 Створити відповідну витрату, якщо currentAmount > 0
        if (createdGoal.currentAmount > 0) {
          const expense = {
            id: 0,
            amount: createdGoal.currentAmount,
            category: { id: 8, name: 'Savings', type: 'EXPENSE' },
            description: `Initial deposit to goal: ${createdGoal.name}`,
            date: new Date().toISOString().split('.')[0],
            type: 'EXPENSE'  // Переконайтеся, що тип транзакції передається
          };
          
  
          const formData = new FormData();
          formData.append('transaction', JSON.stringify(expense));
          // без чека
  
          this.transactionService.addTransaction(formData).subscribe({
            next: () => console.log('Initial deposit expense created'),
            error: err => console.error('Error creating expense for initial goal deposit', err)
          });
        }
  
        // очистити форму
        this.newGoal = { name: '', targetAmount: 0, currentAmount: 0, deadline: '' };
      },
      error: (err) => console.error('Error adding goal', err)
    });
  }
  

  deleteGoal(goalId: number) {
    this.savingGoalService.delete(goalId).subscribe({
      next: () => {
        this.savingGoals = this.savingGoals.filter(g => g.id !== goalId);
        console.log('Goal deleted successfully');
      },
      error: (err) => console.error('Error deleting goal', err)
    });
  }

  updateRecentHistory() {
    const incomes = this.transactions.filter(t => t.type === 'INCOME');
    const expenses = this.transactions.filter(t => t.type === 'EXPENSE');

    this.latestIncome = incomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    this.latestExpense = expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    this.minIncome = incomes.length ? Math.min(...incomes.map(t => t.amount)) : 0;
    this.maxIncome = incomes.length ? Math.max(...incomes.map(t => t.amount)) : 0;
    this.minExpense = expenses.length ? Math.min(...expenses.map(t => t.amount)) : 0;
    this.maxExpense = expenses.length ? Math.max(...expenses.map(t => t.amount)) : 0;
  }

  calculateTotals() {
    this.totalIncome = this.transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    this.totalExpense = this.transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    this.balance = this.totalIncome - this.totalExpense;

    const totalDays = this.getUniqueDays(this.transactions).length;
    this.averageIncome = totalDays > 0 ? this.totalIncome / totalDays : 0;
    this.averageExpense = totalDays > 0 ? this.totalExpense / totalDays : 0;

    this.summaries = [
      { title: 'Balance', amount: this.balance },
      { title: 'Total Income', amount: this.totalIncome },
      { title: 'Total Expense', amount: this.totalExpense }
    ];
  }

  getUniqueDays(transactions: TransactionDto[]) {
    const dates = transactions.map(t => new Date(t.date).setHours(0, 0, 0, 0));
    return [...new Set(dates)];
  }

  createCharts() {
    if (this.incomeChart) this.incomeChart.destroy();
    if (this.expenseChart) this.expenseChart.destroy();

    const incomeData = this.groupByDateAndSum(this.transactions.filter(t => t.type === 'INCOME'));
    const expenseData = this.groupByDateAndSum(this.transactions.filter(t => t.type === 'EXPENSE'));

    const commonOptions = (title: string): ChartOptions<'line'> => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { type: 'time', time: { unit: 'day', tooltipFormat: 'PPP' }, ticks: { color: '#2b2b2b', font: { family: 'Georgia, Times New Roman, serif', size: 13 } }, grid: { color: '#dcd7d0' }},
        y: { beginAtZero: true, ticks: { color: '#2b2b2b', font: { family: 'Georgia, Times New Roman, serif', size: 13 } }, grid: { color: '#dcd7d0' }}
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#2b2b2b',
          bodyColor: '#6f5c4f',
          borderColor: '#cfcac3',
          borderWidth: 1,
          titleFont: { family: 'Georgia, Times New Roman, serif', size: 14 },
          bodyFont: { family: 'Georgia, Times New Roman, serif', size: 13 },
          padding: 12,
          callbacks: { label: (ctx) => `${ctx.dataset.label}: $${ctx.raw}` }
        },
        title: { display: true, text: title, color: '#2b2b2b', font: { family: 'Georgia, Times New Roman, serif', size: 18, weight: 600 }, padding: { bottom: 16 }}
      }
    });

    const incomePlugins = [{
      id: 'shadowLine',
      beforeDatasetsDraw: (chart: any) => { const ctx = chart.ctx; ctx.save(); ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4; },
      afterDatasetsDraw: (chart: any) => { chart.ctx.restore(); }
    }];

    this.incomeChart = new Chart('incomeChart', {
      type: 'line',
      data: { datasets: [{ label: 'Income', data: incomeData, borderColor: '#28a745', backgroundColor: 'rgba(40, 167, 69, 0.15)', pointBackgroundColor: '#ffffff', pointBorderColor: '#28a745', pointBorderWidth: 2, pointRadius: 6, fill: true, tension: 0.3 }] },
      options: commonOptions('Income Over Time'),
      plugins: incomePlugins
    });

    this.expenseChart = new Chart('expenseChart', {
      type: 'line',
      data: { datasets: [{ label: 'Expense', data: expenseData, borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.15)', pointBackgroundColor: '#ffffff', pointBorderColor: '#dc3545', pointBorderWidth: 2, pointRadius: 6, fill: true, tension: 0.3 }] },
      options: commonOptions('Expenses Over Time'),
      plugins: incomePlugins
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.incomeChart?.destroy();
    this.expenseChart?.destroy();
  }

  groupByDateAndSum(transactions: TransactionDto[]) {
    const groupedData: { x: number, y: number }[] = [];

    transactions.forEach(transaction => {
      const date = new Date(transaction.date).setHours(0, 0, 0, 0);
      const existingEntry = groupedData.find(entry => entry.x === date);
      if (existingEntry) {
        existingEntry.y += transaction.amount;
      } else {
        groupedData.push({ x: date, y: transaction.amount });
      }
    });

    groupedData.sort((a, b) => a.x - b.x);
    return groupedData;
  }
}
