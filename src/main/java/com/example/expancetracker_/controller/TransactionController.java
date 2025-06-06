package com.example.expancetracker_.controller;

import com.example.expancetracker_.dto.TransactionDto;
import com.example.expancetracker_.entity.Transaction;
import com.example.expancetracker_.services.TransactionService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Transaction> addTransaction(
            @RequestParam("transaction") String transactionJson,
            @RequestPart(value = "receipt", required = false) MultipartFile receipt
    ) throws JsonProcessingException {

        // ✅ Десеріалізація вручну
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule()); // ⬅️ Важливо для LocalDateTime

        TransactionDto transactionDto = mapper.readValue(transactionJson, TransactionDto.class);

        System.out.println("DTO description: " + transactionDto.getDescription());
        System.out.println("DTO amount: " + transactionDto.getAmount());

        Transaction transaction = transactionService.addTransaction(transactionDto, receipt);
        return ResponseEntity.ok(transaction);
    }


    @GetMapping
    public ResponseEntity<List<TransactionDto>> getUserTransactions() {
        return ResponseEntity.ok(transactionService.getUserTransactions());
    }

    @GetMapping("/filter")
    public ResponseEntity<List<TransactionDto>> filterTransactions(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(transactionService.filterTransactions(startDate, endDate, categoryId));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Transaction> updateTransaction(
            @PathVariable Long id,
            @RequestParam("transaction") String transactionJson,
            @RequestPart(value = "receipt", required = false) MultipartFile receipt
    ) throws JsonProcessingException {

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule()); // Для LocalDateTime підтримки

        TransactionDto transactionDto = mapper.readValue(transactionJson, TransactionDto.class);

        Transaction updatedTransaction = transactionService.updateTransaction(id, transactionDto, receipt);
        return ResponseEntity.ok(updatedTransaction);
    }



    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }
}
