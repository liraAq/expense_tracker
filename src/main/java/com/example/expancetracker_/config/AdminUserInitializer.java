package com.example.expancetracker_.config;

import com.example.expancetracker_.entity.Role;
import com.example.expancetracker_.entity.User;
import com.example.expancetracker_.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminUserInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    public CommandLineRunner createAdminUser() {
        return args -> {
            if (!userRepository.existsByUsername("admin")) {
                // Create Admin User if not exists
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("12345")); // Set a secure password
                admin.setRole(Role.ROLE_ADMIN); // Assign Admin Role
                userRepository.save(admin);
                System.out.println("Admin user created successfully!");
            }
        };
    }
}
