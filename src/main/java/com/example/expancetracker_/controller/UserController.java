package com.example.expancetracker_.controller;


import com.example.expancetracker_.dto.UpdateUserRequest;
import com.example.expancetracker_.entity.User;
import com.example.expancetracker_.services.AuthService;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    // Update user - only ADMIN can update users
    @PutMapping("/{id}")
    @Secured("ROLE_ADMIN")
    public User updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest updateUserRequest) {
        return authService.updateUser(id, updateUserRequest.getUsername(), updateUserRequest.getPassword());
    }

    // Delete user - only ADMIN can delete users
    @DeleteMapping("/{id}")
    @Secured("ROLE_ADMIN")
    public String deleteUser(@PathVariable Long id) {
        authService.deleteUser(id);
        return "User deleted successfully!";
    }
}
