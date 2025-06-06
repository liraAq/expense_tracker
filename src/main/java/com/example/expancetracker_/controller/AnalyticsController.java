package com.example.expancetracker_.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.expancetracker_.dto.PredictionDto;
import com.example.expancetracker_.entity.TransactionType;
import com.example.expancetracker_.entity.User;
import com.example.expancetracker_.services.AnalyticsService;
import com.example.expancetracker_.services.AuthService;
import com.example.expancetracker_.services.PredictionService;
import com.example.expancetracker_.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final PredictionService predictionService;
    private final AuthService authService;
    private final Cloudinary cloudinary;

    public AnalyticsController(AnalyticsService analyticsService, PredictionService predictionService, AuthService authService, Cloudinary cloudinary) {
        this.analyticsService = analyticsService;
        this.predictionService = predictionService;
        this.authService = authService;
        this.cloudinary = cloudinary;
    }

    // Загальні доходи та витрати
    @GetMapping("/summary")
    public Map<String, Double> getSummary() {
        // Отримуємо поточного користувача з SecurityContext
        User user = authService.getCurrentUser();

        return analyticsService.getFinancialSummary(user.getUsername());
    }

    @GetMapping("/expenses/by-category")
    public ResponseEntity<Map<String, Double>> getExpensesByCategory() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(analyticsService.getTransactionsByCategory(user.getUsername(), TransactionType.EXPENSE));
    }

    @GetMapping("/income/by-category")
    public ResponseEntity<Map<String, Double>> getIncomeByCategory() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(analyticsService.getTransactionsByCategory(user.getUsername(), TransactionType.INCOME));
    }


    @GetMapping("/predict-expenses")
    public ResponseEntity<PredictionDto> getPredictedExpenses() {
        User user = authService.getCurrentUser();
        Map<String, Double> predictedExpenses = predictionService.predictExpensesForNextMonth(user.getUsername());
        PredictionDto predictionDto = new PredictionDto();
        predictionDto.setPredictedExpenses(predictedExpenses);
        return ResponseEntity.ok(predictionDto);
    }

    @PostMapping("/upload-image-report")
    public ResponseEntity<String> uploadImageReport(@RequestParam("file") MultipartFile file) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "reports",
                "resource_type", "image"
        ));

        String url = (String) uploadResult.get("secure_url");
        return ResponseEntity.ok(url);
    }


}

