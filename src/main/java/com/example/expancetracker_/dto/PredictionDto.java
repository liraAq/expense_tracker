package com.example.expancetracker_.dto;

import lombok.Data;

import java.util.Map;

@Data
public class PredictionDto {
    private Map<String, Double> predictedExpenses;
}
