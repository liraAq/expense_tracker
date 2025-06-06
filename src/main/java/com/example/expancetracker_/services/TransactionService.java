package com.example.expancetracker_.services;

import com.cloudinary.utils.ObjectUtils;
import com.example.expancetracker_.dto.CategoryDto;
import com.example.expancetracker_.dto.TransactionDto;
import com.example.expancetracker_.entity.Category;
import com.example.expancetracker_.entity.Transaction;
import com.example.expancetracker_.entity.User;
import com.example.expancetracker_.repository.CategoryRepository;
import com.example.expancetracker_.repository.TransactionRepository;
import com.example.expancetracker_.repository.UserRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.cloudinary.Cloudinary;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final Cloudinary cloudinary;

    public TransactionService(TransactionRepository transactionRepository, AuthService authService, UserRepository userRepository, CategoryRepository categoryRepository, Cloudinary cloudinary) {
        this.transactionRepository = transactionRepository;
        this.authService = authService;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.cloudinary = cloudinary;
    }


    public Transaction addTransaction(TransactionDto dto, MultipartFile receiptFile) {
        User user = authService.getCurrentUser();


        Category category = categoryRepository.findById(dto.getCategory().getId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        System.out.println("Category: " + category.getName());
        System.out.println("Category type: " + category.getType());

        System.out.println("dto type: " + dto.getType());

//        Category category = categoryRepository
//                .findByNameAndUser(dto.getCategory().getName(), user);


        // ✅ Validate type consistency: category type must match transaction type
        if (!category.getType().equals(dto.getType())) {
            throw new IllegalArgumentException("The selected category does not match the transaction type.");
        }

        // Get the date-time from DTO and handle time
        LocalDateTime localDateTime = dto.getDate();
        if (localDateTime.toLocalTime().equals(LocalTime.MIDNIGHT)) {
            localDateTime = localDateTime.with(LocalDateTime.now().toLocalTime());
        }

        // Create the transaction and set values
        Transaction transaction = new Transaction();
        transaction.setDescription(dto.getDescription());
        transaction.setAmount(dto.getAmount());
        transaction.setDate(localDateTime);
        transaction.setType(dto.getType());
        transaction.setUser(user);
        transaction.setCategory(category);

        // ✅ Upload receipt if provided
        if (receiptFile != null && !receiptFile.isEmpty()) {
            String imageUrl = uploadReceipt(receiptFile);
            transaction.setReceiptUrl(imageUrl);
        }

        return transactionRepository.save(transaction);
    }


    public Transaction updateTransaction(Long transactionId, TransactionDto dto, MultipartFile receiptFile) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        transaction.setDescription(dto.getDescription());
        transaction.setAmount(dto.getAmount());
        transaction.setDate(dto.getDate());
        transaction.setType(dto.getType());

        if (dto.getCategory().getId() != null) {
            Category category = categoryRepository.findById(dto.getCategory().getId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            transaction.setCategory(category);
        }

        if (receiptFile != null && !receiptFile.isEmpty()) {
            String imageUrl = uploadReceipt(receiptFile);
            transaction.setReceiptUrl(imageUrl);
        }

        return transactionRepository.save(transaction);
    }

    public List<TransactionDto> getUserTransactions() {
        User user = authService.getCurrentUser();

        return transactionRepository.findByUser(user).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }



    public List<TransactionDto> filterTransactions(LocalDate startDate, LocalDate endDate, Long categoryId) {
        User user = authService.getCurrentUser();
        List<Transaction> transactions = transactionRepository.findByUser(user);

        // Фільтрація за датами
        if (startDate != null && endDate != null) {
            // Перетворюємо LocalDate на LocalDateTime (з часом 00:00:00 для початку і 23:59:59 для кінця)
            LocalDateTime startDateTime = startDate.atStartOfDay(); // початок дня
            LocalDateTime endDateTime = endDate.atTime(23, 59, 59); // кінець дня

            transactions = transactions.stream()
                    .filter(t -> !t.getDate().isBefore(startDateTime) && !t.getDate().isAfter(endDateTime))
                    .collect(Collectors.toList());
        }

        // Фільтрація за категорією
        if (categoryId != null) {
            transactions = transactions.stream()
                    .filter(t -> t.getCategory().getId().equals(categoryId))
                    .collect(Collectors.toList());
        }

        // Перетворення в DTO
        return transactions.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }



    public void deleteTransaction(Long transactionId) {
        transactionRepository.deleteById(transactionId);
    }


    private TransactionDto convertToDto(Transaction transaction) {
        return new TransactionDto(
                transaction.getId(),
                transaction.getDescription(),
                transaction.getAmount(),
                transaction.getDate(),
                transaction.getType(),
                transaction.getReceiptUrl(),
                new CategoryDto(
                        transaction.getCategory().getId(),
                        transaction.getCategory().getName(),
                        transaction.getCategory().getType()
                )
        );
    }


    public String uploadReceipt(MultipartFile receiptFile) {
        try {
            String mimeType = receiptFile.getContentType();
            byte[] uploadBytes;

            // Якщо PDF — конвертуємо першу сторінку в зображення
            if ("application/pdf".equals(mimeType)) {
                PDDocument document = PDDocument.load(receiptFile.getInputStream());
                PDFRenderer pdfRenderer = new PDFRenderer(document);

                // Рендеримо тільки першу сторінку (index 0)
                BufferedImage image = pdfRenderer.renderImageWithDPI(0, 150); // 150 DPI — збалансовано
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(image, "png", baos); // або "jpg"
                uploadBytes = baos.toByteArray();

                document.close();
            } else {
                // Якщо звичайне зображення — залишаємо як є
                uploadBytes = receiptFile.getBytes();
            }

            // Завантаження в Cloudinary як зображення
            Map<String, Object> uploadParams = new HashMap<>();
            uploadParams.put("resource_type", "image");
            uploadParams.put("use_filename", true);
            uploadParams.put("filename", receiptFile.getOriginalFilename());
            uploadParams.put("unique_filename", false);

            Map uploadResult = cloudinary.uploader().upload(uploadBytes, uploadParams);
            return (String) uploadResult.get("secure_url");

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload receipt to Cloudinary", e);
        }
    }



    private String getFileExtension(String filename) {
        if (filename.lastIndexOf(".") != -1 && filename.lastIndexOf(".") != 0) {
            return filename.substring(filename.lastIndexOf(".") + 1);
        }
        return "";
    }
}