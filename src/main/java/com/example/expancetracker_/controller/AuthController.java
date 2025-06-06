package com.example.expancetracker_.controller;

import com.example.expancetracker_.config.JwtUtil;
import com.example.expancetracker_.dto.AuthRequest;
import com.example.expancetracker_.dto.AuthResponse;
import com.example.expancetracker_.dto.LoginRequest;
import com.example.expancetracker_.dto.RegisterRequest;
import com.example.expancetracker_.entity.Role;
import com.example.expancetracker_.entity.User;
import com.example.expancetracker_.repository.UserRepository;
import com.example.expancetracker_.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private final AuthService authService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest registerRequest) {
        return authService.registerUser(registerRequest.getUsername(), registerRequest.getPassword());
    }


    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request){
        return ResponseEntity.ok(authService.loginUser(request.getUsername(), request.getPassword()));
    }


}

