package com.pollvoting.poll_voting_app.dto;

import lombok.Data;

@Data
public class OptionResponse {
    private Long id;
    private String text;
    private int votes;
}
