package com.example.expancetracker_.dto;

import com.example.expancetracker_.entity.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
    private Long id;
    private String name;
    private TransactionType type; // або String, якщо enum не використовується
}

