package com.example.expancetracker_.controller;

import com.example.expancetracker_.dto.SavingGoalDto;
import com.example.expancetracker_.entity.SavingGoal;
import com.example.expancetracker_.entity.User;
import com.example.expancetracker_.repository.SavingGoalRepository;
import com.example.expancetracker_.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class SavingGoalController {

    @Autowired
    private SavingGoalRepository goalRepo;

    @Autowired
    private AuthService authService;


    @GetMapping
    public List<SavingGoalDto> getGoals() {
        User currentUser = authService.getCurrentUser();
        List<SavingGoal> goals = goalRepo.findByUserId(currentUser.getId());

        return goals.stream().map(g -> {
            SavingGoalDto dto = new SavingGoalDto();
            dto.id = g.getId();
            dto.name = g.getName();
            dto.targetAmount = g.getTargetAmount();
            dto.currentAmount = g.getCurrentAmount();
            dto.deadline = g.getDeadline();
            dto.deadlineSoon = ChronoUnit.DAYS.between(LocalDate.now(), g.getDeadline()) <= 5;
            return dto;
        }).toList();
    }

    @PostMapping
    public SavingGoal createGoal(@RequestBody SavingGoal goal) {
        User user = authService.getCurrentUser();
        System.out.println("!!!!!!!!!!!" + user.getUsername());
        goal.setUser(user);
        return goalRepo.save(goal);
    }

    @PutMapping("/{id}")
    public SavingGoal updateGoal(@PathVariable Long id, @RequestBody SavingGoal updated) {
        SavingGoal goal = goalRepo.findById(id).orElseThrow();
        goal.setName(updated.getName());
        goal.setTargetAmount(updated.getTargetAmount());
        goal.setCurrentAmount(updated.getCurrentAmount());
        goal.setDeadline(updated.getDeadline());
        return goalRepo.save(goal);
    }

    @DeleteMapping("/{id}")
    public void deleteGoal(@PathVariable Long id) {
        goalRepo.deleteById(id);
    }

}
