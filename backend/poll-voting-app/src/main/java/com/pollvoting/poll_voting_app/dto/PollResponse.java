package com.pollvoting.poll_voting_app.dto;


import com.pollvoting.poll_voting_app.entity.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PollResponse {
    private Long id;
    private String question;
    private PollStatus status;
    private LocalDateTime closesAt;
    private List<OptionResponse> options;
    private boolean hasVoted;
    private Long userVote;
}