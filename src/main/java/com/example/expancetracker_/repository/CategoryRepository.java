package com.example.expancetracker_.repository;


import com.example.expancetracker_.entity.Category;
import com.example.expancetracker_.entity.CategoryType;
import com.example.expancetracker_.entity.TransactionType;
import com.example.expancetracker_.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByType(TransactionType type);

//    Category findByNameAndUser(String name, User user);
}
