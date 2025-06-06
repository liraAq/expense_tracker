import { Component, OnInit } from '@angular/core';
import { TransactionDto, TransactionService } from '../transaction.service';
import { CategoryDto, CategoryService } from '../category.service';

@Component({
  selector: 'app-expense',
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.scss']
})
export class ExpenseComponent implements OnInit {

  expenses: TransactionDto[] = [];
  filteredExpenses: TransactionDto[] = [];
  totalExpense: number = 0;

  categories: CategoryDto[] = [];

  filter = {
    categoryId: '',
    startDate: '',
    endDate: ''
  };

  newExpense: TransactionDto = {
    id: 0,
    description: '',
    amount: 0,
    date: '',
    type: 'EXPENSE',
    receiptUrl: '',
    category: { id: 0, name: '', type: 'EXPENSE' }
  };
  

  selectedReceiptFile: File | null = null;

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadExpenses();
  }

  loadCategories() {
    this.categoryService.getCategoriesByType('EXPENSE').subscribe({
      next: data => {
        this.categories = data;
        if (this.newExpense.category.id === 0 && this.categories.length > 0) {
          this.newExpense.category = this.categories[0];
        }
      },
      error: err => console.error('Помилка при завантаженні категорій витрат', err)
    });
  }

  loadExpenses() {
    this.transactionService.getUserTransactions().subscribe(data => {
      this.expenses = data.filter(t => t.type === 'EXPENSE');
      this.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      this.applyFilter();
    });
  }

  calculateTotalExpense() {
    this.totalExpense = this.filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  addOrUpdateExpense() {
    if (!this.newExpense.description.trim() || this.newExpense.amount <= 0) return;

    const now = new Date();
    const date = new Date(this.newExpense.date);
    if (!date.getHours()) {
      date.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    }
    this.newExpense.date = date.toISOString().split('.')[0];

    const formData = new FormData();
    formData.append('transaction', JSON.stringify(this.newExpense));
    if (this.selectedReceiptFile) {
      formData.append('receipt', this.selectedReceiptFile);
    }

    const request = this.newExpense.id === 0
      ? this.transactionService.addTransaction(formData)
      : this.transactionService.updateTransaction(this.newExpense.id, formData);

    request.subscribe({
      next: () => {
        this.loadExpenses();
        this.resetExpenseForm();
      },
      error: err => console.error('Помилка при збереженні витрати', err)
    });
  }

  editExpense(expense: TransactionDto) {
    this.newExpense = { ...expense };
    this.selectedReceiptFile = null;
  }

  deleteExpense(id: number) {
    this.transactionService.deleteTransaction(id).subscribe(() => this.loadExpenses());
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find(c => c.id === categoryId)?.name || 'Невідома';
  }

  applyFilter() {
    this.filteredExpenses = this.expenses.filter(expense => {
      const matchesCategory = this.filter.categoryId
        ? expense.category?.id === +this.filter.categoryId
        : true;

      const date = new Date(expense.date);
      const start = this.filter.startDate ? new Date(this.filter.startDate) : null;
      const end = this.filter.endDate ? new Date(this.filter.endDate) : null;

      const matchesStart = start ? date >= start : true;
      const matchesEnd = end ? date <= end : true;

      return matchesCategory && matchesStart && matchesEnd;
    });

    this.calculateTotalExpense();
  }

  resetExpenseForm() {
    this.newExpense = {
      id: 0,
      description: '',
      amount: 0,
      date: '',
      type: 'EXPENSE',
      receiptUrl: '',
      category: this.categories.length > 0 ? this.categories[0] : { id: 0, name: '', type: 'EXPENSE' }
    };
    this.selectedReceiptFile = null;
  }
  

  resetFilter() {
    this.filter = {
      categoryId: '',
      startDate: '',
      endDate: ''
    };
    this.applyFilter();
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedReceiptFile = input.files?.[0] || null;
  }

  viewReceipt(url: string) {
    window.open(url, '_blank');
  }

  extractFileName(url: string): string {
    return url.split('/').pop() || 'receipt';
  }
  
  compareCategories(c1: CategoryDto, c2: CategoryDto): boolean {
    return c1 && c2 ? c1.id === c2.id : c1 === c2;
  }
  
}
