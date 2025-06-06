package com.example.expancetracker_.repository;

import com.example.expancetracker_.entity.SavingGoal;
import com.example.expancetracker_.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavingGoalRepository extends JpaRepository<SavingGoal, Long> {
    List<SavingGoal> findByUserId(Long userId);

    Optional<SavingGoal> findByIdAndUser(Long id, User user);
}

