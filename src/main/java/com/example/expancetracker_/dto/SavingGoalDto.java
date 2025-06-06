package com.example.expancetracker_.dto;

import java.time.LocalDate;

public class SavingGoalDto {
    public Long id;
    public String name;
    public Double targetAmount;
    public Double currentAmount;
    public LocalDate deadline;
    public boolean deadlineSoon;
}
