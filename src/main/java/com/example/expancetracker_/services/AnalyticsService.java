package com.example.expancetracker_.services;

import com.example.expancetracker_.entity.TransactionType;
import com.example.expancetracker_.repository.TransactionRepository;
import com.example.expancetracker_.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public AnalyticsService(TransactionRepository transactionRepository, UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    // Загальні доходи та витрати
    public Map<String, Double> getFinancialSummary(String username) {
        System.out.println(username);
        Long userId = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found")).getId();

        Double totalIncome = transactionRepository.sumByUserIdAndType(userId, TransactionType.INCOME);
        Double totalExpense = transactionRepository.sumByUserIdAndType(userId, TransactionType.EXPENSE);

        Map<String, Double> summary = new HashMap<>();
        summary.put("totalIncome", totalIncome != null ? totalIncome : 0.0);
        summary.put("totalExpense", totalExpense != null ? totalExpense : 0.0);

        return summary;
    }

    public Map<String, Double> getTransactionsByCategory(String username, TransactionType type) {
        Long userId = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found")).getId();

        return transactionRepository.findTransactionSumsByCategory(userId, type)
                .stream()
                .collect(Collectors.toMap(
                        obj -> (String) obj[0],
                        obj -> (Double) obj[1]
                ));
    }

}
