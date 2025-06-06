import { Component, OnInit } from '@angular/core';
import { TransactionDto, TransactionService } from '../transaction.service';
import { CategoryDto, CategoryService } from '../category.service';

@Component({
  selector: 'app-income',
  templateUrl: './income.component.html',
  styleUrls: ['./income.component.scss']
})
export class IncomeComponent implements OnInit {

  incomes: TransactionDto[] = [];
  filteredIncomes: TransactionDto[] = [];
  totalIncome: number = 0;

  categories: CategoryDto[] = [];

  newIncome: TransactionDto = {
    id: 0,
    description: '',
    amount: 0,
    date: '',
    type: 'INCOME',
    receiptUrl: '',
    category: { id: 0, name: '', type: 'INCOME' }
  };
  

  filter = {
    categoryId: '',
    startDate: '',
    endDate: ''
  };

  receiptFile: File | null = null;

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.loadIncomes();
    this.loadIncomeCategories();
  }

  loadIncomeCategories() {
    this.categoryService.getCategoriesByType('INCOME').subscribe({
      next: data => {
        this.categories = data;
        if (this.categories.length > 0 && this.newIncome.category.id === 0) {
          this.newIncome.category = this.categories[0];
        }
      },
      error: err => console.error('Error loading income categories:', err)
    });
  }

  loadIncomes() {
    this.transactionService.getUserTransactions().subscribe(data => {
      this.incomes = data
        .filter(t => t.type === 'INCOME')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      this.applyFilter();
    });
  }

  calculateTotalIncome() {
    this.totalIncome = this.filteredIncomes.reduce((sum, income) => sum + income.amount, 0);
  }

  addOrUpdateIncome() {
    if (!this.newIncome.description.trim() || this.newIncome.amount <= 0) return;

    const date = new Date(this.newIncome.date);
    if (!date.getHours()) {
      const now = new Date();
      date.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    }
    this.newIncome.date = date.toISOString().split('.')[0];

    const formData = new FormData();
    formData.append('transaction', JSON.stringify(this.newIncome));
    if (this.receiptFile) {
      formData.append('receipt', this.receiptFile);
    }

    const request = this.newIncome.id === 0
      ? this.transactionService.addTransaction(formData)
      : this.transactionService.updateTransaction(this.newIncome.id, formData);

    request.subscribe({
      next: () => {
        this.loadIncomes();
        this.resetIncomeForm();
      },
      error: err => console.error('Error saving income:', err)
    });
  }

  editIncome(income: TransactionDto) {
    this.newIncome = { ...income };
    this.receiptFile = null;
  }

  deleteIncome(id: number) {
    this.transactionService.deleteTransaction(id).subscribe(() => this.loadIncomes());
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find(c => c.id === categoryId)?.name || 'Unknown';
  }

  applyFilter() {
    this.filteredIncomes = this.incomes.filter(income => {
      const matchesCategory = this.filter.categoryId
        ? income.category?.id === +this.filter.categoryId
        : true;

      const incomeDate = new Date(income.date);
      const startDate = this.filter.startDate ? new Date(this.filter.startDate) : null;
      const endDate = this.filter.endDate ? new Date(this.filter.endDate) : null;

      const matchesStart = startDate ? incomeDate >= startDate : true;
      const matchesEnd = endDate ? incomeDate <= endDate : true;

      return matchesCategory && matchesStart && matchesEnd;
    });

    this.calculateTotalIncome();
  }

  resetIncomeForm() {
    this.newIncome = {
      id: 0,
      description: '',
      amount: 0,
      date: '',
      type: 'INCOME',
      receiptUrl: '',
      category: this.categories.length > 0 ? this.categories[0] : { id: 0, name: '', type: 'INCOME' }
    };
    this.receiptFile = null;
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
    this.receiptFile = input.files && input.files.length ? input.files[0] : null;
  }

  viewReceipt(url: string) {
    window.open(url, '_blank');
  }
  
  compareCategories(c1: CategoryDto, c2: CategoryDto): boolean {
    return c1 && c2 ? c1.id === c2.id : c1 === c2;
  }
  
}
