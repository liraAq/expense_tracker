package com.example.expancetracker_.repository;

import com.example.expancetracker_.entity.Transaction;
import com.example.expancetracker_.entity.TransactionType;
import com.example.expancetracker_.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUser(User user);
    List<Transaction> findTransactionsByUser_UsernameAndDateBetween(String username, LocalDateTime startDate, LocalDateTime  endDate);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.type = :type")
    Double sumByUserIdAndType(Long userId, TransactionType type);

    @Query("SELECT t.category.name, SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.type = :type GROUP BY t.category.name")
    List<Object[]> findTransactionSumsByCategory(Long userId, TransactionType type);


}
