package com.example.expancetracker_.controller;

import com.example.expancetracker_.entity.Category;
import com.example.expancetracker_.entity.CategoryType;
import com.example.expancetracker_.entity.TransactionType;
import com.example.expancetracker_.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public List<Category> getCategoriesByType(@RequestParam(name = "type", required = false) String type) {
        if (type == null) {
            return categoryRepository.findAll();
        }

        try {
            TransactionType categoryType = TransactionType.valueOf(type.toUpperCase());
            return categoryRepository.findByType(categoryType);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid category type: " + type);
        }
    }
}
