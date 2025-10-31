package com.pollvoting.poll_voting_app.dto;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PollRequest {
    private String question;
    private List<String> options;
    private LocalDateTime closesAt;
}