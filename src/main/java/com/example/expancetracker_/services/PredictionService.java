package com.example.expancetracker_.services;

import com.example.expancetracker_.entity.Transaction;
import com.example.expancetracker_.entity.TransactionType;
import com.example.expancetracker_.repository.TransactionRepository;
import org.apache.commons.math3.stat.regression.SimpleRegression;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PredictionService {

    private final TransactionRepository transactionRepository;

    public PredictionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    // Метод для прогнозування витрат на наступний місяць за допомогою лінійної регресії
    public Map<String, Double> predictExpensesForNextMonth(String username) {
        // Правильно створюємо діапазон дат у форматі LocalDateTime
        LocalDateTime startDate = LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime endDate = LocalDate.now().plusDays(1).atStartOfDay(); // включити сьогодні повністю

        List<Transaction> transactions = transactionRepository
                .findTransactionsByUser_UsernameAndDateBetween(username, startDate, endDate);

        // Групування та підрахунок
        Map<String, Double> categoryExpenses = transactions.stream()
                .filter(transaction -> transaction.getType() == TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        transaction -> transaction.getCategory().getName(),
                        Collectors.summingDouble(Transaction::getAmount)
                ));

        return categoryExpenses.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> predictNextMonthExpense(entry.getValue())
                ));
    }


    // Функція для прогнозування витрат за допомогою лінійної регресії
    private double predictNextMonthExpense(double currentExpense) {
        SimpleRegression regression = new SimpleRegression();

        // Використовуємо кілька даних для лінійної регресії
        // Точки для регресії (місяць, витрати)
        // Наприклад, будемо прогнозувати на основі попередніх 3 місяців
        for (int i = 1; i <= 3; i++) {
            regression.addData(i, currentExpense);  // i - це порядковий номер місяця, currentExpense - це витрати
        }

        // Прогнозуємо витрати на наступний місяць
        return regression.predict(4);  // 4 - це наступний місяць
    }
}
