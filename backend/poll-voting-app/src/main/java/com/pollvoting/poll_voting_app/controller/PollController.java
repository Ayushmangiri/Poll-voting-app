package com.pollvoting.poll_voting_app.controller;

import com.pollvoting.poll_voting_app.config.PollService;
import com.pollvoting.poll_voting_app.dto.PollRequest;
import com.pollvoting.poll_voting_app.dto.PollResponse;
import com.pollvoting.poll_voting_app.dto.VoteRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/polls")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class PollController {

    private final PollService pollService;

    @GetMapping
    public ResponseEntity<List<PollResponse>> getAllPolls(Authentication auth) {
        return ResponseEntity.ok(pollService.getAllPolls(auth.getName()));
    }

    @PostMapping
    public ResponseEntity<PollResponse> createPoll(
            @RequestBody PollRequest request,
            Authentication auth) {
        return ResponseEntity.ok(pollService.createPoll(request, auth.getName()));
    }

    @PostMapping("/{pollId}/vote")
    public ResponseEntity<Void> vote(
            @PathVariable Long pollId,
            @RequestBody VoteRequest request,
            Authentication auth) {
        pollService.vote(pollId, request, auth.getName());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{pollId}")
    public ResponseEntity<Void> deletePoll(
            @PathVariable Long pollId,
            Authentication auth) {
        pollService.deletePoll(pollId, auth.getName());
        return ResponseEntity.ok().build();
    }
}
